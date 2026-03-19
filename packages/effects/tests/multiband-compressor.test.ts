import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createMultibandCompressor } from '../src/multiband-compressor.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createMultibandCompressor', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(typeof mb.connect).toBe('function')
    expect(typeof mb.disconnect).toBe('function')
    expect(typeof mb.dispose).toBe('function')
  })

  it('id starts with "multiband-compressor-"', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(mb.id).toMatch(/^multiband-compressor-/)
  })

  it('type is "multiband-compressor"', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(mb.type).toBe('multiband-compressor')
  })

  it('creates 3 compressor nodes (one per band)', () => {
    const ctx = h.mockContext()
    createMultibandCompressor(ctx)
    expect(ctx.createdCompressors.length).toBe(3)
  })

  it('creates 4 filter nodes (low, midHp, midLp, high)', () => {
    const ctx = h.mockContext()
    createMultibandCompressor(ctx)
    expect(ctx.createdFilters.length).toBe(4)
  })

  it('creates gain nodes including sum, wet, dry, band makeups, input, output', () => {
    const ctx = h.mockContext()
    createMultibandCompressor(ctx)
    // inputGain, outputGain, dryGain, wetGain, sumGain, gainLow, gainMid, gainHigh = 8
    expect(ctx.createdGains.length).toBe(8)
  })

  it('setLowThreshold does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setLowThreshold(-20) }).not.toThrow()
  })

  it('setLowThreshold accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setLowThreshold(-20, 1.0) }).not.toThrow()
  })

  it('setLowRatio does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setLowRatio(4) }).not.toThrow()
  })

  it('setLowMakeupGain does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setLowMakeupGain(3) }).not.toThrow()
  })

  it('setMidThreshold does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setMidThreshold(-18) }).not.toThrow()
  })

  it('setMidRatio does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setMidRatio(3) }).not.toThrow()
  })

  it('setMidMakeupGain does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setMidMakeupGain(2) }).not.toThrow()
  })

  it('setHighThreshold does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setHighThreshold(-12) }).not.toThrow()
  })

  it('setHighRatio does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setHighRatio(2) }).not.toThrow()
  })

  it('setHighMakeupGain does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setHighMakeupGain(1.5) }).not.toThrow()
  })

  it('setMix does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setMix(0.8) }).not.toThrow()
  })

  it('setMix accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.setMix(0.5, 1.0) }).not.toThrow()
  })

  it('all setters can be called in sequence without throwing', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => {
      mb.setLowThreshold(-24)
      mb.setLowRatio(4)
      mb.setLowMakeupGain(2)
      mb.setMidThreshold(-18)
      mb.setMidRatio(3)
      mb.setMidMakeupGain(1)
      mb.setHighThreshold(-12)
      mb.setHighRatio(2)
      mb.setHighMakeupGain(1)
      mb.setMix(1.0)
    }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(mb.connect(ctx.destination)).toBe(mb)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    mb.connect(ctx.destination)
    expect(mb.disconnect()).toBe(mb)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    mb.connect(ctx.destination)
    expect(() => { mb.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.dispose() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const mb = createMultibandCompressor(ctx)
    expect(() => { mb.disconnect() }).not.toThrow()
  })

  it('default props produce a valid component', () => {
    const ctx = h.mockContext()
    const mb = createMultibandCompressor(ctx)
    expect(mb.id).toBeDefined()
    expect(mb.type).toBeDefined()
    expect(typeof mb.connect).toBe('function')
  })

  it('accepts full custom props without throwing', () => {
    const ctx = h.mockContext()
    expect(() => {
      createMultibandCompressor(ctx, {
        low:  { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, makeupGain: 2, crossover: 200 },
        mid:  { threshold: -18, ratio: 3, attack: 0.003, release: 0.25, makeupGain: 1 },
        high: { threshold: -12, ratio: 2, attack: 0.003, release: 0.25, makeupGain: 1, crossover: 5000 },
        mix: 1.0,
      })
    }).not.toThrow()
  })
})
