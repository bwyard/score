import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createLimiter } from '../src/limiter.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createLimiter', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx)
    expect(typeof d.connect).toBe('function')
    expect(typeof d.disconnect).toBe('function')
    expect(typeof d.dispose).toBe('function')
  })

  it('creates backend waveshaper, delay, and gain nodes', () => {
    const ctx = h.mockContext()
    createLimiter(ctx)
    expect(ctx.createdWaveShapers.length).toBe(1)
    expect(ctx.createdDelays.length).toBe(1)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(1)
  })

  it('accepts custom ceiling', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx, { ceiling: -1.0 })
    expect(d).toBeDefined()
  })

  it('accepts custom lookahead', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx, { lookahead: 0.01 })
    expect(d).toBeDefined()
  })

  it('accepts custom release', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx, { release: 0.1 })
    expect(d).toBeDefined()
  })

  it('setCeiling does not throw', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx)
    expect(() => { d.setCeiling(-0.5) }).not.toThrow()
  })

  it('setLookahead does not throw', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx)
    expect(() => { d.setLookahead(0.01) }).not.toThrow()
  })

  it('setLookahead accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx)
    expect(() => { d.setLookahead(0.01, 1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx)
    expect(d.connect(ctx.destination)).toBe(d)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx)
    d.connect(ctx.destination)
    expect(d.disconnect()).toBe(d)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx)
    d.connect(ctx.destination)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const d = createLimiter(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const d = createLimiter(ctx)
    expect(() => { d.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const d = createLimiter(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })
})
