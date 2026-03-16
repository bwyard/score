import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createPhaser } from '../src/phaser.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createPhaser', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx)
    expect(typeof p.connect).toBe('function')
    expect(typeof p.disconnect).toBe('function')
    expect(typeof p.dispose).toBe('function')
  })

  it('creates backend filter and gain nodes', () => {
    const ctx = h.mockContext()
    createPhaser(ctx, { stages: 4 })
    expect(ctx.createdFilters.length).toBe(4)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(2)
  })

  it('accepts custom stages', () => {
    const ctx = h.mockContext()
    createPhaser(ctx, { stages: 6 })
    expect(ctx.createdFilters.length).toBe(6)
  })

  it('clamps stages to 2-12 range', () => {
    const ctx = h.mockContext()
    createPhaser(ctx, { stages: 1 })
    expect(ctx.createdFilters.length).toBe(2)
  })

  it('accepts custom feedback', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx, { feedback: 0.5 })
    expect(p).toBeDefined()
  })

  it('setFeedback does not throw', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx)
    expect(() => { p.setFeedback(0.4) }).not.toThrow()
  })

  it('setFeedback accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx)
    expect(() => { p.setFeedback(0.4, 1.0) }).not.toThrow()
  })

  it('setFeedback clamps to prevent instability', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx)
    expect(() => { p.setFeedback(1.5) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx)
    expect(p.connect(ctx.destination)).toBe(p)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx)
    p.connect(ctx.destination)
    expect(p.disconnect()).toBe(p)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx)
    p.connect(ctx.destination)
    expect(() => { p.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const p = createPhaser(ctx)
    expect(() => { p.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const p = createPhaser(ctx)
    expect(() => { p.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const p = createPhaser(ctx)
    expect(() => { p.dispose() }).not.toThrow()
  })
})
