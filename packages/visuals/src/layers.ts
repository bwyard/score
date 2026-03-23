// layers.ts — Pure DrawLayer builder functions
// These are the building blocks themes compose from — no rendering logic here.
// Every function is pure: same inputs → same DrawLayer output, no side effects.

import type { DrawLayer } from './types.js'

/**
 * Builds a waveform (time-domain oscilloscope) layer.
 *
 * @param waveform - Normalised waveform samples (−1…1).
 * @param color    - Stroke color as CSS hex.
 * @param alpha    - Opacity 0–1. Defaults to 0.8.
 * @returns A DrawLayer of kind 'waveform'.
 */
export const waveformLayer = (
  waveform: readonly number[],
  color:    string,
  alpha:    number = 0.8,
): DrawLayer => ({
  kind:  'waveform',
  color,
  alpha,
  data:  { waveform },
})

/**
 * Builds a spectrum (FFT magnitude bars) layer.
 *
 * @param bins  - FFT magnitude bins normalised 0–1.
 * @param color - Bar color as CSS hex.
 * @param alpha - Opacity 0–1. Defaults to 0.7.
 * @returns A DrawLayer of kind 'spectrum'.
 */
export const spectrumLayer = (
  bins:  readonly number[],
  color: string,
  alpha: number = 0.7,
): DrawLayer => ({
  kind:  'spectrum',
  color,
  alpha,
  data:  { bins },
})

/**
 * Builds a radial glow (RMS pulse ring) layer.
 * Radius and blur expand proportionally to rms.
 *
 * @param rms   - Master RMS amplitude 0–1.
 * @param color - Glow color as CSS hex.
 * @param alpha - Opacity 0–1. Defaults to 0.6.
 * @returns A DrawLayer of kind 'radial-glow'.
 */
export const radialGlowLayer = (
  rms:   number,
  color: string,
  alpha: number = 0.6,
): DrawLayer => ({
  kind:  'radial-glow',
  color,
  alpha,
  data:  { rms },
})

/**
 * Builds a step bar (scrub line) layer showing the current sequencer position.
 *
 * @param step      - Current step index (0-based).
 * @param stepCount - Total step count in the pattern.
 * @param color     - Bar color as CSS hex.
 * @param alpha     - Opacity 0–1. Defaults to 0.5.
 * @returns A DrawLayer of kind 'step-bar'.
 */
export const stepBarLayer = (
  step:      number,
  stepCount: number,
  color:     string,
  alpha:     number = 0.5,
): DrawLayer => ({
  kind:  'step-bar',
  color,
  alpha,
  data:  { step, stepCount },
})

/**
 * Builds an Euclidean ring layer for one track.
 * Renders a circle divided into `pattern.length` arcs; active steps glow.
 *
 * @param pattern - Step pattern array (1 = active, 0 = rest).
 * @param step    - Current sequencer step (determines which arc is lit).
 * @param color   - Ring color as CSS hex.
 * @param radius  - Ring radius in canvas pixels.
 * @param alpha   - Opacity 0–1. Defaults to 0.9.
 * @returns A DrawLayer of kind 'euclidean-ring'.
 */
export const euclideanRingLayer = (
  pattern: readonly number[],
  step:    number,
  color:   string,
  radius:  number,
  alpha:   number = 0.9,
): DrawLayer => ({
  kind:  'euclidean-ring',
  color,
  alpha,
  data:  { pattern, step, radius },
})

/**
 * Builds a perspective grid layer (neon extrusion style).
 * FFT bins drive the height of grid lines.
 *
 * @param bins  - FFT magnitude bins 0–1.
 * @param color - Grid line color as CSS hex.
 * @param alpha - Opacity 0–1. Defaults to 0.85.
 * @returns A DrawLayer of kind 'grid'.
 */
export const gridLayer = (
  bins:  readonly number[],
  color: string,
  alpha: number = 0.85,
): DrawLayer => ({
  kind:  'grid',
  color,
  alpha,
  data:  { bins },
})

/**
 * Builds an attractor points layer (Lorenz / logistic trajectory).
 *
 * @param points - Array of [x, y] normalised canvas positions (0–1 each).
 * @param color  - Point color as CSS hex.
 * @param alpha  - Opacity 0–1. Defaults to 0.7.
 * @returns A DrawLayer of kind 'attractor-points'.
 */
export const attractorPointsLayer = (
  points: readonly [number, number][],
  color:  string,
  alpha:  number = 0.7,
): DrawLayer => ({
  kind:  'attractor-points',
  color,
  alpha,
  data:  { points },
})

/**
 * Builds a probability field layer (stepProb / degrade density heatmap).
 *
 * @param probs - Probability values per step (0–1).
 * @param color - Heatmap base color as CSS hex.
 * @param alpha - Opacity 0–1. Defaults to 0.6.
 * @returns A DrawLayer of kind 'probability-field'.
 */
export const probabilityFieldLayer = (
  probs: readonly number[],
  color: string,
  alpha: number = 0.6,
): DrawLayer => ({
  kind:  'probability-field',
  color,
  alpha,
  data:  { probs },
})

/**
 * Builds a particle burst layer triggered on active hits.
 *
 * @param active - Whether a hit occurred on the current step.
 * @param color  - Particle color as CSS hex.
 * @param alpha  - Opacity 0–1. Defaults to 0.9.
 * @returns A DrawLayer of kind 'particle-burst'.
 */
export const particleBurstLayer = (
  active: boolean,
  color:  string,
  alpha:  number = 0.9,
): DrawLayer => ({
  kind:  'particle-burst',
  color,
  alpha,
  data:  { active },
})

/**
 * Builds an orbit (OUProcess drift trace) layer.
 * Renders a smooth curve through recent drift positions.
 *
 * @param trail - Array of [x, y] normalised positions (0–1 each), most recent last.
 * @param color - Trace color as CSS hex.
 * @param alpha - Opacity 0–1. Defaults to 0.75.
 * @returns A DrawLayer of kind 'orbit'.
 */
export const orbitLayer = (
  trail: readonly [number, number][],
  color: string,
  alpha: number = 0.75,
): DrawLayer => ({
  kind:  'orbit',
  color,
  alpha,
  data:  { trail },
})
