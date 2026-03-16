import { describe, it, expect } from 'vitest'
import { useHarness } from './utils/harness.js'
import { Kick } from '../src/kick.js'

const h = useHarness()

describe('Kick', () => {
  it('has start, stop, setPlaybackRate, setGain, connect, disconnect, dispose', () => {
    const kick = Kick(h.mockContext(), h.mockBuffer())
    expect(typeof kick.start).toBe('function')
    expect(typeof kick.stop).toBe('function')
    expect(typeof kick.setPlaybackRate).toBe('function')
    expect(typeof kick.setGain).toBe('function')
    expect(typeof kick.connect).toBe('function')
    expect(typeof kick.disconnect).toBe('function')
    expect(typeof kick.dispose).toBe('function')
  })

  it('uses default gain of 0.9', () => {
    const ctx = h.mockContext()
    Kick(ctx, h.mockBuffer())
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.9)
  })

  it('allows custom gain override', () => {
    const ctx = h.mockContext()
    Kick(ctx, h.mockBuffer(), { gain: 0.5 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.5)
  })

  it('is always one-shot (loop: false)', () => {
    const ctx = h.mockContext()
    const kick = Kick(ctx, h.mockBuffer())
    kick.start()
    // Buffer source created — no loop
    expect(ctx.createdBufferSources.length).toBe(1)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const kick = Kick(ctx, h.mockBuffer())
    expect(kick.connect(ctx.destination)).toBe(kick)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const kick = Kick(ctx, h.mockBuffer())
    kick.start()
    expect(() => { kick.dispose() }).not.toThrow()
  })

  it('exposes buffer reference', () => {
    const buf = h.mockBuffer()
    const kick = Kick(h.mockContext(), buf)
    expect(kick.buffer).toBe(buf)
  })
})
