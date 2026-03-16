import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createDistortion } from '../src/distortion.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createDistortion', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    expect(typeof d.connect).toBe('function')
    expect(typeof d.disconnect).toBe('function')
    expect(typeof d.dispose).toBe('function')
  })

  it('creates backend waveshaper and gain nodes', () => {
    const ctx = h.mockContext()
    createDistortion(ctx)
    expect(ctx.createdWaveShapers.length).toBe(1)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(3)
  })

  it('accepts custom amount', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx, { amount: 0.8 })
    expect(d).toBeDefined()
  })

  it('accepts custom mode', () => {
    const ctx = h.mockContext()
    expect(() => createDistortion(ctx, { mode: 'hard' })).not.toThrow()
    expect(() => createDistortion(ctx, { mode: 'foldback' })).not.toThrow()
    expect(() => createDistortion(ctx, { mode: 'soft' })).not.toThrow()
  })

  it('accepts custom mix', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx, { mix: 0.7 })
    expect(d).toBeDefined()
  })

  it('setAmount does not throw', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    expect(() => { d.setAmount(0.9) }).not.toThrow()
  })

  it('setAmount accepts optional mode parameter', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    expect(() => { d.setAmount(0.5, 'hard') }).not.toThrow()
  })

  it('setMix does not throw', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    expect(() => { d.setMix(0.4) }).not.toThrow()
  })

  it('setMix accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    expect(() => { d.setMix(0.4, 1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    expect(d.connect(ctx.destination)).toBe(d)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    d.connect(ctx.destination)
    expect(d.disconnect()).toBe(d)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    d.connect(ctx.destination)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const d = createDistortion(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const d = createDistortion(ctx)
    expect(() => { d.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const d = createDistortion(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })
})
