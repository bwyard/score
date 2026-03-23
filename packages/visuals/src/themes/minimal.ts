// minimal.ts — Minimal visual theme
// Step bar + waveform only — clean hybrid DJ/set mode.

import { minimalAppTheme } from '../app-theme.js'
import { waveformLayer, stepBarLayer } from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

const minimalCanvas = (state: AudioVisualState): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: minimalAppTheme.background,
  layers: [
    waveformLayer(state.waveform, minimalAppTheme.accent, 0.7),
    stepBarLayer(state.step, 16, minimalAppTheme.textMuted, 0.4),
  ],
})

/** Minimal theme — step bar and waveform only. Clean DJ/set mode. */
export const minimalBundle: VisualThemeBundle = defineTheme({
  name:        'minimal',
  appTheme:    minimalAppTheme,
  canvasTheme: minimalCanvas,
})
