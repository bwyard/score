import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createFilter } from '../src/filter.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createFilter', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    expect(typeof f.connect).toBe('function')
    expect(typeof f.disconnect).toBe('function')
    expect(typeof f.dispose).toBe('function')
  })

  it('delegates to backend createFilter', () => {
    const ctx = h.mockContext()
    createFilter(ctx)
    expect(ctx.createdFilters.length).toBe(1)
  })

  it('accepts custom filter type', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx, { type: 'highpass' })
    expect(f).toBeDefined()
  })

  it('accepts custom frequency', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx, { frequency: 2000 })
    expect(f).toBeDefined()
  })

  it('accepts custom Q', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx, { Q: 5 })
    expect(f).toBeDefined()
  })

  it('accepts custom gain', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx, { gain: 6 })
    expect(f).toBeDefined()
  })

  it('setFrequency does not throw', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    expect(() => { f.setFrequency(500) }).not.toThrow()
  })

  it('setFrequency accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    expect(() => { f.setFrequency(500, 1.0) }).not.toThrow()
  })

  it('setQ does not throw', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    expect(() => { f.setQ(2) }).not.toThrow()
  })

  it('setGain does not throw', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    expect(() => { f.setGain(3) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    expect(f.connect(ctx.destination)).toBe(f)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    f.connect(ctx.destination)
    expect(f.disconnect()).toBe(f)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    f.connect(ctx.destination)
    expect(() => { f.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const f = createFilter(ctx)
    expect(() => { f.dispose() }).not.toThrow()
  })

  it('supports all filter types', () => {
    const types = ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'peaking', 'lowshelf', 'highshelf'] as const
    for (const type of types) {
      const ctx = h.mockContext()
      expect(() => { createFilter(ctx, { type }) }).not.toThrow()
    }
  })
})
