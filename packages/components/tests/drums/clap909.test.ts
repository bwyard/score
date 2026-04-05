import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createClap909 } from '../../src/drums/clap909.js'

const h = useHarness()

describe('createClap909', () => {
  it('has trigger, connect, disconnect, dispose', () => {
    const clap = createClap909(h.mockContext())
    expect(typeof clap.trigger).toBe('function')
    expect(typeof clap.connect).toBe('function')
    expect(typeof clap.disconnect).toBe('function')
    expect(typeof clap.dispose).toBe('function')
  })

  it('id is prefixed clap909', () => {
    const clap = createClap909(h.mockContext())
    expect(clap.id).toMatch(/^clap909/)
  })

  it('type is clap909', () => {
    const clap = createClap909(h.mockContext())
    expect(clap.type).toBe('clap909')
  })

  it('creates one output gain node at construction', () => {
    const ctx = h.mockContext()
    createClap909(ctx)
    // Only outputGain is created at factory time — trigger creates per-hit nodes
    expect(ctx.createdGains.length).toBe(1)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.8)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createClap909(ctx, { gain: 0.5 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.5)
  })

  it('trigger does not throw', () => {
    const ctx = h.mockContext()
    const clap = createClap909(ctx)
    expect(() => { clap.trigger(0) }).not.toThrow()
  })

  it('trigger twice does not throw', () => {
    const ctx = h.mockContext()
    const clap = createClap909(ctx)
    expect(() => {
      clap.trigger(0)
      clap.trigger(0.5)
    }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const clap = createClap909(ctx)
    expect(clap.connect(ctx.destination)).toBe(clap)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const clap = createClap909(ctx)
    expect(clap.disconnect()).toBe(clap)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const clap = createClap909(ctx)
    clap.trigger(0)
    expect(() => { clap.dispose() }).not.toThrow()
  })
})
