// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly bars:      number
  readonly step:      number
  readonly stepCount: number
  readonly bpm:       number
  readonly playing:   boolean
}

// ── Beat clock — 4 quarter-note dots, each with 4 16th-note pips ──────────────
// ticksPerBeat = 4 (transport constant), so each beat = 4 steps.
// beatNum   = Math.floor(step / 4)          → 0-based beat index within pattern
// beatsInPattern = Math.ceil(stepCount / 4) → total beats in the longest pattern

const BeatClock = ({ step, stepCount }: { step: number; stepCount: number }) => {
  const beatsInPattern = Math.max(Math.ceil(stepCount / 4), 1)
  const currentBeat    = Math.floor(step / 4)           // 0-based beat in pattern
  const currentSixteenth = step % 4                     // 0-based 16th within beat

  return (
    <span style={styles.beatClock} aria-label={`Beat ${String(currentBeat + 1)} of ${String(beatsInPattern)}`}>
      {Array.from({ length: beatsInPattern }, (_, b) => {
        const isBeat = b === currentBeat
        return (
          <span key={b} style={{ ...styles.beatGroup, ...(isBeat ? styles.beatGroupActive : {}) }}>
            {/* 4 tiny 16th-note pips inside each beat */}
            {Array.from({ length: 4 }, (__, s) => (
              <span
                key={s}
                aria-hidden="true"
                style={{
                  ...styles.pip,
                  ...(isBeat && s === currentSixteenth ? styles.pipActive : styles.pipInactive),
                }}
              />
            ))}
          </span>
        )
      })}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Transport position display: Bar · Beat · BPM with a per-beat clock.
 * Beat is derived from step / 4 (ticksPerBeat = 4 is a transport constant).
 * The beat clock shows each quarter note as a group of 4 16th-note pips.
 *
 * @param bars      - Total bar count from engine:state (0-indexed)
 * @param step      - Current step 0–(stepCount-1) from engine:tick
 * @param stepCount - Total steps in the cursor pattern (max across all tracks)
 * @param bpm       - Beats per minute
 * @param playing   - Whether the transport is rolling
 */
export const BarCounter = ({ bars, step, stepCount, bpm, playing }: Props) => {
  // Explicit colors to avoid opacity-based dimming which fails WCAG AA on dark backgrounds.
  // When playing: bright blue for numbers, muted blue for labels.
  // When stopped: visible gray for numbers, muted gray for labels.
  const numColor   = playing ? '#6a9fff' : '#7a7a8a'
  const dimColor   = playing ? '#7090c0' : '#7a7a8a'
  const sepColor   = playing ? '#4a6090' : '#555566'
  const beatNum    = playing ? Math.floor(step / 4) + 1 : 0
  const beatsTotal = Math.max(Math.ceil(stepCount / 4), 1)

  return (
    <div style={styles.root} aria-label="Transport position">
      <span style={styles.segment}>
        <span style={{ ...styles.dimLabel, color: dimColor }}>BAR</span>
        <span style={{ ...styles.bigNum, color: numColor }}>{playing ? bars + 1 : '—'}</span>
      </span>
      <span style={{ ...styles.separator, color: sepColor }} aria-hidden="true">·</span>
      <span style={styles.segment}>
        <span style={{ ...styles.dimLabel, color: dimColor }}>BEAT</span>
        <span style={{ ...styles.bigNum, color: numColor }}>
          {playing ? `${String(beatNum)}/${String(beatsTotal)}` : '—'}
        </span>
      </span>
      <span style={{ ...styles.separator, color: sepColor }} aria-hidden="true">·</span>
      <span style={styles.segment}>
        <span style={{ ...styles.bigNum, color: numColor }}>{bpm}</span>
        <span style={{ ...styles.dimLabel, color: dimColor }}>BPM</span>
      </span>
      {playing && <BeatClock step={step} stepCount={stepCount} />}
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
    // color set inline — opacity-based dimming fails WCAG AA on dark backgrounds
    fontWeight: 400,
  },
  bigNum: {
    fontSize:   '1.2rem',
    fontWeight: 700,
    lineHeight: 1,
    // color set inline — inheriting opacity from root fails WCAG AA
  },
  separator: {
    fontSize: '0.9rem',
    // color set inline
  },
  // Beat clock
  beatClock: {
    display:    'inline-flex',
    alignItems: 'center',
    gap:        '4px',
    marginLeft: '0.5rem',
  },
  beatGroup: {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '1px',
    padding:      '2px 3px',
    borderRadius: '2px',
    border:       '1px solid transparent',
  },
  beatGroupActive: {
    border:     '1px solid rgba(106, 159, 255, 0.35)',
    background: 'rgba(106, 159, 255, 0.07)',
  },
  pip: {
    display:      'inline-block',
    width:        '3px',
    height:       '3px',
    borderRadius: '50%',
    flexShrink:   0,
  },
  pipActive: {
    background: '#6a9fff',
    opacity:    1,
  },
  pipInactive: {
    background: '#6a9fff',
    opacity:    0.15,
  },
} as const
