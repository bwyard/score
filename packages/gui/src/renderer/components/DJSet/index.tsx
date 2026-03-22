import { TransportBar } from '../shared/TransportBar.js'
import type { HardwareLevel } from '../../../main/ipc-types.js'

type Props = { readonly hardware: HardwareLevel }

/**
 * DJ Set mode — Score IS the DJ software when no AIO hardware is connected.
 * PC-only: full deck view with waveforms, beat grid, hot cues, crossfader, FX.
 * + Controller: same layout, hardware MIDI maps to the same handlers.
 * + AIO (Pioneer XDJ): AIO display becomes primary; Score mirrors state.
 *
 * Phase 12e: deck management, BPM analysis, key detection, hot cues,
 *            library/crate management, two-deck sync engine, stem separation.
 */
export const DJSet = ({ hardware }: Props) => (
  <div style={styles.root}>
    <TransportBar hardware={hardware} />

    <div style={styles.body}>
      {/* Deck A */}
      <div style={styles.deck}>
        <div style={styles.placeholder}>
          <span style={styles.placeholderIcon}>⊙</span>
          <span>Deck A — Phase 12e</span>
          <span style={styles.sub}>Waveform · Beat grid · Hot cues · Loops</span>
        </div>
      </div>

      {/* Centre strip — crossfader + FX */}
      <div style={styles.centreStrip}>
        <div style={styles.placeholder}>
          <span>FX + Crossfader</span>
          <span style={styles.sub}>Phase 12e</span>
        </div>
      </div>

      {/* Deck B */}
      <div style={styles.deck}>
        <div style={styles.placeholder}>
          <span style={styles.placeholderIcon}>⊙</span>
          <span>Deck B — Phase 12e</span>
          <span style={styles.sub}>Waveform · Beat grid · Hot cues · Loops</span>
        </div>
      </div>
    </div>

    {/* Library / crate browser */}
    <div style={styles.library}>
      <div style={styles.placeholder}>
        <span>Track library — Phase 12e</span>
        <span style={styles.sub}>
          {hardware === 'aio' ? 'AIO display mirrors library' : 'Drag tracks to decks'}
        </span>
      </div>
    </div>
  </div>
)

const styles = {
  root:        { display: 'flex', flexDirection: 'column' as const, height: '100vh' },
  body:        { display: 'flex', flex: 1, overflow: 'hidden' },
  deck:        { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #2a2a2e' },
  centreStrip: { flex: '0 0 180px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #2a2a2e' },
  library:     { height: '200px', borderTop: '1px solid #2a2a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholder:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.5rem', color: '#444' },
  placeholderIcon: { fontSize: '2.5rem' },
  sub:             { fontSize: '0.75rem', color: '#333' },
} as const
