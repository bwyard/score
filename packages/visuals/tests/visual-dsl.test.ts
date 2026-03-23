// visual-dsl.test.ts — Visual DSL factory function tests

import { describe, it, expect } from 'vitest'
import {
  waveformArc, euclideanRing, lorenzTrail,
  spectrumBars, stepDots, textLabel, particleBurst,
} from '../src/visual-dsl.js'

describe('waveformArc', () => {
  it('returns _type VisualOverlayDescriptor', () => {
    expect(waveformArc()._type).toBe('VisualOverlayDescriptor')
  })
  it('returns kind waveform-arc', () => {
    expect(waveformArc().kind).toBe('waveform-arc')
  })
  it('passes color option through', () => {
    expect(waveformArc({ color: '#ff0000' }).color).toBe('#ff0000')
  })
  it('passes alpha option through', () => {
    expect(waveformArc({ alpha: 0.4 }).alpha).toBe(0.4)
  })
})

describe('euclideanRing', () => {
  it('returns kind euclidean-ring', () => {
    expect(euclideanRing().kind).toBe('euclidean-ring')
  })
  it('stores radius in options', () => {
    expect((euclideanRing({ radius: 120 }).options as { radius: number }).radius).toBe(120)
  })
})

describe('lorenzTrail', () => {
  it('returns kind lorenz-trail', () => {
    expect(lorenzTrail().kind).toBe('lorenz-trail')
  })
  it('defaults trailLength to 64', () => {
    expect((lorenzTrail().options as { trailLength: number }).trailLength).toBe(64)
  })
  it('accepts custom trailLength', () => {
    expect((lorenzTrail({ trailLength: 128 }).options as { trailLength: number }).trailLength).toBe(128)
  })
})

describe('spectrumBars', () => {
  it('returns kind spectrum-bars', () => {
    expect(spectrumBars().kind).toBe('spectrum-bars')
  })
  it('defaults gap to 1', () => {
    expect((spectrumBars().options as { gap: number }).gap).toBe(1)
  })
})

describe('stepDots', () => {
  it('returns kind step-dots', () => {
    expect(stepDots().kind).toBe('step-dots')
  })
  it('returns _type VisualOverlayDescriptor', () => {
    expect(stepDots()._type).toBe('VisualOverlayDescriptor')
  })
})

describe('textLabel', () => {
  it('returns kind text-label', () => {
    expect(textLabel('hello').kind).toBe('text-label')
  })
  it('stores text in options', () => {
    expect((textLabel('world').options as { text: string }).text).toBe('world')
  })
  it('defaults x and y to 0.5', () => {
    const opts = textLabel('').options as { x: number; y: number }
    expect(opts.x).toBe(0.5)
    expect(opts.y).toBe(0.5)
  })
})

describe('particleBurst', () => {
  it('returns kind particle-burst', () => {
    expect(particleBurst().kind).toBe('particle-burst')
  })
  it('defaults count to 20', () => {
    expect((particleBurst().options as { count: number }).count).toBe(20)
  })
  it('accepts custom count', () => {
    expect((particleBurst({ count: 50 }).options as { count: number }).count).toBe(50)
  })
})

describe('all overlay factories', () => {
  it('each returns _type VisualOverlayDescriptor', () => {
    expect(waveformArc()._type).toBe('VisualOverlayDescriptor')
    expect(euclideanRing()._type).toBe('VisualOverlayDescriptor')
    expect(lorenzTrail()._type).toBe('VisualOverlayDescriptor')
    expect(spectrumBars()._type).toBe('VisualOverlayDescriptor')
    expect(stepDots()._type).toBe('VisualOverlayDescriptor')
    expect(textLabel('')._type).toBe('VisualOverlayDescriptor')
    expect(particleBurst()._type).toBe('VisualOverlayDescriptor')
  })

  it('undefined color when not passed', () => {
    expect(waveformArc().color).toBeUndefined()
    expect(lorenzTrail().color).toBeUndefined()
  })
})
