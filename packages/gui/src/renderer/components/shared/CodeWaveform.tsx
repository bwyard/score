import { memo, useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly waveform:    readonly number[]
  readonly playing:     boolean
  /** Current sequencer step (zero-based). */
  readonly currentStep: number
  /** Total steps in the current bar. */
  readonly stepCount:   number
}

// ── Drawing ────────────────────────────────────────────────────────────────────

/**
 * Draw beat-reactive glow and step scrub bar onto the canvas.
 *
 * Draws three layered visual elements:
 *  1. **Beat-reactive background glow** — RMS-derived radial gradient.
 *  2. **Waveform trace** — semi-transparent oscilloscope line centered vertically.
 *  3. **Step scrub bar** — 2px bar at the top sweeping left→right.
 */
const drawBeatViz = (
  ctx:         CanvasRenderingContext2D,
  waveform:    readonly number[],
  currentStep: number,
  stepCount:   number,
  width:       number,
  height:      number,
  playing:     boolean,
): void => {
  ctx.clearRect(0, 0, width, height)
  if (!playing) return

  // RMS-derived glow
  const rms = Math.sqrt(
    waveform.reduce((s, v) => s + v * v, 0) / Math.max(waveform.length, 1)
  )
  const intensity = Math.min(rms * 8, 1)

  if (intensity > 0.01) {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.7,
    )
    gradient.addColorStop(0, `rgba(74, 143, 255, ${String(intensity * 0.06)})`)
    gradient.addColorStop(1, 'rgba(74, 143, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  // Waveform trace — oscilloscope-style time-domain signal centered vertically.
  // Drawn very subtly so the code editor text remains fully legible.
  if (waveform.length > 1) {
    const centerY  = height / 2
    const stepSize = width / waveform.length

    ctx.beginPath()
    ctx.strokeStyle = 'rgba(74, 143, 255, 0.12)'
    ctx.lineWidth   = 1.5

    for (let i = 0; i < waveform.length; i++) {
      const x = i * stepSize
      const y = centerY - (waveform[i] ?? 0) * (height * 0.4)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  // Step scrub bar — 2px at top, sweeps left→right over the current bar
  if (stepCount > 0) {
    const progress = currentStep / stepCount
    ctx.fillStyle = 'rgba(74, 143, 255, 0.5)'
    ctx.fillRect(0, 0, width * progress, 2)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Beat-reactive waveform overlay drawn behind the code editor.
 *
 * Shows an RMS-derived radial glow, a semi-transparent oscilloscope waveform
 * trace centred vertically behind the code, and a thin step scrub bar at the
 * top that sweeps left→right through each bar — the same aesthetic as Strudl
 * and TidalCycles editors.
 *
 * Position this absolutely behind the textarea using `position: relative` on
 * the editor pane container with this canvas positioned `absolute, inset: 0`.
 *
 * @param waveform    - Float waveform samples from the AnalyserNode.
 * @param playing     - Whether the transport is rolling. Clears the canvas when false.
 * @param currentStep - Current sequencer step (zero-based).
 * @param stepCount   - Total steps in the current bar.
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <CodeWaveform waveform={waveform} playing={playing} currentStep={step} stepCount={count} />
 *   <textarea style={{ position: 'relative', zIndex: 1 }} />
 * </div>
 * ```
 */
const CodeWaveformInner = ({ waveform, playing, currentStep, stepCount }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    const dpr    = window.devicePixelRatio
    const width  = canvas.clientWidth
    const height = canvas.clientHeight

    if (width === 0 || height === 0) return

    canvas.width  = Math.round(width  * dpr)
    canvas.height = Math.round(height * dpr)

    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    ctx.scale(dpr, dpr)
    drawBeatViz(ctx, waveform, currentStep, stepCount, width, height, playing)
  }, [waveform, playing, currentStep, stepCount])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={styles.canvas}
    />
  )
}

/** Beat-reactive waveform overlay — memoized to prevent re-renders at display tick rate. */
export const CodeWaveform = memo(CodeWaveformInner)

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
