// dark-pulse.ts — Score's default visual theme
// Fully fleshed out — Friday demo theme.
// RMS radial glow + euclidean rings + waveform trace.
// Score-unique: rhythm geometry driven by euclidean patterns.

import { darkPulseAppTheme } from '../app-theme.js'
import {
  radialGlowLayer,
  waveformLayer,
  euclideanRingLayer,
  stepBarLayer,
} from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle, AppTheme } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

// ── Canvas theme ──────────────────────────────────────────────────────────────

const RING_BASE_R   = 160  // base radius for first euclidean ring
const RING_SPACING  = 48   // px between concentric rings

const darkPulseCanvas = (state: AudioVisualState): VisualSceneDescriptor => {
  const { waveform, rms, step, tracks } = state
  const theme: AppTheme = darkPulseAppTheme

  // Radial glow — master RMS drives pulse ring expansion
  const glow = radialGlowLayer(rms, theme.accent, 0.55)

  // Waveform trace — time-domain oscilloscope over full width
  const wave = waveformLayer(waveform, theme.textMuted, 0.45)

  // Euclidean rings — one ring per active track with a pattern
  const rings = tracks
    .filter(t => t.pattern !== undefined && t.pattern.length > 0)
    .slice(0, 6)
    .map((t, i) => euclideanRingLayer(
      t.pattern!,
      step,
      theme.tracks[i % theme.tracks.length] ?? theme.accent,
      RING_BASE_R + i * RING_SPACING,
      t.active ? 0.95 : 0.55,
    ))

  // Step bar — thin vertical scrub line
  const bar = stepBarLayer(step, 16, theme.accentMuted, 0.35)

  return {
    _type:      'VisualSceneDescriptor',
    background: theme.background,
    layers:     [bar, wave, glow, ...rings],
  }
}

// ── Bundle ────────────────────────────────────────────────────────────────────

/**
 * Score's default dark-pulse visual theme.
 * RMS glow + euclidean rhythm rings + waveform trace.
 * Uses @score/math Euclidean geometry via track patterns.
 */
export const darkPulseBundle: VisualThemeBundle = defineTheme({
  name:        'dark-pulse',
  appTheme:    darkPulseAppTheme,
  canvasTheme: darkPulseCanvas,
})
