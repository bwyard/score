// ── Scope — Phase 11b ─────────────────────────────────────────────────────────
// Oscilloscope waveform visualizer. Receives Float32-converted waveform data
// from engine:analysis IPC channel at ~20fps while playing.
// TODO: implement canvas rendering + requestAnimationFrame loop (t138)

type Props = {
  readonly waveform: readonly number[]
  readonly playing:  boolean
}

/** Placeholder — canvas impl in t138. */
export const Scope = (_props: Props) => (
  <div style={styles.root}>
    <span style={styles.label}>Scope — t138</span>
  </div>
)

const styles = {
  root:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080809' },
  label: { fontFamily: 'monospace', fontSize: '0.7rem', color: '#2a3a4a' },
} as const
