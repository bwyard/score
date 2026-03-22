import { useState, useEffect } from 'react'
import { TransportBar } from '../shared/TransportBar.js'
import type { HardwareLevel } from '../../../main/ipc-types.js'

// ── Default starter song ───────────────────────────────────────────────────────

const STARTER = `import { Song, Kick, Synth, Pattern } from '@score/core'

const kick = Kick({
  pattern: Pattern.steps([1, 0, 0, 0, 1, 0, 0, 0]),
  volume:  0.9,
})

const bass = Synth({
  wave:    'sawtooth',
  note:    'C2',
  pattern: Pattern.steps([1, 0, 1, 0, 0, 1, 0, 0]),
  filter:  { type: 'lowpass', frequency: 400 },
  volume:  0.7,
})

export default Song({
  bpm:    140,
  tracks: [kick, bass],
})`

// ── Component ──────────────────────────────────────────────────────────────────

type Props = { readonly hardware: HardwareLevel; readonly onHome: () => void }

/**
 * Live Code mode — code editor left, visualizer right.
 * Phase 13f: swap textarea for Monaco editor.
 * Phase 11b: add waveform / piano roll / scope visualizer.
 */
export const LiveCode = ({ hardware, onHome }: Props) => {
  const [code, setCode] = useState(STARTER)
  const [log,  setLog]  = useState<readonly string[]>([])

  // BOUNDARY — IO: receive eval errors from main process
  useEffect(() => {
    const unsub = window.scoreBridge.on('error:report', ({ message }) => {
      setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${message}`])
    })
    return unsub
  }, [])

  const onEval = () => {
    // BOUNDARY — IO: send code to main process for eval + engine update
    window.scoreBridge.send('engine:eval', { code })
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Evaluating…`])
  }

  return (
    <div style={styles.root}>
      <TransportBar hardware={hardware} onHome={onHome} />

      <div style={styles.body}>
        {/* Editor pane */}
        <div style={styles.editorPane}>
          <div style={styles.editorToolbar}>
            <span style={styles.filename}>song.ts</span>
            <button style={styles.evalBtn} onClick={onEval} aria-label="Evaluate song">
              ▶ Eval
            </button>
          </div>
          <textarea
            style={styles.editor}
            value={code}
            onChange={e => { setCode(e.target.value) }}
            spellCheck={false}
            aria-label="Song code editor"
          />
          {log.length > 0 && (
            <div style={styles.repl} aria-label="Eval output">
              {log.map((line, i) => (
                <div key={i} style={line.includes('Error:') ? styles.replLineError : styles.replLine}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visualizer pane */}
        <div style={styles.visualizerPane}>
          <div style={styles.placeholder}>
            <span style={styles.placeholderIcon}>〰</span>
            <span>Visualizer — Phase 11b</span>
            <span style={styles.sub}>Waveform · Piano roll · Punchcard · Scope</span>
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
  editorToolbar: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '0.3rem 0.6rem',
    background:      '#111113',
    borderBottom:    '1px solid #1e1e22',
    flexShrink:      0,
  },
  filename: {
    fontFamily:    "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:      '0.7rem',
    color:         '#3e3e46',
    letterSpacing: '0.04em',
  },
  evalBtn: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.7rem',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    padding:       '0.2rem 0.65rem',
    background:    '#152035',
    color:         '#6a9fff',
    border:        '1px solid #2a4a7a',
    borderRadius:  '2px',
    cursor:        'pointer',
  },
  editor: {
    flex:       1,
    width:      '100%',
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
  repl: {
    borderTop:  '1px solid #1e1e22',
    background: '#060607',
    padding:    '0.4rem 0.65rem',
    maxHeight:  '100px',
    overflowY:  'auto' as const,
    flexShrink: 0,
  },
  replLine: {
    fontFamily:    "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:      '0.7rem',
    color:         '#4a6a9f',
    lineHeight:    1.6,
    letterSpacing: '0.02em',
  },
  replLineError: {
    fontFamily:    "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:      '0.7rem',
    color:         '#c05a5a',
    lineHeight:    1.6,
    letterSpacing: '0.02em',
  },

  visualizerPane: {
    flex:            1,
    display:         'flex',
    flexDirection:   'column' as const,
    alignItems:      'center',
    justifyContent:  'center',
    background:      '#0c0c0e',
  },
  placeholder:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.5rem', color: '#2e2e36' },
  placeholderIcon: { fontFamily: 'monospace', fontSize: '2rem', color: '#1e2e3e' },
  sub:             { fontFamily: 'system-ui, sans-serif', fontSize: '0.68rem', color: '#2a2a32', letterSpacing: '0.06em' },
} as const
