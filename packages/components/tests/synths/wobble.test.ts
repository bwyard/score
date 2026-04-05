import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createWobbleBass } from '../../src/synths/wobble.js'

const h = useHarness()

describe('createWobbleBass', () => {
  it('has noteOn, noteOff, setFrequency, setGain, connect, disconnect, dispose', () => {
    const wobble = createWobbleBass(h.mockContext())
    expect(typeof wobble.noteOn).toBe('function')
    expect(typeof wobble.noteOff).toBe('function')
    expect(typeof wobble.setFrequency).toBe('function')
    expect(typeof wobble.setGain).toBe('function')
    expect(typeof wobble.connect).toBe('function')
    expect(typeof wobble.disconnect).toBe('function')
    expect(typeof wobble.dispose).toBe('function')
  })

  it('id is prefixed wobble', () => {
    const wobble = createWobbleBass(h.mockContext())
    expect(wobble.id).toMatch(/^wobble/)
  })

  it('type is wobble', () => {
    const wobble = createWobbleBass(h.mockContext())
    expect(wobble.type).toBe('wobble')
  })

  it('creates 2 oscillators at construction (main osc + LFO)', () => {
    const ctx = h.mockContext()
    createWobbleBass(ctx)
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('default output gain is 0.8', () => {
    const ctx = h.mockContext()
    createWobbleBass(ctx)
    // gains created in order: vca (gain 0), outputGain (gain 0.8), lfoGain (gain lfoDepth)
    const gains = ctx.createdGains
    expect(gains[1]?.gain).toBeCloseTo(0.8)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createWobbleBass(ctx, { gain: 0.5 })
    expect(ctx.createdGains[1]?.gain).toBeCloseTo(0.5)
  })

  it('lfoGain is set to lfoDepth (default 800)', () => {
    const ctx = h.mockContext()
    createWobbleBass(ctx)
    // lfoGain is last gain created (after vca and outputGain)
    expect(ctx.createdGains[2]?.gain).toBeCloseTo(800)
  })

  it('respects custom lfoDepth', () => {
    const ctx = h.mockContext()
    createWobbleBass(ctx, { lfoDepth: 500 })
    expect(ctx.createdGains[2]?.gain).toBeCloseTo(500)
  })

  it('noteOn starts main oscillator and LFO once', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    wobble.noteOn(55, 0)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOn called twice does not start oscillators a second time', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    wobble.noteOn(55, 0)
    wobble.noteOn(73, 0.5)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOff schedules stop on both oscillators', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    wobble.noteOn(55, 0)
    wobble.noteOff(2.0)
    expect(ctx.createdOscillators.every(o => o.stopCalls.length === 1)).toBe(true)
  })

  it('setFrequency does not throw', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    expect(() => { wobble.setFrequency(110) }).not.toThrow()
  })

  it('setGain does not throw', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    expect(() => { wobble.setGain(0.6) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    expect(wobble.connect(ctx.destination)).toBe(wobble)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    expect(wobble.disconnect()).toBe(wobble)
  })

  it('dispose does not throw after noteOn/noteOff', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    wobble.noteOn(55, 0)
    wobble.noteOff(2.0)
    expect(() => { wobble.dispose() }).not.toThrow()
  })

  it('dispose does not throw without noteOn', () => {
    const ctx = h.mockContext()
    const wobble = createWobbleBass(ctx)
    expect(() => { wobble.dispose() }).not.toThrow()
  })
})
