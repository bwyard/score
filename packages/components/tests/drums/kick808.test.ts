import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createKick808 } from '../../src/drums/kick808.js'

const h = useHarness()

describe('createKick808', () => {
  it('has trigger, connect, disconnect, dispose', () => {
    const kick = createKick808(h.mockContext())
    expect(typeof kick.trigger).toBe('function')
    expect(typeof kick.connect).toBe('function')
    expect(typeof kick.disconnect).toBe('function')
    expect(typeof kick.dispose).toBe('function')
  })

  it('id is prefixed kick808', () => {
    const kick = createKick808(h.mockContext())
    expect(kick.id).toMatch(/^kick808/)
  })

  it('type is kick808', () => {
    const kick = createKick808(h.mockContext())
    expect(kick.type).toBe('kick808')
  })

  it('creates one output gain node at construction', () => {
    const ctx = h.mockContext()
    createKick808(ctx)
    expect(ctx.createdGains.length).toBe(1)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.9)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createKick808(ctx, { gain: 0.5 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.5)
  })

  it('trigger creates one oscillator and one amp-env gain per call', () => {
    const ctx = h.mockContext()
    const kick = createKick808(ctx)
    kick.trigger(0)
    // 1 output gain (constructor) + 1 amp-env gain (trigger)
    expect(ctx.createdGains.length).toBe(2)
    expect(ctx.createdOscillators.length).toBe(1)
  })

  it('two triggers create two oscillators', () => {
    const ctx = h.mockContext()
    const kick = createKick808(ctx)
    kick.trigger(0)
    kick.trigger(0.5)
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('oscillator from trigger is started', () => {
    const ctx = h.mockContext()
    const kick = createKick808(ctx)
    kick.trigger(1.0)
    expect(ctx.createdOscillators[0]?.startCalls.length).toBe(1)
    expect(ctx.createdOscillators[0]?.startCalls[0]?.time).toBe(1.0)
  })

  it('oscillator from trigger is scheduled to stop', () => {
    const ctx = h.mockContext()
    const kick = createKick808(ctx, { decay: 0.7 })
    kick.trigger(0)
    expect(ctx.createdOscillators[0]?.stopCalls.length).toBe(1)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = createKick808(ctx)
    expect(kick.connect(ctx.destination)).toBe(kick)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = createKick808(ctx)
    expect(kick.disconnect()).toBe(kick)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const kick = createKick808(ctx)
    kick.trigger(0)
    expect(() => { kick.dispose() }).not.toThrow()
  })
})
