// neon-grid.ts — Neon grid visual theme (stub — wired in Phase 13d)
// FFT bins → perspective vanishing-point grid extrusion.

import { neonGridAppTheme } from '../app-theme.js'
import { gridLayer, waveformLayer } from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

const neonGridCanvas = (state: AudioVisualState): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: neonGridAppTheme.background,
  layers: [
    waveformLayer(state.waveform, neonGridAppTheme.textMuted, 0.4),
    gridLayer(state.bins, neonGridAppTheme.accent, 0.8),
  ],
})

/** Neon grid theme — FFT bins extrude a perspective grid. */
export const neonGridBundle: VisualThemeBundle = defineTheme({
  name:        'neon-grid',
  appTheme:    neonGridAppTheme,
  canvasTheme: neonGridCanvas,
})
