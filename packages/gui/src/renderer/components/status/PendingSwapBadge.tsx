// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly pending:   boolean
  readonly step:      number
  readonly stepCount: number
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Amber badge shown when a new eval is queued waiting for the next bar boundary.
 * Renders null when pending=false.
 *
 * @param pending   - true when a bar-boundary swap is queued
 * @param step      - Current step within the bar (for countdown display)
 * @param stepCount - Total steps per bar
 */
export const PendingSwapBadge = ({ pending, step, stepCount }: Props) => {
  if (!pending) return null

  return (
    <div style={styles.pill} aria-label="Pending bar-boundary swap">
      <span style={styles.icon} aria-hidden="true">⟳</span>
      <span style={styles.label}>swap on next bar</span>
      <span style={styles.progress} aria-label={`Step ${step} of ${stepCount}`}>
        {step}/{stepCount}
      </span>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  pill: {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '0.4rem',
    padding:      '0.25rem 0.6rem',
    background:   '#1a1500',
    border:       '1px solid #ffcc00',
    borderRadius: '999px',
    fontFamily:   "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:     '0.7rem',
    color:        '#ffcc00',
    whiteSpace:   'nowrap' as const,
  },
  icon: {
    fontSize:   '0.85rem',
    lineHeight: 1,
  },
  label: {
    fontWeight: 600,
  },
  progress: {
    opacity:    0.65,
    fontSize:   '0.65rem',
    marginLeft: '0.1rem',
  },
} as const
