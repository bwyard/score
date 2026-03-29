// PerformanceCanvas.tsx — Live visual renderer for Performance Mode.
//
// Receives AudioVisualState each animation frame (from useAudioVisualState in the parent)
// and delegates to the active @score/visuals theme. The theme returns a VisualSceneDescriptor
// (background + ordered DrawLayer[]); this component interprets each DrawLayer kind
// and issues the corresponding Canvas 2D API calls.
//
// No audio, no IPC — pure visual rendering. Theme selection is via the `theme` prop.

import React, { useEffect, useRef, memo } from 'react'
import { getTheme } from '@score/visuals'
import type { AudioVisualState, DrawLayer } from '@score/visuals'

// ── Types ──────────────────────────────────────────────────────────────────────

/** Props for {@link PerformanceCanvas}. */
export type PerformanceCanvasProps = {
  /** Live audio-visual state assembled by useAudioVisualState. */
  readonly state:         AudioVisualState
  /** Theme name — looked up via getTheme(). Defaults to 'dark-pulse'. */
  readonly theme:         string
  /** Whether the editor strip is visible (reserved for future canvas resizing). */
  readonly editorVisible: boolean
}

// ── Layer renderers ────────────────────────────────────────────────────────────

/** Draw a time-domain oscilloscope waveform trace. */
const drawWaveform = (
  ctx:   CanvasRenderingContext2D,
  w:     number,
  h:     number,
  layer: DrawLayer,
): void => {
  const waveform = layer.data['waveform'] as readonly number[] | undefined
  if (!waveform || waveform.length === 0) return

  ctx.globalAlpha = layer.alpha
  ctx.strokeStyle = layer.color
  ctx.lineWidth   = 1.5
  ctx.beginPath()

  const sliceW = w / waveform.length
  waveform.forEach((s, i) => {
    const x = i * sliceW
    const y = (h / 2) + s * (h / 2) * 0.8
    if (i === 0) ctx.moveTo(x, y)
    else         ctx.lineTo(x, y)
  })

  ctx.stroke()
}

/** Draw FFT magnitude bars. */
const drawSpectrum = (
  ctx:   CanvasRenderingContext2D,
  w:     number,
  h:     number,
  layer: DrawLayer,
): void => {
  const bins = layer.data['bins'] as readonly number[] | undefined
  if (!bins || bins.length === 0) return

  ctx.globalAlpha = layer.alpha
  ctx.fillStyle   = layer.color

  const barW = w / bins.length
  bins.forEach((mag, i) => {
    const barH = mag * h * 0.8
    ctx.fillRect(i * barW, h - barH, barW - 1, barH)
  })
}

/** Draw an RMS radial glow ring. */
const drawRadialGlow = (
  ctx:   CanvasRenderingContext2D,
  w:     number,
  h:     number,
  layer: DrawLayer,
): void => {
  const rms    = (layer.data['rms'] as number | undefined) ?? 0
  const cx     = w / 2
  const cy     = h / 2
  const radius = 80 + rms * 180
  const blur   = 20 + rms * 60

  ctx.globalAlpha = layer.alpha
  const gradient  = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius + blur)
  gradient.addColorStop(0,   layer.color + 'aa')
  gradient.addColorStop(0.5, layer.color + '44')
  gradient.addColorStop(1,   layer.color + '00')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius + blur, 0, Math.PI * 2)
  ctx.fill()
}

/** Draw a thin vertical scrub bar at current sequencer step position. */
const drawStepBar = (
  ctx:   CanvasRenderingContext2D,
  w:     number,
  h:     number,
  layer: DrawLayer,
): void => {
  const step      = (layer.data['step']      as number | undefined) ?? 0
  const stepCount = (layer.data['stepCount'] as number | undefined) ?? 16
  const x         = (step / stepCount) * w

  ctx.globalAlpha = layer.alpha
  ctx.strokeStyle = layer.color
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, h)
  ctx.stroke()
}

