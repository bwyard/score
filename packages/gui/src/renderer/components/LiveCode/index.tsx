import { TransportBar } from '../shared/TransportBar.js'
import type { HardwareLevel } from '../../../main/ipc-types.js'

type Props = { readonly hardware: HardwareLevel }

/**
 * Live Code mode — Monaco editor left, visualizer right.
 * Phase 13f: Monaco integration, live eval, pattern gutter, REPL panel.
 * Phase 11b: waveform, piano roll, punchcard, scope overlays.
 */
export const LiveCode = ({ hardware }: Props) => (
  <div style={styles.root}>
    <TransportBar hardware={hardware} />

    <div style={styles.body}>
      {/* Editor pane — Phase 13f: swap placeholder for Monaco */}
      <div style={styles.editor}>
        <div style={styles.placeholder}>
          <span style={styles.placeholderIcon}>{'{ }'}</span>
          <span>Monaco editor — Phase 13f</span>
          <span style={styles.sub}>Write music as code. Live eval on save.</span>
        </div>
      </div>

      {/* Visualizer pane — Phase 11b */}
      <div style={styles.visualizer}>
        <div style={styles.placeholder}>
          <span style={styles.placeholderIcon}>〰</span>
          <span>Visualizer — Phase 11b</span>
          <span style={styles.sub}>Waveform · Piano roll · Punchcard · Scope</span>
        </div>
      </div>
    </div>
  </div>
)

const styles = {
  root:       { display: 'flex', flexDirection: 'column' as const, height: '100vh' },
  body:       { display: 'flex', flex: 1, overflow: 'hidden' },
  editor:     { flex: '0 0 60%', borderRight: '1px solid #2a2a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  visualizer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholder:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.5rem', color: '#444' },
  placeholderIcon: { fontSize: '2.5rem' },
  sub:             { fontSize: '0.75rem', color: '#333' },
} as const
