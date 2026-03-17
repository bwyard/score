import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createGroup } from '../src/group.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createGroup', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(typeof g.connect).toBe('function')
    expect(typeof g.disconnect).toBe('function')
    expect(typeof g.dispose).toBe('function')
  })

  it('has input property for channel connections', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(g.input).toBeDefined()
    expect(typeof g.input.connect).toBe('function')
  })

  it('has name property with default', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(g.name).toBe('Group')
  })

  it('accepts custom name', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx, { name: 'Drums' })
    expect(g.name).toBe('Drums')
  })

  it('creates EQ filters and gain nodes', () => {
    const ctx = h.mockContext()
    createGroup(ctx)
    // EQ = 3 filters, inputGain + volumeGain + outputGain = 3 gains
    expect(ctx.createdFilters.length).toBe(3)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(3)
  })

  it('accepts custom volume', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx, { volume: 0.6 })
    expect(g).toBeDefined()
  })

  it('accepts custom eq props', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx, { eq: { low: -3, mid: 2 } })
    expect(g).toBeDefined()
  })

  it('setVolume does not throw', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(() => { g.setVolume(0.5) }).not.toThrow()
  })

  it('setVolume accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(() => { g.setVolume(0.5, 1.0) }).not.toThrow()
  })

  it('setEQ does not throw', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(() => { g.setEQ({ low: -3, mid: 2, high: 1 }) }).not.toThrow()
  })

  it('setEQ with partial props does not throw', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(() => { g.setEQ({ low: -3 }) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(g.connect(ctx.destination)).toBe(g)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    g.connect(ctx.destination)
    expect(g.disconnect()).toBe(g)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    g.connect(ctx.destination)
    expect(() => { g.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const g = createGroup(ctx)
    expect(() => { g.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const g = createGroup(ctx)
    expect(() => { g.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const g = createGroup(ctx)
    expect(() => { g.dispose() }).not.toThrow()
  })
})
