import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly waveform: readonly number[]
  readonly playing:  boolean
}

// ── Drawing helpers ────────────────────────────────────────────────────────────

const drawScope = (
  canvas:   HTMLCanvasElement,
  waveform: readonly number[],
  playing:  boolean,
): void => {
  const dpr = window.devicePixelRatio
  const rect = canvas.getBoundingClientRect()
  const w    = rect.width
  const h    = rect.height

  // Resize backing store if needed
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width  = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }

  const ctx = canvas.getContext('2d')
  if (ctx === null) return

  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = '#080809'
  ctx.fillRect(0, 0, w, h)

  const centerY = h / 2

  // Center axis line (always rendered)
  ctx.beginPath()
  ctx.strokeStyle = '#111115'
  ctx.lineWidth   = 1
  ctx.moveTo(0,  centerY)
  ctx.lineTo(w, centerY)
  ctx.stroke()

  const hasData = waveform.length > 0

  if (playing && hasData) {
    // Active waveform
    ctx.shadowBlur  = 8
    ctx.shadowColor = '#1a6a4a80'
    ctx.strokeStyle = '#2a8a6a'
    ctx.lineWidth   = 1.5

    const padding    = h * 0.10          // 10% top+bottom
    const drawHeight = h - padding * 2   // available vertical range
    const len        = waveform.length

    ctx.beginPath()
    Array.from({ length: len }, (_, i) => {
      const sample = waveform[i] ?? 0
      const x = len === 1 ? w / 2 : (i / (len - 1)) * w
      const y = centerY - sample * (drawHeight / 2)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Reset shadow so it doesn't bleed into the label
    ctx.shadowBlur  = 0
    ctx.shadowColor = 'transparent'
  } else {
    // Flat idle line
    ctx.strokeStyle = '#1a2a2a'
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(0,  centerY)
    ctx.lineTo(w, centerY)
    ctx.stroke()
  }

  // Corner label "SCOPE"
  ctx.font         = '9px monospace'
  ctx.fillStyle    = '#1a3a3a'
  ctx.textBaseline = 'top'
  ctx.fillText('SCOPE', 6, 6)

  // Reset transform so the next paint starts clean
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Scope — canvas oscilloscope visualizer.
 *
 * Receives a waveform (float array in [-1, 1]) and a playing flag.
 * Redraws on every prop change; the parent drives updates at ~20fps via IPC.
 *
 * @param props.waveform - PCM float samples, typically 1024–2048 values in [-1, 1]
 * @param props.playing  - When true, draws the live waveform; when false draws an idle line
 */
export const Scope = ({ waveform, playing }: Props) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Redraw whenever waveform or playing state changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    drawScope(canvas, waveform, playing)
  }, [waveform, playing])

  // Redraw on container resize
  useEffect(() => {
    const container = containerRef.current
    const canvas    = canvasRef.current
    if (container === null || canvas === null) return

    const observer = new ResizeObserver(() => {
      drawScope(canvas, waveform, playing)
    })

    observer.observe(container)
    return () => { observer.disconnect() }
  // waveform and playing are intentionally excluded — the waveform effect handles those.
  // The ResizeObserver only needs to redraw with whatever the current values are.
  }, [])

  return (
    <div ref={containerRef} style={styles.container}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        aria-label="Oscilloscope waveform display"
        role="img"
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
