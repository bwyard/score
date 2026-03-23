// logistic.ts — Logistic map bifurcation theme (stub — wired in Phase 13d)
// BPM drives the r parameter, visualising the bifurcation diagram.
// Score-unique: logistic chaos from @score/math.

import { logisticAppTheme } from '../app-theme.js'
import { waveformLayer, spectrumLayer } from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

const logisticCanvas = (state: AudioVisualState): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: logisticAppTheme.background,
  layers: [
    waveformLayer(state.waveform, logisticAppTheme.textMuted, 0.4),
    spectrumLayer(state.bins, logisticAppTheme.accent, 0.7),
  ],
})

/** Logistic map bifurcation theme — BPM drives r parameter. Score-unique capability. */
export const logisticBundle: VisualThemeBundle = defineTheme({
  name:        'logistic',
  appTheme:    logisticAppTheme,
  canvasTheme: logisticCanvas,
})
