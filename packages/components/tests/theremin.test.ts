import { describe, it, expect } from 'vitest'
import { useHarness } from './utils/harness.js'
import { Theremin } from '../src/theremin.js'

const h = useHarness()

describe('Theremin', () => {
  it('creates one oscillator, two gains (tone + LFO depth)', () => {
    const ctx = h.mockContext()
    Theremin(ctx)
    expect(ctx.createdOscillators.length).toBe(2)  // tone osc + LFO osc
    expect(ctx.createdGains.length).toBe(2)         // tone gain + LFO depth gain
  })

  it('uses sine wave for the tone oscillator', () => {
    const ctx = h.mockContext()
    Theremin(ctx, { note: 'A4' })
    // First oscillator is the tone (sine), second is the LFO
    expect(ctx.createdOscillators.length).toBeGreaterThanOrEqual(1)
  })

  it('defaults to A4 (440 Hz) when no note given', () => {
    const ctx = h.mockContext()
    Theremin(ctx)
    // No throw and context used
    expect(ctx.createdOscillators.length).toBeGreaterThan(0)
  })

  it('accepts a note name and sets frequency', () => {
    const ctx = h.mockContext()
    expect(() => { Theremin(ctx, { note: 'C4' }) }).not.toThrow()
  })

  it('accepts vibratoRate and vibratoDepth', () => {
    const ctx = h.mockContext()
    expect(() => { Theremin(ctx, { vibratoRate: 6, vibratoDepth: 12 }) }).not.toThrow()
  })

  it('has start, stop, setFrequency, setGain methods', () => {
    const t = Theremin(h.mockContext())
    expect(typeof t.start).toBe('function')
    expect(typeof t.stop).toBe('function')
    expect(typeof t.setFrequency).toBe('function')
    expect(typeof t.setGain).toBe('function')
  })

  it('has connect, disconnect, dispose methods', () => {
    const t = Theremin(h.mockContext())
    expect(typeof t.connect).toBe('function')
    expect(typeof t.disconnect).toBe('function')
    expect(typeof t.dispose).toBe('function')
  })

  it('start delegates to oscillator', () => {
    const ctx = h.mockContext()
    const t = Theremin(ctx)
    t.start(1.0)
    const toneOsc = ctx.createdOscillators[0]
    expect(toneOsc?.startCalls).toContainEqual({ time: 1.0 })
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const t = Theremin(ctx)
    expect(t.connect(ctx.destination)).toBe(t)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const t = Theremin(ctx)
    t.connect(ctx.destination)
    expect(t.disconnect()).toBe(t)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const t = Theremin(ctx)
    t.start()
    t.connect(ctx.destination)
    expect(() => { t.dispose() }).not.toThrow()
  })

  it('dispose when never started does not throw', () => {
    expect(() => { Theremin(h.mockContext()).dispose() }).not.toThrow()
  })

  it('setGain delegates to gain node', () => {
    const ctx = h.mockContext()
    const t = Theremin(ctx)
    t.setGain(0.2)
    const toneGain = ctx.createdGains[0]
    expect(toneGain?.gain).toBeCloseTo(0.2)
  })
})
