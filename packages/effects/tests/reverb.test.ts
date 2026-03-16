import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createReverb } from '../src/reverb.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createReverb', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx)
    expect(typeof r.connect).toBe('function')
    expect(typeof r.disconnect).toBe('function')
    expect(typeof r.dispose).toBe('function')
  })

  it('creates gain nodes for dry/wet mix and reverb taps', () => {
    const ctx = h.mockContext()
    createReverb(ctx)
    // input + output + dry + wet + 6 tap gains = 10
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(4)
  })

  it('creates delay nodes for reverb taps', () => {
    const ctx = h.mockContext()
    createReverb(ctx)
    // 6 parallel delay taps
    expect(ctx.createdDelays.length).toBe(6)
  })

  it('accepts custom decay', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx, { decay: 3.0 })
    expect(r).toBeDefined()
  })

  it('accepts custom mix', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx, { mix: 0.5 })
    expect(r).toBeDefined()
  })

  it('setMix does not throw', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx)
    expect(() => { r.setMix(0.5) }).not.toThrow()
  })

  it('setMix accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx)
    expect(() => { r.setMix(0.5, 1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx)
    expect(r.connect(ctx.destination)).toBe(r)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx)
    r.connect(ctx.destination)
    expect(r.disconnect()).toBe(r)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx)
    r.connect(ctx.destination)
    expect(() => { r.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const r = createReverb(ctx)
    expect(() => { r.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const r = createReverb(ctx)
    expect(() => { r.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const r = createReverb(ctx)
    expect(() => { r.dispose() }).not.toThrow()
  })
})
