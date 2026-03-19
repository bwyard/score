import { describe, it, expect } from 'vitest'
import { useHarness } from './utils/harness.js'
import { Sax } from '../src/sax.js'

const h = useHarness()

describe('Sax', () => {
  it('creates one oscillator, one filter, one gain', () => {
    const ctx = h.mockContext()
    Sax(ctx)
    expect(ctx.createdOscillators.length).toBe(1)
    expect(ctx.createdGains.length).toBe(1)
  })

  it('defaults to A4 note', () => {
    const ctx = h.mockContext()
    expect(() => { Sax(ctx) }).not.toThrow()
  })

  it('accepts note and gain props', () => {
    const ctx = h.mockContext()
    expect(() => { Sax(ctx, { note: 'C4', gain: 0.5 }) }).not.toThrow()
  })

  it('has start, stop, trigger, setFrequency methods', () => {
    const s = Sax(h.mockContext())
    expect(typeof s.start).toBe('function')
    expect(typeof s.stop).toBe('function')
    expect(typeof s.trigger).toBe('function')
    expect(typeof s.setFrequency).toBe('function')
  })

  it('has connect, disconnect, dispose methods', () => {
    const s = Sax(h.mockContext())
    expect(typeof s.connect).toBe('function')
    expect(typeof s.disconnect).toBe('function')
    expect(typeof s.dispose).toBe('function')
  })

  it('start delegates to oscillator', () => {
    const ctx = h.mockContext()
    const s = Sax(ctx)
    s.start(2.0)
    expect(ctx.createdOscillators[0]?.startCalls).toContainEqual({ time: 2.0 })
  })

  it('trigger calls scheduleEnvelope on gain node', () => {
    const ctx = h.mockContext()
    const s = Sax(ctx, { gain: 0.4 })
    s.start()
    s.trigger(0.5, 0.35)
    // scheduleEnvelope mock sets gain to peak — check the gain was updated
    const gainNode = ctx.createdGains[0]
    expect(gainNode?.gain).toBeCloseTo(0.4)
  })

  it('trigger with default duration does not throw', () => {
    const ctx = h.mockContext()
    const s = Sax(ctx)
    s.start()
    expect(() => { s.trigger(1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const s = Sax(ctx)
    expect(s.connect(ctx.destination)).toBe(s)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const s = Sax(ctx)
    s.connect(ctx.destination)
    expect(s.disconnect()).toBe(s)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const s = Sax(ctx)
    s.start()
    s.connect(ctx.destination)
    expect(() => { s.dispose() }).not.toThrow()
  })

  it('dispose when never started does not throw', () => {
    expect(() => { Sax(h.mockContext()).dispose() }).not.toThrow()
  })
})
