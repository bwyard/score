// euclidean-mandala.ts — Euclidean mandala theme (stub — wired in Phase 13d)
// Track patterns → concentric Euclidean polygon rings.
// Score-unique: rhythm geometry as visual art.

import { euclideanAppTheme } from '../app-theme.js'
import { euclideanRingLayer, radialGlowLayer } from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

const euclideanMandalaCanvas = (state: AudioVisualState): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: euclideanAppTheme.background,
  layers: [
    radialGlowLayer(state.rms, euclideanAppTheme.accent, 0.5),
    ...state.tracks
      .filter(t => t.pattern !== undefined)
      .slice(0, 5)
      .map((t, i) => euclideanRingLayer(
        t.pattern!,
        state.tick.step,
        euclideanAppTheme.tracks[i % euclideanAppTheme.tracks.length] ?? euclideanAppTheme.accent,
        100 + i * 50,
        0.8,
      )),
  ],
})

/** Euclidean mandala theme — rhythm geometry as concentric rings. Score-unique. */
export const euclideanMandalaBundle: VisualThemeBundle = defineTheme({
  name:        'euclidean-mandala',
  appTheme:    euclideanAppTheme,
  canvasTheme: euclideanMandalaCanvas,
})
