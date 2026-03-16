import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createEQ } from '../src/eq.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createEQ', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    expect(typeof eq.connect).toBe('function')
    expect(typeof eq.disconnect).toBe('function')
    expect(typeof eq.dispose).toBe('function')
  })

  it('creates three filter nodes (lowshelf, peaking, highshelf)', () => {
    const ctx = h.mockContext()
    createEQ(ctx)
    expect(ctx.createdFilters.length).toBe(3)
  })

  it('accepts custom low gain', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx, { low: 3 })
    expect(eq).toBeDefined()
  })

  it('accepts custom mid gain', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx, { mid: -2 })
    expect(eq).toBeDefined()
  })

  it('accepts custom high gain', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx, { high: 5 })
    expect(eq).toBeDefined()
  })

  it('setLow does not throw', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    expect(() => { eq.setLow(3) }).not.toThrow()
  })

  it('setLow accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    expect(() => { eq.setLow(3, 1.0) }).not.toThrow()
  })

  it('setMid does not throw', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    expect(() => { eq.setMid(-1) }).not.toThrow()
  })

  it('setHigh does not throw', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    expect(() => { eq.setHigh(2) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    expect(eq.connect(ctx.destination)).toBe(eq)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    eq.connect(ctx.destination)
    expect(eq.disconnect()).toBe(eq)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    eq.connect(ctx.destination)
    expect(() => { eq.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const eq = createEQ(ctx)
    expect(() => { eq.dispose() }).not.toThrow()
  })
})
