// probability-storm.ts — Probability storm theme (stub — wired in Phase 13d)
// stepProb/degrade density field + OUProcess orbit trace.
// Score-unique: stochastic pattern state as visual density.

import { probabilityAppTheme } from '../app-theme.js'
import { probabilityFieldLayer, waveformLayer } from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

const probabilityStormCanvas = (state: AudioVisualState): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: probabilityAppTheme.background,
  layers: [
    waveformLayer(state.waveform, probabilityAppTheme.textMuted, 0.3),
    ...state.tracks
      .filter(t => t.pattern !== undefined && t.pattern.length > 0)
      .slice(0, 3)
      .map(t => probabilityFieldLayer(
        t.pattern as readonly number[],
        probabilityAppTheme.accent,
        0.6,
      )),
  ],
})

/** Probability storm theme — step probability density field. Score-unique. */
export const probabilityStormBundle: VisualThemeBundle = defineTheme({
  name:        'probability-storm',
  appTheme:    probabilityAppTheme,
  canvasTheme: probabilityStormCanvas,
})
