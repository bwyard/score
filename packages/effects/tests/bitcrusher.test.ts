import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createBitCrusher } from '../src/bitcrusher.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createBitCrusher', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    expect(typeof b.connect).toBe('function')
    expect(typeof b.disconnect).toBe('function')
    expect(typeof b.dispose).toBe('function')
  })

  it('creates backend gain nodes for bit reduction', () => {
    const ctx = h.mockContext()
    createBitCrusher(ctx)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(4)
  })

  it('accepts custom bits', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx, { bits: 4 })
    expect(b).toBeDefined()
  })

  it('accepts custom mix', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx, { mix: 0.5 })
    expect(b).toBeDefined()
  })

  it('setBits does not throw', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    expect(() => { b.setBits(4) }).not.toThrow()
  })

  it('setBits clamps to valid range', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    expect(() => { b.setBits(0) }).not.toThrow()
    expect(() => { b.setBits(20) }).not.toThrow()
  })

  it('setMix does not throw', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    expect(() => { b.setMix(0.4) }).not.toThrow()
  })

  it('setMix accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    expect(() => { b.setMix(0.4, 1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    expect(b.connect(ctx.destination)).toBe(b)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    b.connect(ctx.destination)
    expect(b.disconnect()).toBe(b)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    b.connect(ctx.destination)
    expect(() => { b.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const b = createBitCrusher(ctx)
    expect(() => { b.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const b = createBitCrusher(ctx)
    expect(() => { b.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const b = createBitCrusher(ctx)
    expect(() => { b.dispose() }).not.toThrow()
  })
})
