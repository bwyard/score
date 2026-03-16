import { describe, it, expect } from 'vitest'
import { useHarness } from './utils/harness.js'
import { HiHat } from '../src/hihat.js'

const h = useHarness()

describe('HiHat', () => {
  it('has start, stop, setPlaybackRate, setGain, connect, disconnect, dispose', () => {
    const hat = HiHat(h.mockContext(), h.mockBuffer())
    expect(typeof hat.start).toBe('function')
    expect(typeof hat.stop).toBe('function')
    expect(typeof hat.setPlaybackRate).toBe('function')
    expect(typeof hat.setGain).toBe('function')
    expect(typeof hat.connect).toBe('function')
    expect(typeof hat.disconnect).toBe('function')
    expect(typeof hat.dispose).toBe('function')
  })

  it('uses default gain of 0.6', () => {
    const ctx = h.mockContext()
    HiHat(ctx, h.mockBuffer())
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.6)
  })

  it('allows custom gain override', () => {
    const ctx = h.mockContext()
    HiHat(ctx, h.mockBuffer(), { gain: 0.3 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.3)
  })

  it('closed hi-hat by default (open: false)', () => {
    const ctx = h.mockContext()
    const hat = HiHat(ctx, h.mockBuffer())
    hat.start()
    expect(ctx.createdBufferSources.length).toBe(1)
  })

  it('open hi-hat uses higher gain sustain', () => {
    const ctx = h.mockContext()
    HiHat(ctx, h.mockBuffer(), { open: true })
    // Open hi-hat should use gain of 0.8 (higher sustain)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.8)
  })

  it('open hi-hat with custom gain uses custom gain', () => {
    const ctx = h.mockContext()
    HiHat(ctx, h.mockBuffer(), { open: true, gain: 0.5 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.5)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const hat = HiHat(ctx, h.mockBuffer())
    expect(hat.connect(ctx.destination)).toBe(hat)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const hat = HiHat(ctx, h.mockBuffer())
    hat.start()
    expect(() => { hat.dispose() }).not.toThrow()
  })

  it('exposes buffer reference', () => {
    const buf = h.mockBuffer()
    const hat = HiHat(h.mockContext(), buf)
    expect(hat.buffer).toBe(buf)
  })
})
