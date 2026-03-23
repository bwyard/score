import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { TransportBar }                      from '../shared/TransportBar.js'
import type { HardwareLevel }               from '../../../main/ipc-types.js'
import { PunchcardGrid }                    from '../visualizer/PunchcardGrid.js'
import { Scope }                            from '../visualizer/Scope.js'
import { SpectrumAnalyser }                 from '../visualizer/SpectrumAnalyser.js'
import { PianoRoll }                        from '../visualizer/PianoRoll.js'
import { MasterLevel }                      from '../shared/MasterLevel.js'
import { MixerStrip }                       from '../shared/MixerStrip.js'
import { DraggablePanel }                   from '../shared/DraggablePanel.js'
import { CodeWaveform }                     from '../shared/CodeWaveform.js'
import { getActiveLines, getStepBadges }    from '../shared/CodeHighlight.js'
import { CodeEditorPanel }                  from '../shared/CodeEditorPanel.js'
import type { EditorDecoration, StepBadge } from '../shared/CodeEditorPanel.js'
import { ReferencePanel }                   from '../shared/ReferencePanel.js'
import { ConsoleLog }                       from '../shared/ConsoleLog.js'
import type { LogEntry, LogLevel }          from '../shared/ConsoleLog.js'
import type { PunchcardTrack }              from '../visualizer/PunchcardGrid.js'
import { EvalStatus }                       from '../status/index.js'
import type { EvalStatusKind }             from '../status/EvalStatus.js'
import { BarCounter }                       from '../status/index.js'
import { PendingSwapBadge }                 from '../status/index.js'
import { patchBpm, patchTrackPattern, patchTrackVolume, patchTrackNote, patchChainMethod } from '../../lib/codePatcher.js'
import { InstrumentPanel } from '../shared/InstrumentPanel.js'
import type { PianoRollNote }              from '../visualizer/PianoRoll.js'
import type { PanelLayoutMap }            from '../../../main/ipc-types.js'

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly hardware: HardwareLevel
  readonly onHome:   () => void
}

type PanelVisibility = {
  punchcard:  boolean
  scope:      boolean
  spectrum:   boolean
  piano:      boolean
  mixer:      boolean
  console:    boolean
  reference:  boolean
}

// ── Starter template ───────────────────────────────────────────────────────────

const STARTER = `import { Song, Kick808, Snare909, Hihat808, Bass303 } from '@score/dsl'

const kick  = Kick808().hits(0, 4, 8, 12).volume(0.7)
const snare = Snare909().hits(4, 12).volume(0.55)
const hihat = Hihat808().euclidean(8, 16).volume(0.25)
const bass  = Bass303('A2').filter(600).resonance(0.4)
  .pattern(['A2', 0, 0, 0,  'D3', 0, 0, 0,  'A2', 0, 0, 0,  'D3', 0, 0, 0])
  .volume(0.6)

export default Song({ bpm: 128, tracks: [kick, snare, hihat, bass] })`

// ── Log helpers ────────────────────────────────────────────────────────────────

const mkEntry = (level: LogLevel, message: string): LogEntry => ({
  id:      Date.now() + Math.random(),
  level,
  message,
  time:    Date.now(),
})

// ── Mixer strip state ──────────────────────────────────────────────────────────

type StripState = {
  readonly volume: number
  readonly muted:  boolean
}

const defaultStripState = (): StripState => ({ volume: 1, muted: false })

const updateStrip = (
  prev: ReadonlyArray<StripState>,
  index: number,
  patch: Partial<StripState>,
): ReadonlyArray<StripState> =>
  prev.map((s, i) => (i === index ? { ...s, ...patch } : s))

// ── Panel toggle button ─────────────────────────────────────────────────────────

type PanelToggleProps = {
  readonly label:   string
  readonly active:  boolean
  readonly onClick: () => void
}

