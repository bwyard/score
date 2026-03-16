import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createStereoWidener } from '../src/stereo-widener.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createStereoWidener', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    expect(typeof d.connect).toBe('function')
    expect(typeof d.disconnect).toBe('function')
    expect(typeof d.dispose).toBe('function')
  })

  it('creates backend stereo panner and gain nodes', () => {
    const ctx = h.mockContext()
    createStereoWidener(ctx)
    expect(ctx.createdStereoPanners.length).toBe(2)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(3)
  })

  it('accepts custom width', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx, { width: 1.5 })
    expect(d).toBeDefined()
  })

  it('clamps width to valid range', () => {
    const ctx = h.mockContext()
    expect(() => createStereoWidener(ctx, { width: 0 })).not.toThrow()
    expect(() => createStereoWidener(ctx, { width: 2 })).not.toThrow()
  })

  it('setWidth does not throw', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    expect(() => { d.setWidth(0.5) }).not.toThrow()
  })

  it('setWidth accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    expect(() => { d.setWidth(1.5, 1.0) }).not.toThrow()
  })

  it('setWidth clamps values', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    expect(() => { d.setWidth(3.0) }).not.toThrow()
    expect(() => { d.setWidth(-1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    expect(d.connect(ctx.destination)).toBe(d)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    d.connect(ctx.destination)
    expect(d.disconnect()).toBe(d)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    d.connect(ctx.destination)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const d = createStereoWidener(ctx)
    expect(() => { d.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockContext()
    const d = createStereoWidener(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })
})
