import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createFlanger } from '../src/flanger.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createFlanger', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(typeof f.connect).toBe('function')
    expect(typeof f.disconnect).toBe('function')
    expect(typeof f.dispose).toBe('function')
  })

  it('creates backend delay and gain nodes', () => {
    const ctx = h.mockContext()
    createFlanger(ctx)
    expect(ctx.createdDelays.length).toBe(1)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(3)
  })

  it('accepts custom depth', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx, { depth: 0.005 })
    expect(f).toBeDefined()
  })

  it('accepts custom feedback', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx, { feedback: 0.7 })
    expect(f).toBeDefined()
  })

  it('accepts custom mix', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx, { mix: 0.6 })
    expect(f).toBeDefined()
  })

  it('setDepth does not throw', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(() => { f.setDepth(0.003) }).not.toThrow()
  })

  it('setDepth accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(() => { f.setDepth(0.003, 1.0) }).not.toThrow()
  })

  it('setFeedback does not throw', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(() => { f.setFeedback(0.6) }).not.toThrow()
  })

  it('setFeedback accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(() => { f.setFeedback(0.6, 1.0) }).not.toThrow()
  })

  it('setMix does not throw', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(() => { f.setMix(0.4) }).not.toThrow()
  })

  it('setMix accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(() => { f.setMix(0.4, 1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(f.connect(ctx.destination)).toBe(f)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    f.connect(ctx.destination)
    expect(f.disconnect()).toBe(f)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    f.connect(ctx.destination)
    expect(() => { f.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const f = createFlanger(ctx)
    expect(() => { f.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const f = createFlanger(ctx)
    expect(() => { f.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const f = createFlanger(ctx)
    expect(() => { f.dispose() }).not.toThrow()
  })
})
