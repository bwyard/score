// tidal-stream.ts — Tidal stream theme (stub — wired in Phase 13d)
// Clean-room Strudel-comparable: flowing waveform stream that bends at BPM.
// AGPL-3.0 note: zero Strudel code — visual concept only.

import { tidalStreamAppTheme } from '../app-theme.js'
import { waveformLayer, spectrumLayer, stepBarLayer } from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

const tidalStreamCanvas = (state: AudioVisualState): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: tidalStreamAppTheme.background,
  layers: [
    spectrumLayer(state.bins, tidalStreamAppTheme.accentMuted, 0.5),
    waveformLayer(state.waveform, tidalStreamAppTheme.accent, 0.8),
    stepBarLayer(state.step, 16, tidalStreamAppTheme.textMuted, 0.3),
  ],
})

/** Tidal stream theme — flowing waveform that bends and pulses at BPM. */
export const tidalStreamBundle: VisualThemeBundle = defineTheme({
  name:        'tidal-stream',
  appTheme:    tidalStreamAppTheme,
  canvasTheme: tidalStreamCanvas,
})
