import { useState }    from 'react'
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

  const onEval = () => {
    // BOUNDARY — IO: eval output only, no actual audio in Phase 13 scaffold
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Evaluated — engine integration Phase 13b`])
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
              {log.map((line, i) => <div key={i} style={styles.replLine}>{line}</div>)}
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
  root:       { display: 'flex', flexDirection: 'column' as const, height: '100vh' },
  body:       { display: 'flex', flex: 1, overflow: 'hidden' },

  editorPane: { flex: '0 0 60%', borderRight: '1px solid #2a2a2e', display: 'flex', flexDirection: 'column' as const },
  editorToolbar: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0.4rem 0.75rem',
    background:     '#141418',
    borderBottom:   '1px solid #2a2a2e',
  },
  filename: { fontSize: '0.8rem', color: '#666', fontFamily: 'monospace' },
  evalBtn:  {
    padding:      '0.25rem 0.75rem',
    background:   '#4a8fff',
    color:        '#fff',
    border:       'none',
    borderRadius: '4px',
    cursor:       'pointer',
    fontSize:     '0.8rem',
    fontWeight:   600,
  },
  editor: {
    flex:        1,
    width:       '100%',
    background:  '#0d0d0f',
    color:       '#e8e8e8',
    border:      'none',
    outline:     'none',
    padding:     '1rem',
    fontFamily:  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize:    '0.85rem',
    lineHeight:  1.6,
    resize:      'none' as const,
    tabSize:     2,
  },
  repl: {
    borderTop:  '1px solid #2a2a2e',
    background: '#0a0a0c',
    padding:    '0.5rem 0.75rem',
    maxHeight:  '120px',
    overflowY:  'auto' as const,
  },
  replLine: { fontSize: '0.75rem', color: '#4a8fff', fontFamily: 'monospace', lineHeight: 1.6 },

  visualizerPane: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholder:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.5rem', color: '#444' },
  placeholderIcon: { fontSize: '2.5rem' },
  sub:             { fontSize: '0.75rem', color: '#333' },
} as const