const PanelToggle = ({ label, active, onClick }: PanelToggleProps) => (
  <button
    aria-pressed={active}
    onClick={onClick}
    style={{
      padding:       '0.2rem 0.5rem',
      background:    active ? '#152035' : 'none',
      border:        active ? '1px solid #2a4a7a' : '1px solid #1e1e22',
      borderRadius:  '2px',
      color:         active ? '#6a9fff' : '#3a3a46',
      fontSize:      '0.65rem',
      fontFamily:    'system-ui, sans-serif',
      letterSpacing: '0.06em',
      cursor:        'pointer',
    }}
  >
    {label}
  </button>
)

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Live Code mode — editor on the left, floating visualizer panels on the right.
 * Code waveform rendered behind the textarea (Strudl/TidalCycles aesthetic).
 * Phase 11b t140-t141: all visualizers, status bar, floating panel layout.
 * Phase 13f: swap textarea for Monaco editor with beat highlighting.
 */
export const LiveCode = ({ hardware, onHome }: Props) => {
  const [code,   setCode]   = useState(STARTER)
  const [error,  setError]  = useState<string | null>(null)
  const [tracks, setTracks] = useState<ReadonlyArray<PunchcardTrack>>([])
  const [waveform,    setWaveform]    = useState<readonly number[]>([])
  const [engineState, setEngineState] = useState<{ playing: boolean; bpm: number; bars: number }>({
    playing: false, bpm: 128, bars: 0,
  })
  const [currentStep,      setCurrentStep]      = useState(0)
  const [currentStepCount, setCurrentStepCount] = useState(8)
  const [evalStatus,    setEvalStatus]    = useState<EvalStatusKind>('idle')
  const [evalTimestamp, setEvalTimestamp] = useState<number | undefined>(undefined)
  const [pendingSwap, setPendingSwap] = useState(false)
  const [stripStates, setStripStates] = useState<ReadonlyArray<StripState>>([])
  const [fftBins,     setFftBins]     = useState<readonly number[]>([])
  const [logEntries,  setLogEntries]  = useState<ReadonlyArray<LogEntry>>([])
  const [pianoNotes,  setPianoNotes]  = useState<ReadonlyArray<PianoRollNote>>([])
  // t220 — import visibility toggle (stub: fold/unfold in Monaco; auto-inject deferred for DSL chain API)
  const [importsVisible, setImportsVisible] = useState(true)
  // Instrument panel — which track is currently selected (null = none)
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null)
  // Set to true when the user clicks play before eval — song:update handler will
  // fire transport:play once the eval succeeds (eval-then-play flow).
  const autoPlayRef      = useRef(false)
  // Debounce timer for re-eval after instrument param changes
  const evalDebounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // t218 — panel layout persistence
  const [savedLayout, setSavedLayout] = useState<PanelLayoutMap>({})
  // Track layout generation so DraggablePanels remount once when saved layout loads
  const [layoutGen, setLayoutGen] = useState(0)
  // Accumulate panel positions for debounced save (ref avoids extra re-renders)
  const layoutAccRef = useRef<PanelLayoutMap>({})

  // Monaco beat-highlight decorations — active track lines while playing
  const editorDecorations = useMemo((): ReadonlyArray<EditorDecoration> => {
    if (!engineState.playing) return []
    const activeLines = getActiveLines(code, tracks, currentStep)
    return activeLines.map(zeroIdx => ({
      startLine:   zeroIdx + 1,  // Monaco is 1-based
      endLine:     zeroIdx + 1,
      className:   'score-beat-active',
      isWholeLine: true,
    }))
  }, [engineState.playing, code, tracks, currentStep])
  // t219 — step badges: per-instrument line `STEP/TOTAL` pills during playback
  const stepBadges = useMemo((): ReadonlyArray<StepBadge> =>
    engineState.playing
      ? getStepBadges(code, tracks, currentStep, currentStepCount)
      : []
  , [engineState.playing, code, tracks, currentStep, currentStepCount])

  const [panels, setPanels] = useState<PanelVisibility>({
    punchcard:  true,
    scope:      true,
    spectrum:   false,
    piano:      false,
    mixer:      false,
    console:    true,
    reference:  true,
  })

  const togglePanel = useCallback((key: keyof PanelVisibility): void => {
    setPanels(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const addLog = useCallback((level: LogLevel, message: string): void => {
    setLogEntries(prev => [...prev.slice(-199), mkEntry(level, message)])
  }, [])

  // ── IPC subscriptions ──────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = window.scoreBridge.on('error:report', ({ message }) => {
      autoPlayRef.current = false
      setError(message)
      setEvalStatus('error')
      addLog('error', message)
    })
    return unsub
  }, [addLog])

  useEffect(() => {
    const unsub = window.scoreBridge.on('song:error', ({ message, fix }) => {
      autoPlayRef.current = false
      setError(message)
      setEvalStatus('error')
      addLog('error', message)
      if (fix) addLog('info', `💡 ${fix}`)
    })
    return unsub
  }, [addLog])

  useEffect(() => {
    const unsub = window.scoreBridge.on('song:update', ({ tracks: t }) => {
      setTracks(t)
      setStripStates(prev => t.map((_, i) => prev[i] ?? defaultStripState()))
      setEvalStatus('ok')
      setEvalTimestamp(Date.now())
      addLog('ok', `Song loaded — ${String(t.length)} track${t.length === 1 ? '' : 's'}`)
      // Auto-play after eval when the user clicked play (not standalone Eval btn)
      if (autoPlayRef.current) {
        autoPlayRef.current = false
        window.scoreBridge.send('transport:play', undefined)
      }
    })
    return unsub
  }, [addLog])

  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:analysis', ({ waveform: w }) => {
      setWaveform(w)
      const binCount  = 32
      const chunkSize = Math.floor(w.length / binCount)
      const bins = Array.from({ length: binCount }, (_, b) => {
        const start = b * chunkSize
        const chunk = w.slice(start, start + chunkSize)
        return Math.sqrt(chunk.reduce((s, v) => s + v * v, 0) / Math.max(chunk.length, 1))
      })
      setFftBins(bins)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:state', ({ playing, bpm, bars }) => {
      setEngineState(prev => {
        if (prev.playing !== playing) {
          addLog('info', playing ? '▶ Playing' : '■ Stopped')
        }
        return { playing, bpm, bars }
      })
    })
    return unsub
  }, [addLog])

  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:step', ({ step, stepCount }) => {
      setCurrentStep(step)
      setCurrentStepCount(stepCount)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:pending', ({ pending }) => {
      setPendingSwap(pending)
      if (pending) addLog('warn', 'Swap queued — applying at next bar boundary')
    })
    return unsub
  }, [addLog])

  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:notes', ({ notes }) => {
      setPianoNotes(notes.map(n => ({
        pitch:    n.pitch,
        step:     n.step,
        velocity: n.velocity,
        duration: 1,
      })))
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = window.scoreBridge.on('debug:pop', ({ maxDelta, bars }) => {
      addLog('warn', `POP detected at bar ${String(bars)} — max delta ${maxDelta.toFixed(3)} (threshold 0.25). Likely gain staging or scheduling jitter.`)
    })
    return unsub
  }, [addLog])

  // t218 — receive saved panel layout from main on launch
  useEffect(() => {
    const unsub = window.scoreBridge.on('layout:load', (layout) => {
      layoutAccRef.current = layout
      setSavedLayout(layout)
      setLayoutGen(g => g + 1)
    })
    return unsub
  }, [])

  // t207 — panic key: Ctrl+. / Cmd+. renderer fallback (globalShortcut handles main process)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === '.' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        window.scoreBridge.send('transport:stop', undefined)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown) }
  }, [])

  useEffect(() => {
    const unsub = window.scoreBridge.on('file:opened', ({ code: loadedCode }) => {
      setCode(loadedCode)
      setError(null)
      setEvalStatus('idle')
      addLog('info', 'File opened')
    })
    return unsub
  }, [addLog])

  // t218 — called by each DraggablePanel after drag/resize ends; debounced save to main
  const onPanelMoved = useCallback((panelId: string, x: number, y: number, w: number, h: number): void => {
    layoutAccRef.current = { ...layoutAccRef.current, [panelId]: { x, y, w, h } }
    window.scoreBridge.send('layout:save', layoutAccRef.current)
  }, [])

  const onEval = useCallback((): void => {
    setError(null)
    setEvalStatus('pending')
    addLog('info', 'Evaluating…')
    window.scoreBridge.send('engine:eval', { code })
  }, [code, addLog])

  // Play: always eval the current code first, then auto-start once song:update fires.
  // This mirrors TidalCycles / Strudl — pressing play runs the code.
  const onPlay = useCallback((): void => {
    autoPlayRef.current = true
    setError(null)
    setEvalStatus('pending')
    addLog('info', 'Evaluating…')
    window.scoreBridge.send('engine:eval', { code })
  }, [code, addLog])

  const onStop = useCallback((): void => {
    autoPlayRef.current = false
    setPianoNotes([])
    window.scoreBridge.send('transport:stop', undefined)
  }, [])

  // Run: eval+play when stopped, eval-only (hot-swap) when playing.
  const onRun = useCallback((): void => {
    setError(null)
    setEvalStatus('pending')
    addLog('info', 'Evaluating…')
    if (!engineState.playing) {
      autoPlayRef.current = true
    }
    window.scoreBridge.send('engine:eval', { code })
  }, [code, addLog, engineState.playing])

  const onMixerVolume = useCallback((index: number, volume: number): void => {
    setStripStates(prev => updateStrip(prev, index, { volume }))
    window.scoreBridge.send('engine:patch', { tracks: [{ index, volume }] })
    setCode(prev => patchTrackVolume(prev, index, volume))
  }, [])

  const onMixerMute = useCallback((index: number): void => {
    // Read current muted state synchronously (user event — closure is fresh)
    const mute = !(stripStates[index]?.muted ?? false)
    setStripStates(prev => updateStrip(prev, index, { muted: mute }))
    window.scoreBridge.send('engine:patch', { tracks: [{ index, mute }] })
  }, [stripStates])

  /**
   * Optimistic UI: patch code immediately, then re-eval after 300ms idle.
   * Prevents 60fps re-evals during slider drag while keeping the editor in sync.
   */
  const onInstrumentChange = useCallback((trackIndex: number, method: string, value: number | string): void => {
    setCode(prev => patchChainMethod(prev, trackIndex, method, value))
    if (evalDebounceRef.current !== null) clearTimeout(evalDebounceRef.current)
    evalDebounceRef.current = setTimeout(() => {
      setError(null)
      setEvalStatus('pending')
      addLog('info', 'Evaluating…')
      // Read latest code via functional setCode to avoid stale closure
      setCode(latest => {
        window.scoreBridge.send('engine:eval', { code: latest })
        return latest
      })
    }, 300)
  }, [addLog])

  const onInstrumentMute = useCallback((trackIndex: number): void => {
    onMixerMute(trackIndex)
  }, [onMixerMute])

  const onBpmChange = useCallback((bpm: number): void => {
    setCode(prev => patchBpm(prev, bpm))
    if (evalDebounceRef.current !== null) clearTimeout(evalDebounceRef.current)
    evalDebounceRef.current = setTimeout(() => {
      setError(null)
      setEvalStatus('pending')
      addLog('info', 'Evaluating…')
      setCode(latest => {
        window.scoreBridge.send('engine:eval', { code: latest })
        return latest
      })
    }, 300)
  }, [addLog])

  const onStepClick = useCallback((trackIndex: number, stepIndex: number): void => {
    const track = tracks[trackIndex]
    if (!track) return
    const len = track.pattern.length
    if (len === 0) return
    const currentVal = track.pattern[stepIndex % len]
    const newVal = currentVal ? 0 : 1
    setCode(prev => patchTrackPattern(prev, trackIndex, stepIndex, newVal))
    if (evalDebounceRef.current !== null) clearTimeout(evalDebounceRef.current)
    evalDebounceRef.current = setTimeout(() => {
      setError(null)
      setEvalStatus('pending')
      addLog('info', 'Evaluating…')
      setCode(latest => {
        window.scoreBridge.send('engine:eval', { code: latest })
        return latest
      })
    }, 300)
  }, [tracks, addLog])

  const onNoteClick = useCallback((pitch: number, step: number): void => {
    // Find the Arp track (first track with type 'arp') — that's what the piano roll shows
    const arpIndex = tracks.findIndex(t => t.type === 'arp')
    if (arpIndex === -1) return

    // Convert MIDI pitch to note name for patching
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const octave = Math.floor(pitch / 12) - 1
    const noteName = `${noteNames[pitch % 12] ?? 'C'}${String(octave)}`

    setCode(prev => patchTrackNote(prev, arpIndex, step, noteName))
  }, [tracks])

  // Smart insert — appends snippet inside the tracks: [...] array rather than at cursor.
  // Falls back to end-of-file append if no tracks array is found.
  const onInsert = useCallback((snippet: string): void => {
    setCode(prev => {
      const tracksIdx = prev.indexOf('tracks:')
      if (tracksIdx === -1) return prev + '\n' + snippet

      const openBracket = prev.indexOf('[', tracksIdx)
      if (openBracket === -1) return prev + '\n' + snippet

      // Bracket-count to find the matching close bracket (pure fold — no let)
      const closeBracket = Array.from(prev.slice(openBracket + 1)).reduce(
        (acc: { depth: number; pos: number }, ch: string, idx: number) =>
          acc.pos !== -1 ? acc : (() => {
            const d = acc.depth + (ch === '[' ? 1 : ch === ']' ? -1 : 0)
            return { depth: d, pos: d === 0 ? openBracket + 1 + idx : -1 }
          })(),
        { depth: 1, pos: -1 },
      ).pos

      // Detect indentation of the line before the close bracket
      const beforeClose = prev.slice(0, closeBracket)
      const lastNewline  = beforeClose.lastIndexOf('\n')
      const lineContent  = lastNewline !== -1 ? beforeClose.slice(lastNewline + 1) : ''
      const indentMatch  = lineContent.match(/^(\s+)/)
      const indent       = indentMatch?.[1] ?? '    '

      return `${prev.slice(0, closeBracket)},\n${indent}${snippet}${prev.slice(closeBracket)}`
    })
  }, [])

  const onNew = useCallback((): void => {
    setCode(STARTER)
    setError(null)
    setEvalStatus('idle')
    setTracks([])
    setPianoNotes([])
    setStripStates([])
    setLogEntries([])
  }, [])

  const onSave = useCallback((): void => {
    window.scoreBridge.send('file:save', { code })
  }, [code])

  const onOpen = useCallback((): void => {
    window.scoreBridge.send('file:open', undefined)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      <TransportBar hardware={hardware} onHome={onHome} onPlay={onPlay} onStop={onStop} onBpmChange={onBpmChange} />

      {/* Status bar */}
      <div style={styles.statusBar}>
        <BarCounter
          bars={engineState.bars}
          step={currentStep}
          stepCount={currentStepCount}
          bpm={engineState.bpm}
          playing={engineState.playing}
        />
        <div style={styles.statusRight}>
          {pendingSwap && (
            <PendingSwapBadge
              pending={pendingSwap}
              step={currentStep}
              stepCount={currentStepCount}
            />
          )}
          <EvalStatus
            status={evalStatus}
            {...(error !== null          ? { message:   error         } : {})}
            {...(evalTimestamp !== undefined ? { timestamp: evalTimestamp } : {})}
          />
        </div>
      </div>

      <div style={styles.body}>
        {/* Editor pane — CodeWaveform behind textarea, Strudl aesthetic */}
        <div style={styles.editorPane}>
          {error !== null && (
            <div style={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          {/* Monaco editor + waveform overlay stacked */}
          {/* z-index 0: CodeWaveform (canvas behind)  1: Monaco editor */}
          <div style={styles.editorArea}>
            <CodeWaveform
              waveform={waveform}
              playing={engineState.playing}
              currentStep={currentStep}
              stepCount={currentStepCount}
            />
            <div style={styles.monacoWrapper} aria-label="Song code editor">
              <CodeEditorPanel
                value={code}
                onChange={setCode}
                onEval={onEval}
                decorations={editorDecorations}
                stepBadges={stepBadges}
                importsVisible={importsVisible}
              />
            </div>
          </div>

          {/* Console log (below textarea, collapsible) */}
          {panels.console && (
            <div style={styles.consolePane}>
              <div style={styles.consoleHeader}>
                <span style={styles.consoleLabel}>Console</span>
                <button
                  style={styles.consoleClose}
                  onClick={() => { togglePanel('console') }}
                  aria-label="Close console"
                >×</button>
              </div>
              <ConsoleLog entries={logEntries} />
            </div>
          )}

          <div style={styles.editorFooter}>
            <MasterLevel waveform={waveform} playing={engineState.playing} />
            <div style={styles.footerBtns}>
              <button style={styles.fileBtn} onClick={onNew}  aria-label="New song">New</button>
              <button style={styles.fileBtn} onClick={onOpen} aria-label="Open song">Open</button>
              <button style={styles.fileBtn} onClick={onSave} aria-label="Save song">Save</button>
              <button style={styles.evalBtn} onClick={onRun}  aria-label="Run song">▶ Run</button>
            </div>
          </div>
        </div>

        {/* Floating panel canvas */}
        <div style={styles.canvas}>
          {/* Panel toggle toolbar */}
          <div style={styles.panelToolbar}>
            <PanelToggle label="Grid"    active={panels.punchcard}  onClick={() => { togglePanel('punchcard') }}  />
            <PanelToggle label="Scope"   active={panels.scope}      onClick={() => { togglePanel('scope') }}      />
            <PanelToggle label="FFT"     active={panels.spectrum}   onClick={() => { togglePanel('spectrum') }}   />
            <PanelToggle label="Piano"   active={panels.piano}      onClick={() => { togglePanel('piano') }}      />
            <PanelToggle label="Mixer"   active={panels.mixer}      onClick={() => { togglePanel('mixer') }}      />
            <PanelToggle label="Console" active={panels.console}    onClick={() => { togglePanel('console') }}    />
            <PanelToggle label="Ref"     active={panels.reference}  onClick={() => { togglePanel('reference') }}  />
            {/* t220 — import visibility toggle */}
            <PanelToggle label="Imports" active={importsVisible}    onClick={() => { setImportsVisible(v => !v) }} />
          </div>

          {/* Floating panels */}
          {panels.punchcard && (
            <DraggablePanel
              key={`punchcard-${String(layoutGen)}`}
              title="Step Grid"
              defaultX={savedLayout['punchcard']?.x ?? 8}
              defaultY={savedLayout['punchcard']?.y ?? 48}
              defaultWidth={savedLayout['punchcard']?.w ?? 420}
              defaultHeight={savedLayout['punchcard']?.h ?? 180}
              onClose={() => { togglePanel('punchcard') }}
              panelId="punchcard"
              onMoved={onPanelMoved}
            >
              <PunchcardGrid
                tracks={tracks}
                currentStep={currentStep}
                stepCount={currentStepCount}
                onStepClick={onStepClick}
              />
            </DraggablePanel>
          )}

          {panels.scope && (
            <DraggablePanel
              key={`scope-${String(layoutGen)}`}
              title="Waveform"
              defaultX={savedLayout['scope']?.x ?? 8}
              defaultY={savedLayout['scope']?.y ?? 240}
              defaultWidth={savedLayout['scope']?.w ?? 420}
              defaultHeight={savedLayout['scope']?.h ?? 160}
              onClose={() => { togglePanel('scope') }}
              panelId="scope"
              onMoved={onPanelMoved}
            >
              <Scope waveform={waveform} playing={engineState.playing} />
            </DraggablePanel>
          )}

          {panels.spectrum && (
            <DraggablePanel
              key={`spectrum-${String(layoutGen)}`}
              title="Spectrum"
              defaultX={savedLayout['spectrum']?.x ?? 440}
              defaultY={savedLayout['spectrum']?.y ?? 48}
              defaultWidth={savedLayout['spectrum']?.w ?? 260}
              defaultHeight={savedLayout['spectrum']?.h ?? 200}
              onClose={() => { togglePanel('spectrum') }}
              panelId="spectrum"
              onMoved={onPanelMoved}
            >
              <SpectrumAnalyser bins={fftBins} playing={engineState.playing} />
            </DraggablePanel>
          )}

          {panels.piano && (
            <DraggablePanel
              key={`piano-${String(layoutGen)}`}
              title="Piano Roll"
              defaultX={savedLayout['piano']?.x ?? 440}
              defaultY={savedLayout['piano']?.y ?? 260}
              defaultWidth={savedLayout['piano']?.w ?? 260}
              defaultHeight={savedLayout['piano']?.h ?? 180}
              onClose={() => { togglePanel('piano') }}
              panelId="piano"
              onMoved={onPanelMoved}
            >
              <PianoRoll
                notes={pianoNotes}
                currentStep={currentStep}
                stepCount={currentStepCount}
                onNoteClick={onNoteClick}
              />
            </DraggablePanel>
          )}

          {panels.mixer && (
            <DraggablePanel
              key={`mixer-${String(layoutGen)}`}
              title="Mixer"
              defaultX={savedLayout['mixer']?.x ?? 8}
              defaultY={savedLayout['mixer']?.y ?? 412}
              defaultWidth={savedLayout['mixer']?.w ?? 420}
              defaultHeight={savedLayout['mixer']?.h ?? 220}
              onClose={() => { togglePanel('mixer') }}
              panelId="mixer"
              onMoved={onPanelMoved}
            >
              <div style={styles.mixerInner}>
                {tracks.map((track, i) => (
                  <div
                    key={`${track.name}-${String(i)}`}
                    style={{ outline: selectedTrack === i ? '1px solid #4a8fff' : 'none', cursor: 'pointer' }}
                    onClick={() => { setSelectedTrack(prev => prev === i ? null : i) }}
                    aria-label={`Select ${track.name} track`}
                  >
                    <MixerStrip
                      name={track.name}
                      type={track.type}
                      volume={stripStates[i]?.volume ?? 1}
                      muted={stripStates[i]?.muted ?? false}
                      level={0}
                      onVolume={v => { onMixerVolume(i, v) }}
                      onMute={() => { onMixerMute(i) }}
                    />
                  </div>
                ))}
                {tracks.length === 0 && (
                  <span style={styles.mixerEmpty}>No tracks — eval a song first</span>
                )}
              </div>
              {selectedTrack !== null && tracks[selectedTrack] !== undefined && (
                <InstrumentPanel
                  trackIndex={selectedTrack}
                  instrumentType={tracks[selectedTrack].type}
                  trackName={tracks[selectedTrack].name}
                  params={{ volume: stripStates[selectedTrack]?.volume ?? 1 }}
                  muted={stripStates[selectedTrack]?.muted ?? false}
                  onChange={(method: string, value: number | string) => { onInstrumentChange(selectedTrack, method, value) }}
                  onMute={() => { onInstrumentMute(selectedTrack) }}
                />
              )}
            </DraggablePanel>
          )}

          {panels.reference && (
            <DraggablePanel
              key={`reference-${String(layoutGen)}`}
              title="Reference"
              defaultX={savedLayout['reference']?.x ?? 440}
              defaultY={savedLayout['reference']?.y ?? 48}
              defaultWidth={savedLayout['reference']?.w ?? 260}
              defaultHeight={savedLayout['reference']?.h ?? 380}
              onClose={() => { togglePanel('reference') }}
              panelId="reference"
              onMoved={onPanelMoved}
            >
              <ReferencePanel onInsert={onInsert} />
            </DraggablePanel>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root:       { display: 'flex', flexDirection: 'column' as const, height: '100vh', background: '#0c0c0e' },
  statusBar: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 0.75rem',
    height:         '36px',
    flexShrink:     0,
    borderBottom:   '1px solid #1e1e22',
    background:     '#0a0a0d',
  },
  statusRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.5rem',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  editorPane: {
    flex:          '0 0 50%',
    borderRight:   '1px solid #1e1e22',
    display:       'flex',
    flexDirection: 'column' as const,
    background:    '#0d0d10',
  },
  errorBanner: {
    background:   '#3a1a1a',
    color:        '#ff6b6b',
    padding:      '0.4rem 0.75rem',
    fontSize:     '0.75rem',
    borderBottom: '1px solid #5a2a2a',
    flexShrink:   0,
    fontFamily:   "'JetBrains Mono', 'Fira Code', monospace",
  },
  // Container for waveform + textarea stacked absolutely
  editorArea: {
    flex:     1,
    position: 'relative' as const,
    display:  'flex',
  },
  monacoWrapper: {
    flex:     1,
    position: 'relative' as const,
    zIndex:   1,
    // Monaco needs an explicit height to fill flex container
    minHeight: 0,
  },
  consolePane: {
    flexShrink:    0,
    height:        '120px',
    borderTop:     '1px solid #1e1e22',
    display:       'flex',
    flexDirection: 'column' as const,
    background:    '#080809',
  },
  consoleHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 0.5rem',
    height:         '22px',
    flexShrink:     0,
    borderBottom:   '1px solid #141418',
    background:     '#0a0a0d',
  },
  consoleLabel: {
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      '0.6rem',
    color:         '#3a3a46',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  consoleClose: {
    background: 'none',
    border:     'none',
    color:      '#3a3a46',
    cursor:     'pointer',
    fontSize:   '1rem',
    lineHeight: 1,
    padding:    '0',
  },
  editorFooter: {
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '4px 8px',
    borderTop:      '1px solid #1e1e22',
    background:     '#0a0a0d',
  },
  footerBtns: {
    display:    'flex',
    gap:        '6px',
    alignItems: 'center',
  },
  fileBtn: {
    height:        '28px',
    background:    'none',
    border:        '1px solid #1e1e28',
    borderRadius:  '2px',
    color:         '#3a3a50',
    fontSize:      '0.68rem',
    letterSpacing: '0.06em',
    cursor:        'pointer',
    padding:       '0 0.6rem',
  },
  evalBtn: {
    height:        '28px',
    background:    '#152035',
    border:        '1px solid #2a4a7a',
    borderRadius:  '2px',
    color:         '#6a9fff',
    fontSize:      '0.75rem',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    cursor:        'pointer',
    padding:       '0 1rem',
  },
  canvas: {
    flex:       1,
    position:   'relative' as const,
    overflow:   'hidden',
    background: '#090909',
  },
  panelToolbar: {
    position: 'absolute' as const,
    top:      8,
    left:     8,
    zIndex:   200,
    display:  'flex',
    gap:      '4px',
  },
  mixerInner: {
    display:  'flex',
    flexWrap: 'wrap' as const,
    gap:      '4px',
    padding:  '6px',
  },
  mixerEmpty: {
    color:      '#3a3a46',
    fontSize:   '0.75rem',
    fontFamily: "'JetBrains Mono', monospace",
    padding:    '8px',
  },
} as const
