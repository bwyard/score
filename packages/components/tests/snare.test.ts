import { describe, it, expect } from 'vitest'
import { useHarness } from './utils/harness.js'
import { Snare } from '../src/snare.js'

const h = useHarness()

describe('Snare', () => {
  it('has start, stop, setPlaybackRate, setGain, connect, disconnect, dispose', () => {
    const snare = Snare(h.mockContext(), h.mockBuffer())
    expect(typeof snare.start).toBe('function')
    expect(typeof snare.stop).toBe('function')
    expect(typeof snare.setPlaybackRate).toBe('function')
    expect(typeof snare.setGain).toBe('function')
    expect(typeof snare.connect).toBe('function')
    expect(typeof snare.disconnect).toBe('function')
    expect(typeof snare.dispose).toBe('function')
  })

  it('uses default gain of 0.8', () => {
    const ctx = h.mockContext()
    Snare(ctx, h.mockBuffer())
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.8)
  })

  it('allows custom gain override', () => {
    const ctx = h.mockContext()
    Snare(ctx, h.mockBuffer(), { gain: 0.4 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.4)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const snare = Snare(ctx, h.mockBuffer())
    expect(snare.connect(ctx.destination)).toBe(snare)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const snare = Snare(ctx, h.mockBuffer())
    snare.start()
    expect(() => { snare.dispose() }).not.toThrow()
  })

  it('exposes buffer reference', () => {
    const buf = h.mockBuffer()
    const snare = Snare(h.mockContext(), buf)
    expect(snare.buffer).toBe(buf)
  })
})
