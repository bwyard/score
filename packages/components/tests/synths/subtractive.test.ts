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

  it('default: creates 2 oscillators (1 unison pair)', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx)
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('unison=2 creates 4 oscillators', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx, { unison: 2 })
    expect(ctx.createdOscillators.length).toBe(4)
  })

  it('unison=4 creates 8 oscillators', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx, { unison: 4 })
    expect(ctx.createdOscillators.length).toBe(8)
  })

  it('default: creates 3 gain nodes (unisonMix + vca + output)', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx)
    // unisonMix + vca + outputGain = 3
    expect(ctx.createdGains.length).toBe(3)
  })

  it('default output gain is 0.7', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx)
    // outputGain is last gain created
    expect(ctx.createdGains[2]?.gain).toBeCloseTo(0.7)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx, { gain: 0.5 })
    expect(ctx.createdGains[2]?.gain).toBeCloseTo(0.5)
  })

  it('unisonMix gain normalises by oscillator count', () => {
    const ctx = h.mockContext()
    createSubtractiveSynth(ctx)
    // unisonMix = gain[0], 2 oscs → 1/2 = 0.5
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.5)
  })

  it('noteOn starts all oscillators once', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    synth.noteOn(1.0)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
    expect(ctx.createdOscillators[0]?.startCalls[0]?.time).toBe(1.0)
  })

  it('noteOn called twice does not start oscillators a second time', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    synth.noteOn(0)
    synth.noteOn(0.5)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOff schedules stop on all oscillators', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    synth.noteOn(0)
    synth.noteOff(0.5)
    expect(ctx.createdOscillators.every(o => o.stopCalls.length === 1)).toBe(true)
  })

  it('setFrequency updates all oscillators', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    // Should not throw and should reach all oscillators
    expect(() => { synth.setFrequency(440) }).not.toThrow()
  })

  it('setFilterFrequency does not throw', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    expect(() => { synth.setFilterFrequency(2000) }).not.toThrow()
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

  it('dispose does not throw after noteOn/noteOff', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    synth.noteOn(0)
    synth.noteOff(0.5)
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('dispose does not throw without noteOn', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('setGain does not throw', () => {
    const ctx = h.mockContext()
    const synth = createSubtractiveSynth(ctx)
    expect(() => { synth.setGain(0.5) }).not.toThrow()
  })
})
