// cycle-rings.ts — Cycle rings theme (stub — wired in Phase 13d)
// Clean-room Strudel-comparable: concentric rotating arcs, one per track.
// AGPL-3.0 note: zero Strudel code — visual concept only (arcs are not IP).

import { cycleRingsAppTheme } from '../app-theme.js'
import { euclideanRingLayer, radialGlowLayer } from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

const cycleRingsCanvas = (state: AudioVisualState): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: cycleRingsAppTheme.background,
  layers: [
    radialGlowLayer(state.rms, cycleRingsAppTheme.accent, 0.4),
    ...state.tracks
      .filter(t => t.pattern !== undefined)
      .slice(0, 6)
      .map((t, i) => euclideanRingLayer(
        t.pattern!,
        state.step,
        cycleRingsAppTheme.tracks[i % cycleRingsAppTheme.tracks.length] ?? cycleRingsAppTheme.accent,
        80 + i * 44,
        t.active ? 1.0 : 0.5,
      )),
  ],
})

/** Cycle rings theme — concentric rotating pattern arcs per track. */
export const cycleRingsBundle: VisualThemeBundle = defineTheme({
  name:        'cycle-rings',
  appTheme:    cycleRingsAppTheme,
  canvasTheme: cycleRingsCanvas,
})
