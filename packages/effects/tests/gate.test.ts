import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createGate } from '../src/gate.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createGate', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx)
    expect(typeof d.connect).toBe('function')
    expect(typeof d.disconnect).toBe('function')
    expect(typeof d.dispose).toBe('function')
  })

  it('creates backend compressor and gain nodes', () => {
    const ctx = h.mockContext()
    createGate(ctx)
    expect(ctx.createdCompressors.length).toBe(1)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(1)
  })

  it('accepts custom threshold', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx, { threshold: -30 })
    expect(d).toBeDefined()
  })

  it('accepts custom attack', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx, { attack: 0.005 })
    expect(d).toBeDefined()
  })

  it('accepts custom release', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx, { release: 0.1 })
    expect(d).toBeDefined()
  })

  it('setThreshold does not throw', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx)
    expect(() => { d.setThreshold(-20) }).not.toThrow()
  })

  it('setAttack does not throw', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx)
    expect(() => { d.setAttack(0.01) }).not.toThrow()
  })

  it('setRelease does not throw', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx)
    expect(() => { d.setRelease(0.05) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx)
    expect(d.connect(ctx.destination)).toBe(d)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx)
    d.connect(ctx.destination)
    expect(d.disconnect()).toBe(d)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx)
    d.connect(ctx.destination)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const d = createGate(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const d = createGate(ctx)
    expect(() => { d.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const d = createGate(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })
})
