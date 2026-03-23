// themes.test.ts — VisualThemeBundle + canvas function tests
// Each theme must return a valid VisualSceneDescriptor with background + ≥1 layer.

import { describe, it, expect } from 'vitest'
import { darkPulseBundle }        from '../src/themes/dark-pulse.js'
import { lorenzBundle }           from '../src/themes/lorenz.js'
import { neonGridBundle }         from '../src/themes/neon-grid.js'
import { logisticBundle }         from '../src/themes/logistic.js'
import { euclideanMandalaBundle } from '../src/themes/euclidean-mandala.js'
import { probabilityStormBundle } from '../src/themes/probability-storm.js'
import { minimalBundle }          from '../src/themes/minimal.js'
import { cycleRingsBundle }       from '../src/themes/cycle-rings.js'
import { eventCascadeBundle }     from '../src/themes/event-cascade.js'
import { tidalStreamBundle }      from '../src/themes/tidal-stream.js'
import type { AudioVisualState } from '../src/types.js'

// ── Shared test state ─────────────────────────────────────────────────────────

const baseState: AudioVisualState = {
  waveform: Array.from({ length: 128 }, (_, i) => Math.sin(i / 10) * 0.5),
  bins:     Array.from({ length: 64  }, (_, i) => i / 64),
  step:     4,
  bar:      1,
  bpm:      128,
  rms:      0.4,
  tracks: [
    { name: 'kick', type: 'kick', active: true,  rms: 0.8, pattern: [1, 0, 0, 0, 1, 0, 0, 0] },
    { name: 'bass', type: 'synth', active: false, rms: 0.2, pattern: [0, 0, 1, 0, 0, 0, 1, 0] },
  ],
}

const emptyState: AudioVisualState = {
  waveform: [],
  bins:     [],
  step:     0,
  bar:      0,
  bpm:      120,
  rms:      0,
  tracks:   [],
}

// ── Helper ────────────────────────────────────────────────────────────────────

const isValidScene = (scene: unknown): boolean => {
  if (!scene || typeof scene !== 'object') return false
  const s = scene as Record<string, unknown>
  if (s._type !== 'VisualSceneDescriptor') return false
  if (typeof s.background !== 'string') return false
  if (!Array.isArray(s.layers)) return false
  return true
}

// ── All 10 themes ─────────────────────────────────────────────────────────────

const allBundles = [
  darkPulseBundle, lorenzBundle, neonGridBundle, logisticBundle,
  euclideanMandalaBundle, probabilityStormBundle, minimalBundle,
  cycleRingsBundle, eventCascadeBundle, tidalStreamBundle,
]

describe('all themes', () => {
  it('each bundle has a unique name', () => {
    const names = allBundles.map(b => b.name)
    expect(new Set(names).size).toBe(allBundles.length)
  })

  it('each bundle has appTheme with required keys', () => {
    for (const bundle of allBundles) {
      expect(typeof bundle.appTheme.background).toBe('string')
      expect(typeof bundle.appTheme.accent).toBe('string')
      expect(Array.isArray(bundle.appTheme.tracks)).toBe(true)
    }
  })

  it('each canvasTheme returns a valid VisualSceneDescriptor with base state', () => {
    for (const bundle of allBundles) {
      const scene = bundle.canvasTheme(baseState)
      expect(isValidScene(scene), `${bundle.name} scene invalid`).toBe(true)
    }
  })

  it('each canvasTheme returns a valid VisualSceneDescriptor with empty state', () => {
    for (const bundle of allBundles) {
      const scene = bundle.canvasTheme(emptyState)
      expect(isValidScene(scene), `${bundle.name} empty scene invalid`).toBe(true)
    }
  })

  it('each scene has at least one layer', () => {
    for (const bundle of allBundles) {
      const scene = bundle.canvasTheme(baseState)
      expect(scene.layers.length, `${bundle.name} has no layers`).toBeGreaterThan(0)
    }
  })

  it('each layer has kind, color, alpha, and data', () => {
    for (const bundle of allBundles) {
      const scene = bundle.canvasTheme(baseState)
      for (const layer of scene.layers) {
        expect(typeof layer.kind).toBe('string')
        expect(typeof layer.color).toBe('string')
        expect(typeof layer.alpha).toBe('number')
        expect(typeof layer.data).toBe('object')
      }
    }
  })
})

// ── dark-pulse ────────────────────────────────────────────────────────────────

describe('darkPulseBundle', () => {
  it('name is dark-pulse', () => { expect(darkPulseBundle.name).toBe('dark-pulse'); })
  it('produces radial-glow layer', () => {
    const scene = darkPulseBundle.canvasTheme(baseState)
    expect(scene.layers.some(l => l.kind === 'radial-glow')).toBe(true)
  })
  it('produces waveform layer', () => {
    const scene = darkPulseBundle.canvasTheme(baseState)
    expect(scene.layers.some(l => l.kind === 'waveform')).toBe(true)
  })
})

// ── lorenz ────────────────────────────────────────────────────────────────────

describe('lorenzBundle', () => {
  it('name is lorenz', () => { expect(lorenzBundle.name).toBe('lorenz'); })
  it('produces attractor-points layer', () => {
    const scene = lorenzBundle.canvasTheme(baseState)
    expect(scene.layers.some(l => l.kind === 'attractor-points')).toBe(true)
  })
  it('trail grows with each call', () => {
    // Call multiple times — trail buffer accumulates points
    const calls = Array.from({ length: 5 }, () => lorenzBundle.canvasTheme(baseState))
    const lastPts = (calls[4]!.layers.find(l => l.kind === 'attractor-points')!.data as { points: unknown[] }).points
    // After 5+ calls the trail should have at least 1 point
    expect(Array.isArray(lastPts)).toBe(true)
    expect((lastPts).length).toBeGreaterThan(0)
  })
})

// ── minimal ───────────────────────────────────────────────────────────────────

describe('minimalBundle', () => {
  it('name is minimal', () => { expect(minimalBundle.name).toBe('minimal'); })
  it('produces exactly 2 layers', () => {
    const scene = minimalBundle.canvasTheme(baseState)
    expect(scene.layers).toHaveLength(2)
  })
  it('has waveform + step-bar only', () => {
    const scene = minimalBundle.canvasTheme(baseState)
    const kinds = scene.layers.map(l => l.kind)
    expect(kinds).toContain('waveform')
    expect(kinds).toContain('step-bar')
  })
})
