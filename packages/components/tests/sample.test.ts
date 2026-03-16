import { describe, it, expect } from 'vitest'
import { useHarness } from './utils/harness.js'
import { Sample } from '../src/sample.js'

const h = useHarness()

describe('Sample', () => {
  it('has start, stop, setPlaybackRate, setGain, connect, disconnect, dispose', () => {
    const player = Sample(h.mockContext(), h.mockBuffer())
    expect(typeof player.start).toBe('function')
    expect(typeof player.stop).toBe('function')
    expect(typeof player.setPlaybackRate).toBe('function')
    expect(typeof player.setGain).toBe('function')
    expect(typeof player.connect).toBe('function')
    expect(typeof player.disconnect).toBe('function')
    expect(typeof player.dispose).toBe('function')
  })

  it('creates a gain node from context', () => {
    const ctx = h.mockContext()
    Sample(ctx, h.mockBuffer())
    expect(ctx.createdGains.length).toBe(1)
  })

  it('uses default props: loop false, playbackRate 1.0, gain 1.0', () => {
    const ctx = h.mockContext()
    Sample(ctx, h.mockBuffer())
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(1.0)
  })

  it('accepts custom gain', () => {
    const ctx = h.mockContext()
    Sample(ctx, h.mockBuffer(), { gain: 0.5 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.5)
  })

  it('start creates a buffer source via context', () => {
    const ctx = h.mockContext()
    const player = Sample(ctx, h.mockBuffer())
    player.start()
    expect(ctx.createdBufferSources.length).toBe(1)
  })

  it('each start creates a new source (one-shot pattern)', () => {
    const ctx = h.mockContext()
    const player = Sample(ctx, h.mockBuffer())
    player.start()
    player.start()
    expect(ctx.createdBufferSources.length).toBe(2)
  })

  it('start passes time, offset, duration to source', () => {
    const ctx = h.mockContext()
    const player = Sample(ctx, h.mockBuffer())
    player.start(1.0, 0.5, 2.0)
    expect(ctx.createdBufferSources[0]?.startCalls).toEqual([{ time: 1.0, offset: 0.5, duration: 2.0 }])
  })

  it('stop does not throw when nothing is playing', () => {
    expect(() => { Sample(h.mockContext(), h.mockBuffer()).stop() }).not.toThrow()
  })

  it('stop after start does not throw', () => {
    const player = Sample(h.mockContext(), h.mockBuffer())
    player.start()
    expect(() => { player.stop() }).not.toThrow()
  })

  it('setGain delegates to gain node', () => {
    const ctx = h.mockContext()
    const player = Sample(ctx, h.mockBuffer())
    player.setGain(0.3)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.3)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const player = Sample(ctx, h.mockBuffer())
    expect(player.connect(ctx.destination)).toBe(player)
  })

  it('disconnect does not throw', () => {
    const ctx = h.mockContext()
    const player = Sample(ctx, h.mockBuffer())
    player.connect(ctx.destination)
    expect(() => { player.disconnect() }).not.toThrow()
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const player = Sample(ctx, h.mockBuffer())
    player.start()
    player.connect(ctx.destination)
    expect(() => { player.dispose() }).not.toThrow()
  })

  it('dispose when never started does not throw', () => {
    expect(() => { Sample(h.mockContext(), h.mockBuffer()).dispose() }).not.toThrow()
  })

  it('exposes buffer reference', () => {
    const buf = h.mockBuffer({ duration: 3.0 })
    const player = Sample(h.mockContext(), buf)
    expect(player.buffer).toBe(buf)
  })
})
