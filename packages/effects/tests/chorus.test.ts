import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createChorus } from '../src/chorus.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createChorus', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    expect(typeof c.connect).toBe('function')
    expect(typeof c.disconnect).toBe('function')
    expect(typeof c.dispose).toBe('function')
  })

  it('creates backend delay and gain nodes for voices', () => {
    const ctx = h.mockContext()
    createChorus(ctx, { voices: 3 })
    expect(ctx.createdDelays.length).toBe(3)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(3)
  })

  it('accepts custom voices count', () => {
    const ctx = h.mockContext()
    createChorus(ctx, { voices: 4 })
    expect(ctx.createdDelays.length).toBe(4)
  })

  it('clamps voices to 2-4 range', () => {
    const ctx = h.mockContext()
    createChorus(ctx, { voices: 1 })
    expect(ctx.createdDelays.length).toBe(2)
  })

  it('accepts custom depth', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx, { depth: 0.005 })
    expect(c).toBeDefined()
  })

  it('accepts custom mix', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx, { mix: 0.7 })
    expect(c).toBeDefined()
  })

  it('setDepth does not throw', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    expect(() => { c.setDepth(0.005) }).not.toThrow()
  })

  it('setDepth accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    expect(() => { c.setDepth(0.003, 1.0) }).not.toThrow()
  })

  it('setMix does not throw', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    expect(() => { c.setMix(0.4) }).not.toThrow()
  })

  it('setMix accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    expect(() => { c.setMix(0.4, 1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    expect(c.connect(ctx.destination)).toBe(c)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    c.connect(ctx.destination)
    expect(c.disconnect()).toBe(c)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    c.connect(ctx.destination)
    expect(() => { c.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const c = createChorus(ctx)
    expect(() => { c.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const c = createChorus(ctx)
    expect(() => { c.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const c = createChorus(ctx)
    expect(() => { c.dispose() }).not.toThrow()
  })
})
