import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createKick909 } from '../../src/drums/kick909.js'

const h = useHarness()

describe('createKick909', () => {
  it('has trigger, connect, disconnect, dispose', () => {
    const kick = createKick909(h.mockContext())
    expect(typeof kick.trigger).toBe('function')
    expect(typeof kick.connect).toBe('function')
    expect(typeof kick.disconnect).toBe('function')
    expect(typeof kick.dispose).toBe('function')
  })

  it('id is prefixed kick909', () => {
    const kick = createKick909(h.mockContext())
    expect(kick.id).toMatch(/^kick909/)
  })

  it('type is kick909', () => {
    const kick = createKick909(h.mockContext())
    expect(kick.type).toBe('kick909')
  })

  it('creates one output gain node at construction', () => {
    const ctx = h.mockContext()
    createKick909(ctx)
    expect(ctx.createdGains.length).toBe(1)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.9)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createKick909(ctx, { gain: 0.6 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.6)
  })

  it('trigger creates one sine oscillator and one noise source per call', () => {
    const ctx = h.mockContext()
    const kick = createKick909(ctx)
    kick.trigger(0)
    expect(ctx.createdOscillators.length).toBe(1)
  })

  it('trigger creates body-env gain + click-env gain (plus output = 3 total)', () => {
    const ctx = h.mockContext()
    const kick = createKick909(ctx)
    kick.trigger(0)
    // 1 output + 1 body-env + 1 click-env = 3
    expect(ctx.createdGains.length).toBe(3)
  })

  it('oscillator is started with trigger time', () => {
    const ctx = h.mockContext()
    const kick = createKick909(ctx)
    kick.trigger(2.0)
    expect(ctx.createdOscillators[0]?.startCalls[0]?.time).toBe(2.0)
  })

  it('oscillator is scheduled to stop', () => {
    const ctx = h.mockContext()
    const kick = createKick909(ctx)
    kick.trigger(0)
    expect(ctx.createdOscillators[0]?.stopCalls.length).toBe(1)
  })

  it('two triggers create two oscillators', () => {
    const ctx = h.mockContext()
    const kick = createKick909(ctx)
    kick.trigger(0)
    kick.trigger(0.5)
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = createKick909(ctx)
    expect(kick.connect(ctx.destination)).toBe(kick)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = createKick909(ctx)
    expect(kick.disconnect()).toBe(kick)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const kick = createKick909(ctx)
    kick.trigger(0)
    expect(() => { kick.dispose() }).not.toThrow()
  })
})