/** Draw concentric Euclidean rhythm rings. */
const drawEuclideanRing = (
  ctx:   CanvasRenderingContext2D,
  w:     number,
  h:     number,
  layer: DrawLayer,
): void => {
  const pattern = layer.data['pattern'] as readonly number[] | undefined
  const step    = (layer.data['step']   as number | undefined) ?? 0
  const radius  = (layer.data['radius'] as number | undefined) ?? 120

  if (!pattern || pattern.length === 0) return

  const cx    = w / 2
  const cy    = h / 2
  const total = pattern.length
  const arcW  = (2 * Math.PI) / total

  pattern.forEach((active, i) => {
    const angle     = (i / total) * 2 * Math.PI - Math.PI / 2
    const isCurrent = i === step % total
    const glow      = isCurrent ? 1 : (active ? 0.6 : 0.15)

    ctx.globalAlpha = layer.alpha * glow
    ctx.beginPath()
    ctx.arc(cx, cy, radius, angle, angle + arcW * 0.85)
    ctx.strokeStyle = layer.color
    ctx.lineWidth   = isCurrent ? 4 : 2
    ctx.stroke()

    // Dot at active step
    if (active) {
      const dotX = cx + Math.cos(angle + arcW / 2) * radius
      const dotY = cy + Math.sin(angle + arcW / 2) * radius
      ctx.globalAlpha = layer.alpha * glow
      ctx.beginPath()
      ctx.arc(dotX, dotY, isCurrent ? 5 : 3, 0, Math.PI * 2)
      ctx.fillStyle = layer.color
      ctx.fill()
    }
  })
}

/** Draw Lorenz / logistic map attractor points. */
const drawAttractorPoints = (
  ctx:   CanvasRenderingContext2D,
  w:     number,
  h:     number,
  layer: DrawLayer,
): void => {
  const points = layer.data['points'] as ReadonlyArray<readonly [number, number]> | undefined
  if (!points || points.length === 0) return

  ctx.globalAlpha = layer.alpha * 0.7
  ctx.fillStyle   = layer.color
  points.forEach(([px, py]) => {
    ctx.beginPath()
    ctx.arc(px * w, py * h, 1.5, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** Route a DrawLayer to the correct draw function. */
const drawLayer = (
  ctx:   CanvasRenderingContext2D,
  w:     number,
  h:     number,
  layer: DrawLayer,
): void => {
  ctx.save()
  switch (layer.kind) {
    case 'waveform':         drawWaveform(ctx, w, h, layer);         break
    case 'spectrum':         drawSpectrum(ctx, w, h, layer);         break
    case 'radial-glow':      drawRadialGlow(ctx, w, h, layer);       break
    case 'step-bar':         drawStepBar(ctx, w, h, layer);          break
    case 'euclidean-ring':   drawEuclideanRing(ctx, w, h, layer);    break
    case 'attractor-points': drawAttractorPoints(ctx, w, h, layer);  break
    // Remaining kinds rendered as stub (no-op) until Phase 13d completes
    default:                 break
  }
  ctx.restore()
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Performance Mode visual canvas.
 *
 * Receives pre-assembled {@link AudioVisualState} from `useAudioVisualState`
 * and renders it via the active `@score/visuals` theme on each React render
 * (which is driven by the rAF loop in the parent).
 *
 * @example
 * ```tsx
 * const state = useAudioVisualState(analyserRef, stepRef, bpmRef, tracksRef)
 * <PerformanceCanvas state={state} theme="dark-pulse" editorVisible={true} />
 * ```
 */
const PerformanceCanvasInner = ({
  state,
  theme,
  editorVisible: _editorVisible,
}: PerformanceCanvasProps): React.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Resize canvas to fill container
    const { width, height } = container.getBoundingClientRect()
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width
      canvas.height = height
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    // Resolve theme — fallback to 'dark-pulse' if unknown
    let bundle = null
    try {
      bundle = getTheme(theme)
    } catch {
      try { bundle = getTheme('dark-pulse') } catch { return }
    }

    const scene = bundle.canvasTheme(state)

    // Clear with theme background
    ctx.globalAlpha = 1
    ctx.fillStyle   = scene.background
    ctx.fillRect(0, 0, w, h)

    // Render layers back to front
    scene.layers.forEach(layer => { drawLayer(ctx, w, h, layer) })
  }, [state, theme])

  return (
    <div
      ref={containerRef}
      style={{
        flex:     1,
        display:  'flex',
        overflow: 'hidden',
        position: 'relative' as const,
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="performance-canvas"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}

export const PerformanceCanvas = memo(PerformanceCanvasInner)
