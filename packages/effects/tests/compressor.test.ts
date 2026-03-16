import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createCompressor } from '../src/compressor.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createCompressor', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx)
    expect(typeof c.connect).toBe('function')
    expect(typeof c.disconnect).toBe('function')
    expect(typeof c.dispose).toBe('function')
  })

  it('delegates to backend createCompressor', () => {
    const ctx = h.mockContext()
    createCompressor(ctx)
    expect(ctx.createdCompressors.length).toBe(1)
  })

  it('accepts custom threshold', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx, { threshold: -30 })
    expect(c).toBeDefined()
  })

  it('accepts custom ratio', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx, { ratio: 4 })
    expect(c).toBeDefined()
  })

  it('accepts custom knee', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx, { knee: 10 })
    expect(c).toBeDefined()
  })

  it('accepts custom attack', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx, { attack: 0.01 })
    expect(c).toBeDefined()
  })

  it('accepts custom release', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx, { release: 0.5 })
    expect(c).toBeDefined()
  })

  it('setThreshold does not throw', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx)
    expect(() => { c.setThreshold(-20) }).not.toThrow()
  })

  it('setThreshold accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx)
    expect(() => { c.setThreshold(-20, 1.0) }).not.toThrow()
  })

  it('setRatio does not throw', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx)
    expect(() => { c.setRatio(8) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx)
    expect(c.connect(ctx.destination)).toBe(c)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx)
    c.connect(ctx.destination)
    expect(c.disconnect()).toBe(c)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx)
    c.connect(ctx.destination)
    expect(() => { c.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const c = createCompressor(ctx)
    expect(() => { c.dispose() }).not.toThrow()
  })
})
