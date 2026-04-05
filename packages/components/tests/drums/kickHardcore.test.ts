import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createKickHardcore } from '../../src/drums/kickHardcore.js'

const h = useHarness()

describe('createKickHardcore', () => {
  it('has trigger, connect, disconnect, dispose', () => {
    const kick = createKickHardcore(h.mockContext())
    expect(typeof kick.trigger).toBe('function')
    expect(typeof kick.connect).toBe('function')
    expect(typeof kick.disconnect).toBe('function')
    expect(typeof kick.dispose).toBe('function')
  })

  it('id is prefixed kickHardcore', () => {
    const kick = createKickHardcore(h.mockContext())
    expect(kick.id).toMatch(/^kickHardcore/)
  })

  it('type is kickHardcore', () => {
    const kick = createKickHardcore(h.mockContext())
    expect(kick.type).toBe('kickHardcore')
  })

  it('creates output gain at construction', () => {
    const ctx = h.mockContext()
    createKickHardcore(ctx)
    expect(ctx.createdGains.length).toBe(1)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.9)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createKickHardcore(ctx, { gain: 0.6 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.6)
  })

  it('trigger creates body oscillator', () => {
    const ctx = h.mockContext()
    const kick = createKickHardcore(ctx)
    kick.trigger(0)
    expect(ctx.createdOscillators.length).toBe(1)
  })

  it('two triggers create two oscillators', () => {
    const ctx = h.mockContext()
    const kick = createKickHardcore(ctx)
    kick.trigger(0)
    kick.trigger(0.375) // 160 BPM quarter note
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('oscillator starts at the scheduled time', () => {
    const ctx = h.mockContext()
    const kick = createKickHardcore(ctx)
    kick.trigger(2.0)
    expect(ctx.createdOscillators[0]?.startCalls[0]?.time).toBe(2.0)
  })

  it('oscillator is scheduled to stop', () => {
    const ctx = h.mockContext()
    const kick = createKickHardcore(ctx)
    kick.trigger(0)
    expect(ctx.createdOscillators[0]?.stopCalls.length).toBe(1)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = createKickHardcore(ctx)
    expect(kick.connect(ctx.destination)).toBe(kick)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = createKickHardcore(ctx)
    expect(kick.disconnect()).toBe(kick)
  })

  it('dispose does not throw after trigger', () => {
    const ctx = h.mockContext()
    const kick = createKickHardcore(ctx)
    kick.trigger(0)
    expect(() => { kick.dispose() }).not.toThrow()
  })

  it('dispose does not throw without trigger', () => {
    const ctx = h.mockContext()
    const kick = createKickHardcore(ctx)
    expect(() => { kick.dispose() }).not.toThrow()
  })
})
