import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createSnare909 } from '../../src/drums/snare909.js'

const h = useHarness()

describe('createSnare909', () => {
  it('has trigger, connect, disconnect, dispose', () => {
    const snare = createSnare909(h.mockContext())
    expect(typeof snare.trigger).toBe('function')
    expect(typeof snare.connect).toBe('function')
    expect(typeof snare.disconnect).toBe('function')
    expect(typeof snare.dispose).toBe('function')
  })

  it('id is prefixed snare909', () => {
    const snare = createSnare909(h.mockContext())
    expect(snare.id).toMatch(/^snare909/)
  })

  it('type is snare909', () => {
    const snare = createSnare909(h.mockContext())
    expect(snare.type).toBe('snare909')
  })

  it('creates one output gain at construction', () => {
    const ctx = h.mockContext()
    createSnare909(ctx)
    expect(ctx.createdGains.length).toBe(1)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.85)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createSnare909(ctx, { gain: 0.6 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.6)
  })

  it('trigger creates two triangle oscillators (tone body)', () => {
    const ctx = h.mockContext()
    const snare = createSnare909(ctx)
    snare.trigger(0)
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('both oscillators are started with trigger time', () => {
    const ctx = h.mockContext()
    const snare = createSnare909(ctx)
    snare.trigger(1.5)
    for (const osc of ctx.createdOscillators) {
      expect(osc.startCalls[0]?.time).toBe(1.5)
    }
  })

  it('both oscillators are scheduled to stop', () => {
    const ctx = h.mockContext()
    const snare = createSnare909(ctx)
    snare.trigger(0)
    for (const osc of ctx.createdOscillators) {
      expect(osc.stopCalls.length).toBe(1)
    }
  })

  it('trigger creates expected number of gain nodes (1 output + 1 toneEnv + 2 oscGain + 1 noiseEnv + 1 noiseScale = 6)', () => {
    const ctx = h.mockContext()
    const snare = createSnare909(ctx)
    snare.trigger(0)
    expect(ctx.createdGains.length).toBe(6)
  })

  it('two triggers create 4 oscillators total', () => {
    const ctx = h.mockContext()
    const snare = createSnare909(ctx)
    snare.trigger(0)
    snare.trigger(0.5)
    expect(ctx.createdOscillators.length).toBe(4)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const snare = createSnare909(ctx)
    expect(snare.connect(ctx.destination)).toBe(snare)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const snare = createSnare909(ctx)
    expect(snare.disconnect()).toBe(snare)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const snare = createSnare909(ctx)
    snare.trigger(0)
    expect(() => { snare.dispose() }).not.toThrow()
  })
})
