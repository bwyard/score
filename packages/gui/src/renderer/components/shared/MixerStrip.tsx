import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * Props for {@link MixerStrip}.
 */
export type MixerStripProps = {
  /** Display name of the track. Truncated to fit the strip. */
  readonly name:     string
  /** Track type — determines the color strip accent. E.g. `'kick'`, `'snare'`, `'synth'`. */
  readonly type:     string
  /** Volume level in [0, 1]. Controls the vertical fader position. */
  readonly volume:   number
  /** When `true` the mute button is lit amber and the track is silenced. */
  readonly muted:    boolean
  /** Current RMS output level in [0, 1]. Drives the VU bar. */
  readonly level:    number
  /** Called with the new volume value (0–1) when the fader moves. */
  readonly onVolume: (v: number) => void
  /** Called when the mute button is clicked. */
  readonly onMute:   () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STRIP_COLOR: Record<string, string> = {
  kick:    '#c05a20',
  kick808: '#c05a20',
  kick909: '#d04010',
  snare:   '#c02040',
  snare909:'#c02040',
  hihat:   '#208060',
  hihat808:'#208060',
  bass303: '#9040c0',
  synth:   '#2060a0',
  subsynth:'#2060a0',
  fmsynth: '#1a50c0',
  pad:     '#206080',
  pluck:   '#208060',
  arp:     '#6040a0',
  sample:  '#606060',
}
const STRIP_DEFAULT = '#404040'

const VU_GREEN  = '#22cc66'
const VU_YELLOW = '#ccaa00'
const VU_RED    = '#cc2244'
const VU_BG     = '#0a0a0d'

const GREEN_THRESHOLD  = 0.70
const YELLOW_THRESHOLD = 0.85

// ── Drawing helper ─────────────────────────────────────────────────────────────

const drawVU = (canvas: HTMLCanvasElement, level: number): void => {
  const ctx = canvas.getContext('2d')
  if (ctx === null) return

  const w   = canvas.width
  const h   = canvas.height
  const lvl = Math.min(Math.max(level, 0), 1)

  // Background
  ctx.fillStyle = VU_BG
  ctx.fillRect(0, 0, w, h)

  // Bar draws bottom-up
  const fillH = lvl * h

  const barColor =
    lvl > YELLOW_THRESHOLD ? VU_RED :
    lvl > GREEN_THRESHOLD  ? VU_YELLOW :
    VU_GREEN

  ctx.fillStyle = barColor
  ctx.fillRect(0, h - fillH, w, fillH)
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MixerStrip — a compact per-track channel strip for Score Studio.
 *
 * Displays a colour accent bar (matching the PunchcardGrid strip palette),
 * the track name, a mute toggle, a vertical volume fader, and a small VU
 * level indicator. The strip is 56 px wide and fills its container height.
 *
 * @param name     - Track name shown at the top of the strip.
 * @param type     - Track type; controls the accent colour.
 * @param volume   - Current volume in [0, 1].
 * @param muted    - Whether the track is muted.
 * @param level    - Current RMS level in [0, 1] for the VU bar.
 * @param onVolume - Called with the new volume when the fader changes.
 * @param onMute   - Called when the mute button is clicked.
 *
 * @example
 * ```tsx
 * <MixerStrip
 *   name="Kick"
 *   type="kick"
 *   volume={0.8}
 *   muted={false}
 *   level={0.4}
 *   onVolume={v => dispatch({ type: 'SET_VOLUME', track: 'kick', value: v })}
 *   onMute={() => dispatch({ type: 'TOGGLE_MUTE', track: 'kick' })}
 * />
 * ```
 */
export const MixerStrip = ({
  name,
  type,
  volume,
  muted,
  level,
  onVolume,
  onMute,
}: MixerStripProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const accentColor = STRIP_COLOR[type] ?? STRIP_DEFAULT

  // Redraw VU bar whenever level changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    drawVU(canvas, level)
  }, [level])

  return (
    <div
      aria-label={`${name} channel strip`}
      style={styles.strip}
    >
      {/* Accent colour bar at top */}
      <div
        aria-hidden="true"
        style={{ ...styles.accentBar, background: accentColor }}
      />

      {/* Track name */}
      <div
        aria-label={`Track: ${name}`}
        style={styles.trackName}
        title={name}
      >
        {name}
      </div>

      {/* Mute button */}
      <button
        aria-label={muted ? `Unmute ${name}` : `Mute ${name}`}
        aria-pressed={muted}
        style={muted ? { ...styles.muteBtn, ...styles.muteBtnActive } : styles.muteBtn}
        onClick={onMute}
      >
        M
      </button>

      {/* Volume fader */}
      <input
        aria-label={`${name} volume`}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        style={styles.fader}
        onChange={e => { onVolume(Number(e.target.value)) }}
      />

      {/* VU bar */}
      <canvas
        ref={canvasRef}
        aria-label={`${name} level`}
        role="img"
        width={4}
        height={44}
        style={styles.vuCanvas}
      />
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  strip: {
    display:         'flex',
    flexDirection:   'column' as const,
    alignItems:      'center',
    width:           '56px',
    background:      '#0d0d10',
    border:          '1px solid #1e1e22',
    boxSizing:       'border-box' as const,
    padding:         '0 0 4px',
    gap:             '3px',
    userSelect:      'none' as const,
    flexShrink:      0,
  },
  accentBar: {
    width:       '100%',
    height:      '4px',
    flexShrink:  0,
  },
  trackName: {
    width:         '100%',
    fontSize:      '0.6rem',
    color:         '#6a6a7a',
    fontFamily:    'system-ui, sans-serif',
    textAlign:     'center' as const,
    overflow:      'hidden',
    whiteSpace:    'nowrap' as const,
    textOverflow:  'ellipsis',
    padding:       '2px 3px 0',
    boxSizing:     'border-box' as const,
    letterSpacing: '0.05em',
  },
  muteBtn: {
    width:          '28px',
    height:         '20px',
    background:     '#1a1a22',
    border:         '1px solid #2a2a36',
    borderRadius:   '2px',
    color:          '#6a6a7a',
    fontSize:       '0.65rem',
    fontWeight:     700,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    padding:        0,
    letterSpacing:  '0.05em',
  },
  muteBtnActive: {
    background: '#ffcc00',
    border:     '1px solid #cc9900',
    color:      '#1a1000',
  },
  fader: {
    // writingMode makes the range input render vertically in modern browsers.
    // WebkitAppearance is kept for older Chromium (Electron) builds.
    writingMode:        'vertical-lr' as const,
    direction:          'rtl' as const,
    WebkitAppearance:   'slider-vertical' as const,
    width:              '28px',
    height:             '60px',
    cursor:             'pointer',
    accentColor:        '#4a8fff',
    flexShrink:         0,
  },
  vuCanvas: {
    display:        'block',
    width:          '4px',
    height:         '44px',
    imageRendering: 'pixelated' as const,
    flexShrink:     0,
  },
} as const
