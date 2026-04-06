import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * Props for {@link MasterLevel}.
 */
export type MasterLevelProps = {
  /**
   * Float waveform data sampled from an `AnalyserNode` (values in [-1, 1]).
   * RMS is computed internally; an empty array renders as silence.
   */
  readonly waveform: readonly number[]
  /** When `false` the meter renders as silent regardless of waveform data. */
  readonly playing:  boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const METER_W = 16
const METER_H = 80

const VU_BG     = '#141418'
const VU_GREEN  = '#22cc66'
const VU_YELLOW = '#ccaa00'
const VU_RED    = '#cc2244'

const GREEN_THRESHOLD  = 0.70
const YELLOW_THRESHOLD = 0.85

// ── RMS helper ─────────────────────────────────────────────────────────────────

/**
 * Compute RMS from a float waveform array, clamped to [0, 1].
 *
 * @param waveform - Array of float samples in [-1, 1].
 * @returns RMS value in [0, 1].
 */
const computeRms = (waveform: readonly number[]): number => {
  if (waveform.length === 0) return 0
  const sumOfSquares = waveform.reduce((acc, v) => acc + v * v, 0)
  return Math.min(1, Math.sqrt(sumOfSquares / waveform.length))
}

// ── Drawing helper ─────────────────────────────────────────────────────────────

const drawMeter = (canvas: HTMLCanvasElement, level: number): void => {
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
 * MasterLevel — master output level meter for Score Studio.
 *
 * Accepts raw waveform data from a Web Audio `AnalyserNode`, computes RMS
 * internally, and renders a colour-coded vertical bar (green / yellow / red
 * zones) on a canvas element. The label "MASTER" is displayed below.
 *
 * The meter renders as silent when `playing` is `false`.
 *
 * @param waveform - Float waveform samples from an `AnalyserNode` in [-1, 1].
 * @param playing  - Whether the transport is currently playing.
 *
 * @example
 * ```tsx
 * <MasterLevel waveform={waveformData} playing={isPlaying} />
 * ```
 */
export const MasterLevel = ({ waveform, playing }: MasterLevelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const level = playing ? computeRms(waveform) : 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    drawMeter(canvas, level)
  }, [level])

  return (
    <div style={styles.wrapper}>
      <canvas
        ref={canvasRef}
        aria-label="Master level"
        role="img"
        width={METER_W}
        height={METER_H}
        style={styles.canvas}
      />
      <span aria-hidden="true" style={styles.label}>MASTER</span>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    gap:           '4px',
    userSelect:    'none' as const,
  },
  canvas: {
    display:        'block',
    width:          `${String(METER_W)}px`,
    height:         `${String(METER_H)}px`,
    imageRendering: 'pixelated' as const,
    border:         '1px solid #1e1e22',
  },
  label: {
    fontFamily:    "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:      '0.6rem',
    color:         '#7a7a8a', // was #6a6a7a — 3.87:1 on #0a0a0d; now 5.43:1 (WCAG AA)
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
} as const
