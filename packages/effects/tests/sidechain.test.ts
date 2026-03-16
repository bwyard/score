import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createSidechain } from '../src/sidechain.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createSidechain', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source })
    expect(typeof sc.connect).toBe('function')
    expect(typeof sc.disconnect).toBe('function')
    expect(typeof sc.dispose).toBe('function')
  })

  it('creates a compressor internally', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    createSidechain(ctx, { source })
    expect(ctx.createdCompressors.length).toBe(1)
  })

  it('accepts custom threshold', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source, threshold: -20 })
    expect(sc).toBeDefined()
  })

  it('accepts custom ratio', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source, ratio: 8 })
    expect(sc).toBeDefined()
  })

  it('accepts custom attack', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source, attack: 0.01 })
    expect(sc).toBeDefined()
  })

  it('accepts custom release', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source, release: 0.2 })
    expect(sc).toBeDefined()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source })
    expect(sc.connect(ctx.destination)).toBe(sc)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source })
    sc.connect(ctx.destination)
    expect(sc.disconnect()).toBe(sc)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source })
    sc.connect(ctx.destination)
    expect(() => { sc.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const source = h.mockNode()
    const sc = createSidechain(ctx, { source })
    expect(() => { sc.dispose() }).not.toThrow()
  })
})
