// event-cascade.ts — Event cascade theme (stub — wired in Phase 13d)
// Clean-room Strudel-comparable: falling colored rectangles per hit.
// AGPL-3.0 note: zero Strudel code — visual concept only.

import { eventCascadeAppTheme } from '../app-theme.js'
import { particleBurstLayer, waveformLayer } from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

const eventCascadeCanvas = (state: AudioVisualState): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: eventCascadeAppTheme.background,
  layers: [
    waveformLayer(state.waveform, eventCascadeAppTheme.textMuted, 0.3),
    ...state.tracks
      .filter(t => t.active)
      .slice(0, 4)
      .map((t, i) => particleBurstLayer(
        t.active,
        eventCascadeAppTheme.tracks[i % eventCascadeAppTheme.tracks.length] ?? eventCascadeAppTheme.accent,
        0.9,
      )),
  ],
})

/** Event cascade theme — falling colored particles on active hits. */
export const eventCascadeBundle: VisualThemeBundle = defineTheme({
  name:        'event-cascade',
  appTheme:    eventCascadeAppTheme,
  canvasTheme: eventCascadeCanvas,
})
