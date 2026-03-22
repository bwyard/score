import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly waveform: readonly number[]
  readonly playing:  boolean
}

// ── Drawing ────────────────────────────────────────────────────────────────────

const drawWaveform = (
  ctx:      CanvasRenderingContext2D,
  waveform: readonly number[],
  width:    number,
  height:   number,
  playing:  boolean,
): void => {
  ctx.clearRect(0, 0, width, height)

  if (!playing || waveform.length === 0) return

  const mid    = height / 2
  const scaleY = mid * 0.6

  ctx.strokeStyle = 'rgba(74, 143, 255, 0.15)'
  ctx.lineWidth   = 1.5
  ctx.beginPath()

  const step = Math.max(1, Math.floor(waveform.length / width))

  waveform.forEach((sample, i) => {
    if (i % step !== 0) return
    const x = (i / waveform.length) * width
    const y = mid + sample * scaleY
    if (i === 0) ctx.moveTo(x, y)
    else         ctx.lineTo(x, y)
  })

  ctx.stroke()

  // Gradient fill beneath the waveform for depth
  ctx.fillStyle = 'rgba(74, 143, 255, 0.04)'
  ctx.lineTo(width, mid)
  ctx.lineTo(0, mid)
  ctx.closePath()
  ctx.fill()
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Semi-transparent waveform overlay drawn behind the code editor.
 *
 * Renders a live oscilloscope trace at very low opacity so the code remains
 * fully readable while the waveform is visible during playback — the same
 * aesthetic as Strudl and TidalCycles editors.
 *
 * Position this absolutely behind the textarea using `position: relative` on
 * the editor pane container with this canvas positioned `absolute, inset: 0`.
 *
 * @param waveform - Float waveform samples from the AnalyserNode.
 * @param playing  - Whether the transport is rolling. Clears the canvas when false.
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <CodeWaveform waveform={waveform} playing={playing} />
 *   <textarea style={{ position: 'relative', zIndex: 1 }} />
 * </div>
 * ```
 */
export const CodeWaveform = ({ waveform, playing }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    const dpr    = window.devicePixelRatio ?? 1
    const width  = canvas.clientWidth
    const height = canvas.clientHeight

    if (width === 0 || height === 0) return

    canvas.width  = Math.round(width  * dpr)
    canvas.height = Math.round(height * dpr)

    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    ctx.scale(dpr, dpr)
    drawWaveform(ctx, waveform, width, height, playing)
  }, [waveform, playing])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={styles.canvas}
    />
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  canvas: {
    position:       'absolute' as const,
    inset:          0,
    width:          '100%',
    height:         '100%',
    pointerEvents:  'none' as const,
    imageRendering: 'pixelated' as const,
    zIndex:         0,
  },
} as const
