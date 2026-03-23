// visual-dsl.ts — Visual DSL factory functions
// Pure functions returning VisualOverlayDescriptor — same factory style as DSL instruments.
// Song authors compose these in the `visual` property of Song({ ... }).

import type { VisualOverlayDescriptor } from './types.js'

// ── Overlay factory options ───────────────────────────────────────────────────

/** Options shared by all overlay factories. */
type OverlayBaseOptions = {
  /** Color override as CSS hex. Defaults to active AppTheme.tracks[trackIndex]. */
  readonly color?: string
  /** Opacity 0–1. */
  readonly alpha?: number
}

/**
 * Waveform arc overlay — oscilloscope trace wrapped into a circular arc.
 *
 * @param opts - Optional color and alpha overrides.
 * @returns A VisualOverlayDescriptor of kind 'waveform-arc'.
 *
 * @example
 * ```ts
 * Song({ visual: { overlays: [waveformArc({ alpha: 0.6 })] } })
 * ```
 */
export const waveformArc = (opts: OverlayBaseOptions = {}): VisualOverlayDescriptor => ({
  _type:   'VisualOverlayDescriptor',
  kind:    'waveform-arc',
  ...(opts.color !== undefined && { color: opts.color }),
  ...(opts.alpha !== undefined && { alpha: opts.alpha }),
  options: {},
})

/**
 * Euclidean ring overlay — concentric rhythm geometry for all active tracks.
 *
 * @param opts - Optional color, alpha, and ring radius options.
 * @returns A VisualOverlayDescriptor of kind 'euclidean-ring'.
 *
 * @example
 * ```ts
 * Song({ visual: { overlays: [euclideanRing({ alpha: 0.8 })] } })
 * ```
 */
export const euclideanRing = (
  opts: OverlayBaseOptions & { readonly radius?: number } = {},
): VisualOverlayDescriptor => ({
  _type:   'VisualOverlayDescriptor',
  kind:    'euclidean-ring',
  ...(opts.color  !== undefined && { color: opts.color }),
  ...(opts.alpha  !== undefined && { alpha: opts.alpha }),
  options: { radius: opts.radius },
})

/**
 * Lorenz trail overlay — renders the last N Lorenz attractor positions as a glowing trail.
 * Uses `state.math.lorenz` — the same attractor that ran the bass pattern.
 *
 * @param opts - Optional color, alpha, and trail length options.
 * @returns A VisualOverlayDescriptor of kind 'lorenz-trail'.
 *
 * @example
 * ```ts
 * Song({ visual: { overlays: [lorenzTrail({ color: '#cc44ff' })] } })
 * ```
 */
export const lorenzTrail = (
  opts: OverlayBaseOptions & { readonly trailLength?: number } = {},
): VisualOverlayDescriptor => ({
  _type:   'VisualOverlayDescriptor',
  kind:    'lorenz-trail',
  ...(opts.color !== undefined && { color: opts.color }),
  ...(opts.alpha !== undefined && { alpha: opts.alpha }),
  options: { trailLength: opts.trailLength ?? 64 },
})

/**
 * Spectrum bars overlay — FFT frequency bars.
 *
 * @param opts - Optional color, alpha, and bar gap options.
 * @returns A VisualOverlayDescriptor of kind 'spectrum-bars'.
 */
export const spectrumBars = (
  opts: OverlayBaseOptions & { readonly gap?: number } = {},
): VisualOverlayDescriptor => ({
  _type:   'VisualOverlayDescriptor',
  kind:    'spectrum-bars',
  ...(opts.color !== undefined && { color: opts.color }),
  ...(opts.alpha !== undefined && { alpha: opts.alpha }),
  options: { gap: opts.gap ?? 1 },
})

/**
 * Step dots overlay — per-track step grid rendered as small dots.
 *
 * @param opts - Optional color and alpha overrides.
 * @returns A VisualOverlayDescriptor of kind 'step-dots'.
 */
export const stepDots = (opts: OverlayBaseOptions = {}): VisualOverlayDescriptor => ({
  _type:   'VisualOverlayDescriptor',
  kind:    'step-dots',
  ...(opts.color !== undefined && { color: opts.color }),
  ...(opts.alpha !== undefined && { alpha: opts.alpha }),
  options: {},
})

/**
 * Text label overlay — static text rendered on the canvas.
 *
 * @param text - The text string to display.
 * @param opts - Optional color, alpha, and position options.
 * @returns A VisualOverlayDescriptor of kind 'text-label'.
 *
 * @example
 * ```ts
 * Song({ visual: { overlays: [textLabel('140 BPM', { color: '#ffffff' })] } })
 * ```
 */
export const textLabel = (
  text: string,
  opts: OverlayBaseOptions & { readonly x?: number; readonly y?: number } = {},
): VisualOverlayDescriptor => ({
  _type:   'VisualOverlayDescriptor',
  kind:    'text-label',
  ...(opts.color !== undefined && { color: opts.color }),
  ...(opts.alpha !== undefined && { alpha: opts.alpha }),
  options: { text, x: opts.x ?? 0.5, y: opts.y ?? 0.5 },
})

/**
 * Particle burst overlay — per-hit particle emitter for active tracks.
 *
 * @param opts - Optional color, alpha, and particle count options.
 * @returns A VisualOverlayDescriptor of kind 'particle-burst'.
 */
export const particleBurst = (
  opts: OverlayBaseOptions & { readonly count?: number } = {},
): VisualOverlayDescriptor => ({
  _type:   'VisualOverlayDescriptor',
  kind:    'particle-burst',
  ...(opts.color !== undefined && { color: opts.color }),
  ...(opts.alpha !== undefined && { alpha: opts.alpha }),
  options: { count: opts.count ?? 20 },
})
