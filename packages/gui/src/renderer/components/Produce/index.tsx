import { TransportBar } from '../shared/TransportBar.js'
import type { HardwareLevel } from '../../../main/ipc-types.js'

type Props = { readonly hardware: HardwareLevel; readonly onHome: () => void }

/**
 * Produce mode — DAW-style arrangement view.
 * Phase 13c: audio clip editor.
 * Phase 13d: automation lanes.
 * Phase 13e: plugin architecture.
 */
export const Produce = ({ hardware, onHome }: Props) => (
  <div style={styles.root}>
    <TransportBar hardware={hardware} onHome={onHome} />

    <div style={styles.body}>
      {/* Track headers */}
      <div style={styles.trackHeaders}>
        <div style={styles.placeholder}>
          <span>Track list</span>
          <span style={styles.sub}>Phase 13 — arrangement view</span>
        </div>
      </div>

      {/* Clip timeline */}
      <div style={styles.timeline}>
        <div style={styles.placeholder}>
          <span style={styles.placeholderIcon}>▦</span>
          <span>Clip timeline — Phase 13c</span>
          <span style={styles.sub}>Automation lanes · Clip editor · Plugin inserts</span>
        </div>
      </div>
    </div>

    {/* Mixer strip — collapsible bottom */}
    <div style={styles.mixerStrip}>
      <div style={styles.placeholder}>
        <span>Mixer — Phase 13</span>
      </div>
    </div>
  </div>
)

const styles = {
  root:         { display: 'flex', flexDirection: 'column' as const, height: '100vh' },
  body:         { display: 'flex', flex: 1, overflow: 'hidden' },
  trackHeaders: { flex: '0 0 200px', borderRight: '1px solid #2a2a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  timeline:     { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mixerStrip:   { height: '140px', borderTop: '1px solid #2a2a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholder:      { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.5rem', color: '#444' },
  placeholderIcon:  { fontSize: '2.5rem' },
  sub:              { fontSize: '0.75rem', color: '#333' },
} as const
