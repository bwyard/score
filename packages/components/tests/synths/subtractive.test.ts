import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createSubtractiveSynth } from '../../src/synths/subtractive.js'

const h = useHarness()

describe('createSubtractiveSynth', () => {
  it('has noteOn, noteOff, setFrequency, setFilterFrequency, setGain, connect, disconnect, dispose', () => {
    const synth = createSubtractiveSynth(h.mockContext())
    expect(typeof synth.noteOn).toBe('function')
    expect(typeof synth.noteOff).toBe('function')
    expect(typeof synth.setFrequency).toBe('function')
    expect(typeof synth.setFilterFrequency).toBe('function')
    expect(typeof synth.setGain).toBe('function')
    expect(typeof synth.connect).toBe('function')
    expect(typeof synth.disconnect).toBe('function')
    expect(typeof synth.dispose).toBe('function')
  })

  it('id is prefixed subsynth', () => {
    const synth = createSubtractiveSynth(h.mockContext())
    expect(synth.id).toMatch(/^subsynth/)
  })

  it('type is subsynth', () => {
    const synth = createSubtractiveSynth(h.mockContext())
    expect(synth.type).toBe('subsynth')
  })

  it('creates oscillator, filter, vca, output gain at construction', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx)
    // 1 VCA gain + 1 output gain = 2
    expect(ctx.createdGains.length).toBe(2)
    expect(ctx.createdOscillators.length).toBe(1)
  })

  it('default output gain is 0.8', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx)
    // outputGain is last gain created (index 1)
    expect(ctx.createdGains[1]?.gain).toBeCloseTo(0.8)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx, { gain: 0.5 })
    expect(ctx.createdGains[1]?.gain).toBeCloseTo(0.5)
  })

  it('noteOn starts the oscillator', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    synth.noteOn(1.0)
    expect(ctx.createdOscillators[0]?.startCalls.length).toBe(1)
    expect(ctx.createdOscillators[0]?.startCalls[0]?.time).toBe(1.0)
  })

  it('noteOn called twice does not start oscillator a second time', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    synth.noteOn(0)
    synth.noteOn(0.5)
    expect(ctx.createdOscillators[0]?.startCalls.length).toBe(1)
  })

  it('noteOff schedules oscillator stop', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    synth.noteOn(0)
    synth.noteOff(0.5)
    expect(ctx.createdOscillators[0]?.stopCalls.length).toBe(1)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    expect(synth.connect(ctx.destination)).toBe(synth)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    expect(synth.disconnect()).toBe(synth)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    synth.noteOn(0)
    synth.noteOff(0.5)
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('setFrequency does not throw', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    expect(() => { synth.setFrequency(440) }).not.toThrow()
  })

  it('setFilterFrequency does not throw', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    expect(() => { synth.setFilterFrequency(2000) }).not.toThrow()
  })
})
