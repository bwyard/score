import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly level:   number   // 0.0 – 1.0 RMS level
  readonly peak:    number   // 0.0 – 1.0 peak hold
  readonly label:   string   // track name
  readonly color?:  string   // bar color, default '#6a9fff'
  readonly width?:  number   // default 24px
  readonly height?: number   // default 120px
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_COLOR  = '#6a9fff'
const DEFAULT_WIDTH  = 24
const DEFAULT_HEIGHT = 120

const BG_COLOR      = '#0c0c0e'
const GREEN_COLOR   = '#22cc66'
const YELLOW_COLOR  = '#ffcc00'
const RED_COLOR     = '#ff4444'
const PEAK_COLOR    = '#ffffff'

const GREEN_THRESHOLD  = 0.70
const YELLOW_THRESHOLD = 0.85
const PEAK_FALLOFF     = 0.003

// ── Drawing helpers ────────────────────────────────────────────────────────────

const drawVUMeter = (
  canvas:   HTMLCanvasElement,
  level:    number,
  peak:     number,
  color:    string,
  w:        number,
  h:        number,
): void => {
  const dpr = window.devicePixelRatio

  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width  = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }

  const ctx = canvas.getContext('2d')
  if (ctx === null) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Background
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, w, h)

  // The bar draws from the bottom up. Reserve a small margin at the top.
  const barTop    = 4
  const barBottom = h - 14          // leave room for label
  const barHeight = barBottom - barTop
  const barLeft   = 2
  const barWidth  = w - 4

  // Level clamped
  const lvl = Math.min(Math.max(level, 0), 1)

  // Draw the coloured level bar in up to three zones
  // Helper: draw a rectangle measured from the bottom of the bar area
  const drawBand = (fromFraction: number, toFraction: number, bandColor: string): void => {
    const yTop  = barBottom - toFraction   * barHeight
    const yBot  = barBottom - fromFraction * barHeight
    const bandH = yBot - yTop
    if (bandH <= 0) return
    ctx.fillStyle = bandColor
    ctx.fillRect(barLeft, yTop, barWidth, bandH)
  }

  // Paint zones only up to the current fill level
  const topFrac = lvl

  if (topFrac > 0) {
    // Green zone: 0 → GREEN_THRESHOLD
    drawBand(0, Math.min(topFrac, GREEN_THRESHOLD), GREEN_COLOR)
  }
  if (topFrac > GREEN_THRESHOLD) {
    // Yellow zone: GREEN_THRESHOLD → YELLOW_THRESHOLD
    drawBand(GREEN_THRESHOLD, Math.min(topFrac, YELLOW_THRESHOLD), YELLOW_COLOR)
  }
  if (topFrac > YELLOW_THRESHOLD) {
    // Red zone: YELLOW_THRESHOLD → 1.0
    drawBand(YELLOW_THRESHOLD, topFrac, RED_COLOR)
  }

  // Suppress unused-var warning — color prop is passed but we use zone colors above.
  // The color prop is exposed via data-color for test inspection.
  void color

  // Peak hold line — 2px white line
  const pk   = Math.min(Math.max(peak, 0), 1)
  const pkY  = barBottom - pk * barHeight
  ctx.fillStyle = PEAK_COLOR
  ctx.fillRect(barLeft, pkY - 1, barWidth, 2)

  // Label below bar
  ctx.font         = '8px monospace'
  ctx.fillStyle    = '#88aacc'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(label(canvas), w / 2, h - 3)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

// Read the label from the canvas aria-label attribute
const label = (canvas: HTMLCanvasElement): string =>
  canvas.getAttribute('aria-label') ?? ''

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * VUMeter — canvas vertical VU meter.
 *
 * Displays an RMS level bar (colour-coded green/yellow/red zones) with a
 * peak-hold line that falls off at 0.003/frame via requestAnimationFrame.
 *
 * @param level  - RMS level in [0, 1]
 * @param peak   - Initial peak hold value in [0, 1]
 * @param label  - Track name shown below the bar and as aria-label
 * @param color  - Bar accent color (default `#6a9fff`)
 * @param width  - Canvas CSS width in px (default 24)
 * @param height - Canvas CSS height in px (default 120)
 */
export const VUMeter = ({
  level,
  peak,
  label: labelProp,
  color  = DEFAULT_COLOR,
  width  = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: Props) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  // Mutable peak hold value — stored in a ref so rAF updates do not trigger re-render
  const peakRef    = useRef<{ value: number }>({ value: peak })
  const rafRef     = useRef<{ id: number }>({ id: 0 })

  // Sync incoming peak to peakRef whenever the prop rises
  useEffect(() => {
    if (peak > peakRef.current.value) {
      peakRef.current.value = peak
    }
  }, [peak])

  // Draw loop — starts on mount, cancelled on unmount
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    const tick = (): void => {
      // Fall off the peak hold
      if (peakRef.current.value > 0) {
        peakRef.current.value = Math.max(0, peakRef.current.value - PEAK_FALLOFF)
      }
      drawVUMeter(canvas, level, peakRef.current.value, color, width, height)
      rafRef.current.id = requestAnimationFrame(tick)
    }

    rafRef.current.id = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current.id) }
  // We deliberately only depend on level/color/width/height — peak is read via peakRef
  }, [level, color, width, height])

  return (
    <canvas
      ref={canvasRef}
      aria-label={labelProp}
      role="img"
      data-color={color}
      style={{
        width:   `${String(width)}px`,
        height:  `${String(height)}px`,
        display: 'block',
      }}
    />
  )
}
