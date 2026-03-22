import { useState, useEffect, useCallback } from 'react'
import { TransportBar }                      from '../shared/TransportBar.js'
import type { HardwareLevel }               from '../../../main/ipc-types.js'
import { PunchcardGrid }                    from '../visualizer/PunchcardGrid.js'
import { Scope }                            from '../visualizer/Scope.js'
import type { PunchcardTrack }              from '../visualizer/PunchcardGrid.js'

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly hardware: HardwareLevel
  readonly onHome:   () => void
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

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Live Code mode — textarea editor left, visualizer right.
 * Phase 11b: IPC wiring, song:update subscription, Ctrl+Enter eval.
 * Phase 13f: swap textarea for Monaco editor.
 * Phase 11b t140: wire tracks into Punchcard + Scope visualizers.
 */
export const LiveCode = ({ hardware, onHome }: Props) => {
  const [code,   setCode]   = useState(STARTER)
  const [error,  setError]  = useState<string | null>(null)
  const [tracks, setTracks] = useState<ReadonlyArray<PunchcardTrack>>([])
  const [waveform,    setWaveform]    = useState<readonly number[]>([])
  const [activeTab,   setActiveTab]   = useState<'punchcard' | 'scope'>('punchcard')
  const [engineState, setEngineState] = useState<{ playing: boolean; bars: number }>({ playing: false, bars: 0 })

  // Subscribe to error reports from the main process
  useEffect(() => {
    const unsub = window.scoreBridge.on('error:report', ({ message }) => {
      setError(message)
    })
    return unsub
  }, [])

  // Subscribe to song structure updates pushed after boot or eval
  useEffect(() => {
    const unsub = window.scoreBridge.on('song:update', ({ tracks: t }) => {
      setTracks(t)
    })
    return unsub
  }, [])

  // Subscribe to waveform data from AnalyserNode
  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:analysis', ({ waveform: w }) => {
      setWaveform(w)
    })
    return unsub
  }, [])

  // Subscribe to engine playing state and bar count
  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:state', ({ playing, bars }) => {
      setEngineState({ playing, bars })
    })
    return unsub
  }, [])

  const currentStep = engineState.bars % 8

  const onEval = useCallback((): void => {
    setError(null)
    // BOUNDARY — IO: send code to main process for eval + engine update
    window.scoreBridge.send('engine:eval', { code })
  }, [code])

  return (
    <div style={styles.root}>
      <TransportBar hardware={hardware} onHome={onHome} />

      <div style={styles.body}>
        {/* Editor pane — Phase 13f: swap for Monaco */}
        <div style={styles.editorPane}>
          {error !== null && (
            <div style={styles.errorBanner} role="alert">
              {error}
            </div>
          )}
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
          <button style={styles.evalBtn} onClick={onEval} aria-label="Eval song">
            ▶ Eval
          </button>
        </div>

        {/* Visualizer pane — Phase 11b t140: tabbed Punchcard + Scope */}
        <div style={styles.visualizer}>
          {/* Tab bar */}
          <div style={styles.tabBar}>
            <button
              style={activeTab === 'punchcard' ? { ...styles.tab, ...styles.tabActive } : styles.tab}
              onClick={() => setActiveTab('punchcard')}
            >
              Punchcard
            </button>
            <button
              style={activeTab === 'scope' ? { ...styles.tab, ...styles.tabActive } : styles.tab}
              onClick={() => setActiveTab('scope')}
            >
              Scope
            </button>
          </div>

          {/* Visualizer content */}
          <div style={styles.vizContent}>
            {activeTab === 'punchcard' && (
              <PunchcardGrid
                tracks={tracks}
                currentStep={currentStep}
                stepCount={8}
              />
            )}
            {activeTab === 'scope' && (
              <Scope
                waveform={waveform}
                playing={engineState.playing}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root:       { display: 'flex', flexDirection: 'column' as const, height: '100vh', background: '#0c0c0e' },
  body:       { display: 'flex', flex: 1, overflow: 'hidden' },
  editorPane: {
    flex:          '0 0 60%',
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
  textarea: {
    flex:       1,
    background: '#080809',
    color:      '#c8d8f8',
    border:     'none',
    outline:    'none',
    padding:    '0.75rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize:   '0.8rem',
    lineHeight: 1.65,
    resize:     'none' as const,
    tabSize:    2,
  },
  evalBtn: {
    flexShrink:    0,
    height:        '36px',
    background:    '#152035',
    border:        '1px solid #2a4a7a',
    borderRadius:  '0',
    color:         '#6a9fff',
    fontSize:      '0.75rem',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    cursor:        'pointer',
  },
  visualizer: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column' as const,
    background:    '#0c0c0e',
  },
  tabBar: {
    display:      'flex',
    flexShrink:   0,
    borderBottom: '1px solid #1e1e22',
    background:   '#0c0c0e',
  },
  tab: {
    padding:       '0.35rem 0.85rem',
    background:    'none',
    border:        'none',
    borderBottom:  '2px solid transparent',
    color:         '#3a3a46',
    fontSize:      '0.7rem',
    fontFamily:    'system-ui, sans-serif',
    letterSpacing: '0.06em',
    cursor:        'pointer',
  },
  tabActive: {
    color:        '#6a9fff',
    borderBottom: '2px solid #6a9fff',
  },
  vizContent: {
    flex:          1,
    overflow:      'hidden',
    display:       'flex',
    flexDirection: 'column' as const,
  },
} as const
