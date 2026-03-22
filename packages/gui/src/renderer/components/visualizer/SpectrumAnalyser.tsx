import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly bins:    readonly number[]  // FFT magnitude values, 0.0–1.0 normalised
  readonly playing: boolean
  readonly color?:  string             // bar color, default '#6a9fff'
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_COLOR = '#6a9fff'
const BG_COLOR      = '#080809'
const BAR_GAP       = 1
const BASELINE_H    = 2
const GLOW_BLUR     = 8

// ── Drawing helpers ────────────────────────────────────────────────────────────

const drawSpectrum = (
  canvas:  HTMLCanvasElement,
  bins:    readonly number[],
  playing: boolean,
  color:   string,
): void => {
  const dpr  = window.devicePixelRatio ?? 1
  const rect = canvas.getBoundingClientRect()
  const w    = rect.width  || canvas.clientWidth  || 300
  const h    = rect.height || canvas.clientHeight || 120

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

  const count = bins.length

  if (count === 0) {
    // Nothing to draw — flat baseline
    ctx.fillStyle = color
    ctx.fillRect(0, h - BASELINE_H, w, BASELINE_H)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    return
  }

  const allZero = bins.every(b => b === 0)

  if (!playing && allZero) {
    // Draw flat 2px baseline
    ctx.fillStyle = color
    ctx.fillRect(0, h - BASELINE_H, w, BASELINE_H)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    return
  }

  // Glow only when playing
  if (playing) {
    ctx.shadowBlur  = GLOW_BLUR
    ctx.shadowColor = color
  } else {
    ctx.shadowBlur  = 0
    ctx.shadowColor = 'transparent'
  }

  ctx.fillStyle = color

  const barW = Math.max(1, (w - (count - 1) * BAR_GAP) / count)

  Array.from({ length: count }, (_, i) => {
    const magnitude = Math.min(Math.max(bins[i] ?? 0, 0), 1)
    const barH      = Math.max(magnitude * h, BASELINE_H)
    const x         = i * (barW + BAR_GAP)
    const y         = h - barH
    ctx.fillRect(x, y, barW, barH)
  })

  // Reset shadow and transform
  ctx.shadowBlur  = 0
  ctx.shadowColor = 'transparent'
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * SpectrumAnalyser — canvas FFT spectrum analyser.
 *
 * Renders each FFT bin as a bottom-to-top bar. Applies a glow effect when
 * `playing` is true. Handles panel resize via ResizeObserver. HiDPI-aware.
 *
 * @param props.bins    - Normalised FFT magnitude values in [0, 1]
 * @param props.playing - When true, enables glow and draws live magnitudes
 * @param props.color   - Bar fill color (default `#6a9fff`)
 */
export const SpectrumAnalyser = ({
  bins,
  playing,
  color = DEFAULT_COLOR,
}: Props) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Redraw whenever bins, playing, or color change
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    drawSpectrum(canvas, bins, playing, color)
  }, [bins, playing, color])

  // Redraw on container resize
  useEffect(() => {
    const container = containerRef.current
    const canvas    = canvasRef.current
    if (container === null || canvas === null) return

    const observer = new ResizeObserver(() => {
      drawSpectrum(canvas, bins, playing, color)
    })

    observer.observe(container)
    return () => { observer.disconnect() }
  // bins/playing/color are intentionally excluded — the effect above handles those.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={containerRef} style={styles.container}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        aria-label="Spectrum analyser"
        role="img"
        data-color={color}
      />
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  container: {
    width:    '100%',
    height:   '100%',
    overflow: 'hidden',
  },
  canvas: {
    width:   '100%',
    height:  '100%',
    display: 'block',
  },
} as const
