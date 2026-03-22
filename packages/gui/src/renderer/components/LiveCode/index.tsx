import { useState, useEffect, useCallback } from 'react'
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
import { ConsoleLog }                       from '../shared/ConsoleLog.js'
import type { LogEntry, LogLevel }          from '../shared/ConsoleLog.js'
import type { PunchcardTrack }              from '../visualizer/PunchcardGrid.js'
import { EvalStatus }                       from '../status/index.js'
import type { EvalStatusKind }             from '../status/EvalStatus.js'
import { BarCounter }                       from '../status/index.js'
import { PendingSwapBadge }                 from '../status/index.js'

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly hardware: HardwareLevel
  readonly onHome:   () => void
}

type PanelVisibility = {
  punchcard: boolean
  scope:     boolean
  spectrum:  boolean
  piano:     boolean
  mixer:     boolean
  console:   boolean
}

// ── Starter template ───────────────────────────────────────────────────────────

const STARTER = `import { Song, Track, Kick, Synth } from '@score/dsl'

export default Song({
  bpm: 128,
  tracks: [
    Track(Kick({
      pattern: [1, 0, 0, 0, 1, 0, 0, 0],
      volume:  0.9,
    })),
    Track(Synth({
      wave:      'sawtooth',
      frequency: 65.41,
      pattern:   [1, 0, 1, 0, 0, 1, 0, 0],
      filter:    { type: 'lowpass', frequency: 400 },
      gain:      0.7,
    })),
  ],
})`

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
  const [panels, setPanels] = useState<PanelVisibility>({
    punchcard: true,
    scope:     true,
    spectrum:  false,
    piano:     false,
    mixer:     false,
    console:   true,
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
      setError(message)
      setEvalStatus('error')
      addLog('error', message)
    })
    return unsub
  }, [addLog])

  useEffect(() => {
    const unsub = window.scoreBridge.on('song:update', ({ tracks: t }) => {
      setTracks(t)
      setStripStates(prev => t.map((_, i) => prev[i] ?? defaultStripState()))
      setEvalStatus('ok')
      setEvalTimestamp(Date.now())
      addLog('ok', `Song loaded — ${t.length} track${t.length === 1 ? '' : 's'}`)
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

  const onEval = useCallback((): void => {
    setError(null)
    setEvalStatus('pending')
    addLog('info', 'Evaluating…')
    window.scoreBridge.send('engine:eval', { code })
  }, [code, addLog])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      <TransportBar hardware={hardware} onHome={onHome} />

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

          {/* Waveform + textarea stacked — canvas is position: absolute behind textarea */}
          <div style={styles.editorArea}>
            <CodeWaveform waveform={waveform} playing={engineState.playing} />
            <textarea
              style={styles.textarea}
              value={code}
              onChange={e => { setCode(e.target.value) }}
              spellCheck={false}
              aria-label="Song code editor"
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault()
                  onEval()
                }
              }}
            />
          </div>

          {/* Console log (below textarea, collapsible) */}
          {panels.console && (
            <div style={styles.consolePane}>
              <div style={styles.consoleHeader}>
                <span style={styles.consoleLabel}>Console</span>
                <button
                  style={styles.consoleClose}
                  onClick={() => togglePanel('console')}
                  aria-label="Close console"
                >×</button>
              </div>
              <ConsoleLog entries={logEntries} />
            </div>
          )}

          <div style={styles.editorFooter}>
            <MasterLevel waveform={waveform} playing={engineState.playing} />
            <button style={styles.evalBtn} onClick={onEval} aria-label="Eval song">
              ▶ Eval
            </button>
          </div>
        </div>

        {/* Floating panel canvas */}
        <div style={styles.canvas}>
          {/* Panel toggle toolbar */}
          <div style={styles.panelToolbar}>
            <PanelToggle label="Grid"    active={panels.punchcard} onClick={() => togglePanel('punchcard')} />
            <PanelToggle label="Scope"   active={panels.scope}     onClick={() => togglePanel('scope')}     />
            <PanelToggle label="FFT"     active={panels.spectrum}  onClick={() => togglePanel('spectrum')}  />
            <PanelToggle label="Piano"   active={panels.piano}     onClick={() => togglePanel('piano')}     />
            <PanelToggle label="Mixer"   active={panels.mixer}     onClick={() => togglePanel('mixer')}     />
            <PanelToggle label="Console" active={panels.console}   onClick={() => togglePanel('console')}   />
          </div>

          {/* Floating panels */}
          {panels.punchcard && (
            <DraggablePanel
              title="Step Grid"
              defaultX={8}
              defaultY={48}
              defaultWidth={420}
              defaultHeight={180}
              onClose={() => togglePanel('punchcard')}
            >
              <PunchcardGrid
                tracks={tracks}
                currentStep={currentStep}
                stepCount={currentStepCount}
              />
            </DraggablePanel>
          )}

          {panels.scope && (
            <DraggablePanel
              title="Waveform"
              defaultX={8}
              defaultY={240}
              defaultWidth={420}
              defaultHeight={160}
              onClose={() => togglePanel('scope')}
            >
              <Scope waveform={waveform} playing={engineState.playing} />
            </DraggablePanel>
          )}

          {panels.spectrum && (
            <DraggablePanel
              title="Spectrum"
              defaultX={440}
              defaultY={48}
              defaultWidth={260}
              defaultHeight={200}
              onClose={() => togglePanel('spectrum')}
            >
              <SpectrumAnalyser bins={fftBins} playing={engineState.playing} />
            </DraggablePanel>
          )}

          {panels.piano && (
            <DraggablePanel
              title="Piano Roll"
              defaultX={440}
              defaultY={260}
              defaultWidth={260}
              defaultHeight={180}
              onClose={() => togglePanel('piano')}
            >
              <PianoRoll
                notes={[]}
                currentStep={currentStep}
                stepCount={currentStepCount}
              />
            </DraggablePanel>
          )}

          {panels.mixer && (
            <DraggablePanel
              title="Mixer"
              defaultX={8}
              defaultY={412}
              defaultWidth={420}
              defaultHeight={220}
              onClose={() => togglePanel('mixer')}
            >
              <div style={styles.mixerInner}>
                {tracks.map((track, i) => (
                  <MixerStrip
                    key={`${track.name}-${i}`}
                    name={track.name}
                    type={track.type}
                    volume={stripStates[i]?.volume ?? 1}
                    muted={stripStates[i]?.muted ?? false}
                    level={0}
                    onVolume={v => {
                      setStripStates(prev => updateStrip(prev, i, { volume: v }))
                    }}
                    onMute={() => {
                      setStripStates(prev =>
                        updateStrip(prev, i, { muted: !(prev[i]?.muted ?? false) }),
                      )
                    }}
                  />
                ))}
                {tracks.length === 0 && (
                  <span style={styles.mixerEmpty}>No tracks — eval a song first</span>
                )}
              </div>
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
  textarea: {
    flex:       1,
    background: 'transparent',
    color:      '#c8d8f8',
    border:     'none',
    outline:    'none',
    padding:    '0.75rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize:   '0.8rem',
    lineHeight: 1.65,
    resize:     'none' as const,
    tabSize:    2,
    position:   'relative' as const,
    zIndex:     1,
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
