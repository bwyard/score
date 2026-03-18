import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createAutoPan } from '../src/autopan.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createAutoPan', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(typeof ap.connect).toBe('function')
    expect(typeof ap.disconnect).toBe('function')
    expect(typeof ap.dispose).toBe('function')
  })

  it('id starts with "autopan-"', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(ap.id).toMatch(/^autopan-/)
  })

  it('type is "autopan"', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(ap.type).toBe('autopan')
  })

  it('creates one StereoPannerNode', () => {
    const ctx = h.mockContext()
    createAutoPan(ctx)
    expect(ctx.createdStereoPanners.length).toBe(1)
  })

  it('creates gain nodes for input and output', () => {
    const ctx = h.mockContext()
    createAutoPan(ctx)
    // inputGain, outputGain = 2
    expect(ctx.createdGains.length).toBe(2)
  })

  it('setRate(1) does not throw', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.setRate(1) }).not.toThrow()
  })

  it('setRate(0.25) does not throw', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.setRate(0.25) }).not.toThrow()
  })

  it('setDepth(0.5) does not throw', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.setDepth(0.5) }).not.toThrow()
  })

  it('setDepth(0) does not throw', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.setDepth(0) }).not.toThrow()
  })

  it('setShape("triangle") does not throw', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.setShape('triangle') }).not.toThrow()
  })

  it('setShape("sine") does not throw', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.setShape('sine') }).not.toThrow()
  })

  it('all setters can be called in sequence without throwing', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(() => {
      ap.setRate(0.5)
      ap.setDepth(0.8)
      ap.setShape('triangle')
      ap.setRate(2)
      ap.setDepth(0.3)
      ap.setShape('sine')
    }).not.toThrow()
  })

  it('setters after connect reschedule without throwing', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    ap.connect(ctx.destination)
    expect(() => {
      ap.setRate(1.0)
      ap.setDepth(0.6)
      ap.setShape('triangle')
    }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(ap.connect(ctx.destination)).toBe(ap)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    ap.connect(ctx.destination)
    expect(ap.disconnect()).toBe(ap)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    ap.connect(ctx.destination)
    expect(() => { ap.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.dispose() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const ap = createAutoPan(ctx)
    expect(() => { ap.disconnect() }).not.toThrow()
  })

  it('default props produce a valid component', () => {
    const ctx = h.mockContext()
    const ap = createAutoPan(ctx)
    expect(ap.id).toBeDefined()
    expect(ap.type).toBeDefined()
    expect(typeof ap.setRate).toBe('function')
    expect(typeof ap.setDepth).toBe('function')
    expect(typeof ap.setShape).toBe('function')
  })

  it('accepts full custom props without throwing', () => {
    const ctx = h.mockContext()
    expect(() => {
      createAutoPan(ctx, { rate: 2, depth: 0.9, shape: 'triangle' })
    }).not.toThrow()
  })
})
