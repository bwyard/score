import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createDelay } from '../src/delay.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createDelay', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    expect(typeof d.connect).toBe('function')
    expect(typeof d.disconnect).toBe('function')
    expect(typeof d.dispose).toBe('function')
  })

  it('creates backend delay and gain nodes for feedback/mix', () => {
    const ctx = h.mockContext()
    createDelay(ctx)
    // Should create: delay node, feedback gain, dry gain, wet gain, input gain, output gain
    expect(ctx.createdDelays.length).toBe(1)
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(1)
  })

  it('accepts custom time', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx, { time: 0.5 })
    expect(d).toBeDefined()
  })

  it('accepts custom feedback', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx, { feedback: 0.6 })
    expect(d).toBeDefined()
  })

  it('accepts custom mix', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx, { mix: 0.7 })
    expect(d).toBeDefined()
  })

  it('setTime does not throw', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    expect(() => { d.setTime(0.3) }).not.toThrow()
  })

  it('setTime accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    expect(() => { d.setTime(0.3, 1.0) }).not.toThrow()
  })

  it('setFeedback does not throw', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    expect(() => { d.setFeedback(0.5) }).not.toThrow()
  })

  it('setMix does not throw', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    expect(() => { d.setMix(0.4) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    expect(d.connect(ctx.destination)).toBe(d)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    d.connect(ctx.destination)
    expect(d.disconnect()).toBe(d)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    d.connect(ctx.destination)
    expect(() => { d.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const d = createDelay(ctx)
    expect(() => { d.dispose() }).not.toThrow()
  })
})
