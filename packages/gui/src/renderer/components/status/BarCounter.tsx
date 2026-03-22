// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly bars:      number
  readonly step:      number
  readonly stepCount: number
  readonly bpm:       number
  readonly playing:   boolean
}

// ── Beat dots ─────────────────────────────────────────────────────────────────

const BeatDots = ({ step, stepCount }: { step: number; stepCount: number }) => (
  <span style={styles.dots} aria-label={`Step ${step + 1} of ${stepCount}`}>
    {Array.from({ length: stepCount }, (_, i) => (
      <span
        key={i}
        aria-hidden="true"
        style={{
          ...styles.dot,
          ...(i === step ? styles.dotActive : styles.dotInactive),
        }}
      />
    ))}
  </span>
)

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Large bar/beat display showing current transport position.
 *
 * @param bars      - Total bar count from engine:state (0-indexed)
 * @param step      - Current step 0–(stepCount-1) from engine:step
 * @param stepCount - Steps per bar
 * @param bpm       - Beats per minute
 * @param playing   - Whether the transport is rolling
 */
export const BarCounter = ({ bars, step, stepCount, bpm, playing }: Props) => {
  const color = playing ? '#6a9fff' : '#2a2a3a'

  return (
    <div style={{ ...styles.root, color }} aria-label="Transport position">
      <span style={styles.segment}>
        <span style={styles.dimLabel}>BAR</span>
        <span style={styles.bigNum}>{playing ? bars + 1 : '—'}</span>
      </span>
      <span style={styles.separator} aria-hidden="true">·</span>
      <span style={styles.segment}>
        <span style={styles.dimLabel}>STEP</span>
        <span style={styles.bigNum}>{playing ? step + 1 : '—'}</span>
      </span>
      <span style={styles.separator} aria-hidden="true">·</span>
      <span style={styles.segment}>
        <span style={styles.bigNum}>{bpm}</span>
        <span style={styles.dimLabel}>BPM</span>
      </span>
      {playing && <BeatDots step={step} stepCount={stepCount} />}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display:    'inline-flex',
    alignItems: 'center',
    gap:        '0.5rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:   '0.8rem',
  },
  segment: {
    display:    'inline-flex',
    alignItems: 'baseline',
    gap:        '0.25rem',
  },
  dimLabel: {
    fontSize:   '0.6rem',
    opacity:    0.5,
    fontWeight: 400,
  },
  bigNum: {
    fontSize:   '1.2rem',
    fontWeight: 700,
    lineHeight: 1,
  },
  separator: {
    opacity:  0.3,
    fontSize: '0.9rem',
  },
  dots: {
    display:    'inline-flex',
    alignItems: 'center',
    gap:        '2px',
    marginLeft: '0.5rem',
  },
  dot: {
    display:      'inline-block',
    width:        '5px',
    height:       '5px',
    borderRadius: '50%',
    flexShrink:   0,
  },
  dotActive: {
    background: '#6a9fff',
    opacity:    1,
  },
  dotInactive: {
    background: '#6a9fff',
    opacity:    0.18,
  },
} as const
