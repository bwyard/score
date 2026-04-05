import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createKickHardstyle } from '../../src/drums/kickHardstyle.js'

const h = useHarness()

describe('createKickHardstyle', () => {
  it('has trigger, connect, disconnect, dispose', () => {
    const kick = createKickHardstyle(h.mockContext())
    expect(typeof kick.trigger).toBe('function')
    expect(typeof kick.connect).toBe('function')
    expect(typeof kick.disconnect).toBe('function')
    expect(typeof kick.dispose).toBe('function')
  })

  it('id is prefixed kickHardstyle', () => {
    const kick = createKickHardstyle(h.mockContext())
    expect(kick.id).toMatch(/^kickHardstyle/)
  })

  it('type is kickHardstyle', () => {
    const kick = createKickHardstyle(h.mockContext())
    expect(kick.type).toBe('kickHardstyle')
  })

  it('creates output gain and waveshaper at construction', () => {
    const ctx = h.mockContext()
    createKickHardstyle(ctx)
    // outputGain is the only gain created at factory time
    expect(ctx.createdGains.length).toBe(1)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.95)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createKickHardstyle(ctx, { gain: 0.7 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.7)
  })

  it('trigger creates one oscillator per hit', () => {
    const ctx = h.mockContext()
    const kick = createKickHardstyle(ctx)
    kick.trigger(0)
    expect(ctx.createdOscillators.length).toBe(1)
  })

  it('two triggers create two oscillators', () => {
    const ctx = h.mockContext()
    const kick = createKickHardstyle(ctx)
    kick.trigger(0)
    kick.trigger(0.5)
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('oscillator from trigger is started at the scheduled time', () => {
    const ctx = h.mockContext()
    const kick = createKickHardstyle(ctx)
    kick.trigger(1.0)
    expect(ctx.createdOscillators[0]?.startCalls[0]?.time).toBe(1.0)
  })

  it('oscillator from trigger is scheduled to stop', () => {
    const ctx = h.mockContext()
    const kick = createKickHardstyle(ctx)
    kick.trigger(0)
    expect(ctx.createdOscillators[0]?.stopCalls.length).toBe(1)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = createKickHardstyle(ctx)
    expect(kick.connect(ctx.destination)).toBe(kick)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = createKickHardstyle(ctx)
    expect(kick.disconnect()).toBe(kick)
  })

  it('dispose does not throw after trigger', () => {
    const ctx = h.mockContext()
    const kick = createKickHardstyle(ctx)
    kick.trigger(0)
    expect(() => { kick.dispose() }).not.toThrow()
  })

  it('dispose does not throw without trigger', () => {
    const ctx = h.mockContext()
    const kick = createKickHardstyle(ctx)
    expect(() => { kick.dispose() }).not.toThrow()
  })
})
