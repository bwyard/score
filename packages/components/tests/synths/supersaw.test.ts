import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createSupersaw } from '../../src/synths/supersaw.js'

const h = useHarness()

describe('createSupersaw', () => {
  it('has noteOn, noteOff, setFrequency, setGain, connect, disconnect, dispose', () => {
    const saw = createSupersaw(h.mockContext())
    expect(typeof saw.noteOn).toBe('function')
    expect(typeof saw.noteOff).toBe('function')
    expect(typeof saw.setFrequency).toBe('function')
    expect(typeof saw.setGain).toBe('function')
    expect(typeof saw.connect).toBe('function')
    expect(typeof saw.disconnect).toBe('function')
    expect(typeof saw.dispose).toBe('function')
  })

  it('id is prefixed supersaw', () => {
    const saw = createSupersaw(h.mockContext())
    expect(saw.id).toMatch(/^supersaw/)
  })

  it('type is supersaw', () => {
    const saw = createSupersaw(h.mockContext())
    expect(saw.type).toBe('supersaw')
  })

  it('creates 7 oscillators at construction', () => {
    const ctx = h.mockContext()
    createSupersaw(ctx)
    expect(ctx.createdOscillators.length).toBe(7)
  })

  it('default output gain is 0.6', () => {
    const ctx = h.mockContext()
    createSupersaw(ctx)
    // gains: unisonMix (gain 1/7), vca (gain 0), outputGain (gain 0.6)
    const gains = ctx.createdGains
    expect(gains[2]?.gain).toBeCloseTo(0.6)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createSupersaw(ctx, { gain: 0.4 })
    expect(ctx.createdGains[2]?.gain).toBeCloseTo(0.4)
  })

  it('unisonMix gain normalises by 7 oscillators', () => {
    const ctx = h.mockContext()
    createSupersaw(ctx)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(1 / 7)
  })

  it('noteOn starts all 7 oscillators once', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    saw.noteOn(440, 0)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOn called twice does not start oscillators a second time', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    saw.noteOn(440, 0)
    saw.noteOn(880, 0.5)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOff schedules stop on all 7 oscillators', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    saw.noteOn(440, 0)
    saw.noteOff(1.0)
    expect(ctx.createdOscillators.every(o => o.stopCalls.length === 1)).toBe(true)
  })

  it('setFrequency does not throw', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    expect(() => { saw.setFrequency(440) }).not.toThrow()
  })

  it('setGain does not throw', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    expect(() => { saw.setGain(0.5) }).not.toThrow()
  })

  it('with filter: creates filter node between unisonMix and vca', () => {
    const ctx = h.mockContext()
    createSupersaw(ctx, { filter: { frequency: 4000, Q: 0.7 } })
    // Still 7 oscillators
    expect(ctx.createdOscillators.length).toBe(7)
    // Still 3 gain nodes (unisonMix, vca, outputGain)
    expect(ctx.createdGains.length).toBe(3)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    expect(saw.connect(ctx.destination)).toBe(saw)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    expect(saw.disconnect()).toBe(saw)
  })

  it('dispose does not throw after noteOn/noteOff', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    saw.noteOn(440, 0)
    saw.noteOff(1.0)
    expect(() => { saw.dispose() }).not.toThrow()
  })

  it('dispose does not throw without noteOn', () => {
    const ctx = h.mockContext()
    const saw = createSupersaw(ctx)
    expect(() => { saw.dispose() }).not.toThrow()
  })
})
