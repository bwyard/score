// ── PunchcardGrid — Phase 11b ──────────────────────────────────────────────────
// Step-pattern grid visualizer. One row per track, animated beat cursor.
// Receives parsed track data from song:update IPC channel.
// TODO: implement canvas rendering (t137)

export type PunchcardTrack = {
  readonly name:    string
  readonly type:    string
  readonly pattern: ReadonlyArray<number | string>
}

type Props = {
  readonly tracks:      ReadonlyArray<PunchcardTrack>
  readonly currentStep: number
  readonly stepCount:   number
}

/** Placeholder — canvas impl in t137. */
export const PunchcardGrid = (_props: Props) => (
  <div style={styles.root}>
    <span style={styles.label}>Punchcard — t137</span>
  </div>
)

const styles = {
  root:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080809' },
  label: { fontFamily: 'monospace', fontSize: '0.7rem', color: '#2a3a4a' },
} as const
