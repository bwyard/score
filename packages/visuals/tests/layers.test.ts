// layers.test.ts — DrawLayer builder function tests

import { describe, it, expect } from 'vitest'
import {
  waveformLayer, spectrumLayer, radialGlowLayer, stepBarLayer,
  euclideanRingLayer, gridLayer, attractorPointsLayer,
  probabilityFieldLayer, particleBurstLayer, orbitLayer,
} from '../src/layers.js'

const COLOR = '#4a8fff'

describe('waveformLayer', () => {
  it('returns kind waveform', () => { expect(waveformLayer([], COLOR).kind).toBe('waveform'); })
  it('stores waveform in data', () => {
    const w = [0.1, 0.2]
    expect((waveformLayer(w, COLOR).data as { waveform: number[] }).waveform).toEqual(w)
  })
  it('defaults alpha to 0.8', () => { expect(waveformLayer([], COLOR).alpha).toBe(0.8); })
  it('accepts custom alpha', () => { expect(waveformLayer([], COLOR, 0.5).alpha).toBe(0.5); })
})

describe('spectrumLayer', () => {
  it('returns kind spectrum', () => { expect(spectrumLayer([], COLOR).kind).toBe('spectrum'); })
  it('stores bins in data', () => {
    const bins = [0.5, 0.8]
    expect((spectrumLayer(bins, COLOR).data as { bins: number[] }).bins).toEqual(bins)
  })
  it('defaults alpha to 0.7', () => { expect(spectrumLayer([], COLOR).alpha).toBe(0.7); })
})

describe('radialGlowLayer', () => {
  it('returns kind radial-glow', () => { expect(radialGlowLayer(0.5, COLOR).kind).toBe('radial-glow'); })
  it('stores rms in data', () => {
    expect((radialGlowLayer(0.7, COLOR).data as { rms: number }).rms).toBe(0.7)
  })
  it('defaults alpha to 0.6', () => { expect(radialGlowLayer(0, COLOR).alpha).toBe(0.6); })
})

describe('stepBarLayer', () => {
  it('returns kind step-bar', () => { expect(stepBarLayer(4, 16, COLOR).kind).toBe('step-bar'); })
  it('stores step and stepCount in data', () => {
    const data = stepBarLayer(4, 16, COLOR).data as { step: number; stepCount: number }
    expect(data.step).toBe(4)
    expect(data.stepCount).toBe(16)
  })
  it('defaults alpha to 0.5', () => { expect(stepBarLayer(0, 16, COLOR).alpha).toBe(0.5); })
})

describe('euclideanRingLayer', () => {
  it('returns kind euclidean-ring', () => {
    expect(euclideanRingLayer([], 0, COLOR, 100).kind).toBe('euclidean-ring')
  })
  it('stores pattern, step, and radius in data', () => {
    const pat = [1, 0, 1, 0]
    const data = euclideanRingLayer(pat, 2, COLOR, 120).data as { pattern: number[]; step: number; radius: number }
    expect(data.pattern).toEqual(pat)
    expect(data.step).toBe(2)
    expect(data.radius).toBe(120)
  })
  it('defaults alpha to 0.9', () => { expect(euclideanRingLayer([], 0, COLOR, 100).alpha).toBe(0.9); })
})

describe('gridLayer', () => {
  it('returns kind grid', () => { expect(gridLayer([], COLOR).kind).toBe('grid'); })
  it('stores bins in data', () => {
    const bins = [0.1, 0.9]
    expect((gridLayer(bins, COLOR).data as { bins: number[] }).bins).toEqual(bins)
  })
})

describe('attractorPointsLayer', () => {
  it('returns kind attractor-points', () => {
    expect(attractorPointsLayer([], COLOR).kind).toBe('attractor-points')
  })
  it('stores points in data', () => {
    const pts: [number, number][] = [[0.1, 0.2], [0.5, 0.6]]
    expect((attractorPointsLayer(pts, COLOR).data as { points: [number, number][] }).points).toEqual(pts)
  })
})

describe('probabilityFieldLayer', () => {
  it('returns kind probability-field', () => {
    expect(probabilityFieldLayer([], COLOR).kind).toBe('probability-field')
  })
  it('stores probs in data', () => {
    const probs = [0.5, 0.8, 0.3]
    expect((probabilityFieldLayer(probs, COLOR).data as { probs: number[] }).probs).toEqual(probs)
  })
})

describe('particleBurstLayer', () => {
  it('returns kind particle-burst', () => {
    expect(particleBurstLayer(true, COLOR).kind).toBe('particle-burst')
  })
  it('stores active in data', () => {
    expect((particleBurstLayer(false, COLOR).data as { active: boolean }).active).toBe(false)
  })
  it('defaults alpha to 0.9', () => { expect(particleBurstLayer(true, COLOR).alpha).toBe(0.9); })
})

describe('orbitLayer', () => {
  it('returns kind orbit', () => { expect(orbitLayer([], COLOR).kind).toBe('orbit'); })
  it('stores trail in data', () => {
    const trail: [number, number][] = [[0.3, 0.4]]
    expect((orbitLayer(trail, COLOR).data as { trail: [number, number][] }).trail).toEqual(trail)
  })
})

describe('all layer builders', () => {
  it('each builder sets color correctly', () => {
    expect(waveformLayer([], '#aabbcc').color).toBe('#aabbcc')
    expect(spectrumLayer([], '#aabbcc').color).toBe('#aabbcc')
    expect(radialGlowLayer(0, '#aabbcc').color).toBe('#aabbcc')
    expect(euclideanRingLayer([], 0, '#aabbcc', 100).color).toBe('#aabbcc')
  })

  it('each builder returns a non-null data object', () => {
    expect(waveformLayer([], COLOR).data).toBeTruthy()
    expect(spectrumLayer([], COLOR).data).toBeTruthy()
    expect(radialGlowLayer(0, COLOR).data).toBeTruthy()
    expect(stepBarLayer(0, 16, COLOR).data).toBeTruthy()
  })
})
