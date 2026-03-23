// lorenz.ts — Lorenz chaos attractor visual theme
// Fully fleshed out — Friday demo theme. Math-as-art: the SAME attractor
// that ran the bass pattern draws its trajectory on screen.
// Uses createLorenz from @score/math — Score-unique capability.

import { createLorenz } from '@score/math'
import { lorenzAppTheme } from '../app-theme.js'
import {
  attractorPointsLayer,
  radialGlowLayer,
  waveformLayer,
  euclideanRingLayer,
} from '../layers.js'
import { defineTheme } from '../registry.js'
import type { VisualThemeBundle } from '../app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../types.js'

// ── Stateful Lorenz simulator (closure — not exported) ────────────────────────
// One simulator per theme bundle instance. The attractor state persists between
// animation frames, producing a continuous trajectory.
// This is the same numerical integration (@score/math RK4) that the bass sequence uses.

const TRAIL_LENGTH = 512  // number of trajectory points to keep
const DT_BASE      = 0.008 // base time step per frame

// Mutable trail buffer — this is the ONLY mutable state in @score/visuals
// (registry Maps and this Lorenz trail are the two annotated BOUNDARIES).
// BOUNDARY: Lorenz trail state accumulates across animation frames.
type Point = [number, number]
const trail: Point[] = []

const lorenz = createLorenz({ sigma: 10, rho: 28, beta: 8 / 3 })

// Normalise Lorenz x/y/z → 0–1 canvas coordinates
const normalise = (v: number, min: number, max: number): number =>
  Math.max(0, Math.min(1, (v - min) / (max - min)))

const lorenzCanvas = (state: AudioVisualState): VisualSceneDescriptor => {
  const { rms, waveform, tracks, tick, math } = state
  const theme = lorenzAppTheme

  // Advance the attractor — use state.math.lorenz if provided (same math as audio),
  // otherwise advance our local simulator. BPM speeds up the trajectory slightly.
  const dt = DT_BASE * (1 + (tick.bpm / 128 - 1) * 0.3)

  if (math?.lorenz !== undefined) {
    // Use the exact position from the audio engine's Lorenz run
    const { x, y } = math.lorenz
    const nx = normalise(x, -25, 25)
    const ny = normalise(y, -30, 30)
    trail.push([nx, ny])
  } else {
    // Local sim — still shows the attractor, just not perfectly synced
    const next = lorenz.next(dt)
    const nx = normalise(next.x, -25, 25)
    const ny = normalise(next.y, -30, 30)
    trail.push([nx, ny])
  }

  // Trim trail to max length
  if (trail.length > TRAIL_LENGTH) trail.splice(0, trail.length - TRAIL_LENGTH)

  // Lorenz trajectory — colored by track 0 (kick) activity
  const trailColor = tracks[0]?.active ? theme.accent : theme.textMuted
  const attractor = attractorPointsLayer(
    trail as readonly Point[],
    trailColor,
    0.8,
  )

  // Radial glow — RMS drives the intensity of the chaos field
  const glow = radialGlowLayer(rms, theme.accent, 0.4)

  // Waveform — subtle background trace
  const wave = waveformLayer(waveform, theme.border, 0.25)

  // Euclidean rings for tracks with patterns — using void palette colors
  const rings = tracks
    .filter(t => t.pattern !== undefined && t.pattern.length > 0)
    .slice(0, 3)
    .map((t, i) => euclideanRingLayer(
      t.pattern!,
      tick.step,
      theme.tracks[i % theme.tracks.length] ?? theme.accent,
      120 + i * 40,
      t.active ? 0.7 : 0.3,
    ))

  return {
    _type:      'VisualSceneDescriptor',
    background: theme.background,
    layers:     [wave, ...rings, glow, attractor],
  }
}

// ── Bundle ────────────────────────────────────────────────────────────────────

/**
 * Lorenz chaos attractor visual theme.
 * Math-as-art: the visual IS the math that made the music.
 * The same Lorenz attractor that drives bass sequences draws its trajectory on screen.
 * Responds to AudioVisualState.math.lorenz when provided by the engine.
 */
export const lorenzBundle: VisualThemeBundle = defineTheme({
  name:        'lorenz',
  appTheme:    lorenzAppTheme,
  canvasTheme: lorenzCanvas,
})
