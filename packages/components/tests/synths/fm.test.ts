import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createFMSynth } from '../../src/synths/fm.js'

const h = useHarness()

describe('createFMSynth', () => {
  it('has noteOn, noteOff, setFrequency, setGain, connect, disconnect, dispose', () => {
    const synth = createFMSynth(h.mockContext())
    expect(typeof synth.noteOn).toBe('function')
    expect(typeof synth.noteOff).toBe('function')
    expect(typeof synth.setFrequency).toBe('function')
    expect(typeof synth.setGain).toBe('function')
    expect(typeof synth.connect).toBe('function')
    expect(typeof synth.disconnect).toBe('function')
    expect(typeof synth.dispose).toBe('function')
  })

  it('id is prefixed fmsynth', () => {
    const synth = createFMSynth(h.mockContext())
    expect(synth.id).toMatch(/^fmsynth/)
  })

  it('type is fmsynth', () => {
    const synth = createFMSynth(h.mockContext())
    expect(synth.type).toBe('fmsynth')
  })

  it('creates 2 oscillators at construction (carrier + modulator)', () => {
    const ctx = h.mockContext()
    createFMSynth(ctx)
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('creates 3 gain nodes at construction (modGain, ampVca, outputGain)', () => {
    const ctx = h.mockContext()
    createFMSynth(ctx)
    // modGain (index 0), ampVca (index 1), outputGain (index 2)
    expect(ctx.createdGains.length).toBe(3)
  })

  it('default output gain is 0.7', () => {
    const ctx = h.mockContext()
    createFMSynth(ctx)
    // outputGain is last gain created (index 2)
    expect(ctx.createdGains[2]?.gain).toBeCloseTo(0.7)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createFMSynth(ctx, { gain: 0.5 })
    expect(ctx.createdGains[2]?.gain).toBeCloseTo(0.5)
  })

  it('modGain starts at 0', () => {
    const ctx = h.mockContext()
    createFMSynth(ctx)
    // modGain is first gain created (index 0)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0)
  })

  it('ampVca starts at 0', () => {
    const ctx = h.mockContext()
    createFMSynth(ctx)
    // ampVca is second gain created (index 1)
    expect(ctx.createdGains[1]?.gain).toBeCloseTo(0)
  })

  it('noteOn starts both oscillators', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    synth.noteOn(1.0)
    expect(ctx.createdOscillators[0]?.startCalls.length).toBe(1)
    expect(ctx.createdOscillators[1]?.startCalls.length).toBe(1)
  })

  it('noteOn passes scheduled time to both oscillators', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    synth.noteOn(2.5)
    expect(ctx.createdOscillators[0]?.startCalls[0]?.time).toBe(2.5)
    expect(ctx.createdOscillators[1]?.startCalls[0]?.time).toBe(2.5)
  })

  it('noteOn called twice does not start oscillators a second time', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    synth.noteOn(0)
    synth.noteOn(0.5)
    expect(ctx.createdOscillators[0]?.startCalls.length).toBe(1)
    expect(ctx.createdOscillators[1]?.startCalls.length).toBe(1)
  })

  it('noteOn triggers modGain ADSR to modPeak', () => {
    const ctx = h.mockContext()
    // default noteFreq=220, modIndex=3 → modPeak=660
    const synth = createFMSynth(ctx, { frequency: 220, modIndex: 3 })
    synth.noteOn(0)
    // scheduleEnvelope mock sets gain to peak; modGain is index 0
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(660)
  })

  it('noteOn triggers ampVca ADSR to peak 1.0', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    synth.noteOn(0)
    // ampVca is index 1; scheduleEnvelope mock sets gain to peak
    expect(ctx.createdGains[1]?.gain).toBeCloseTo(1.0)
  })

  it('noteOff schedules stop on both oscillators', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    synth.noteOn(0)
    synth.noteOff(0.5)
    expect(ctx.createdOscillators[0]?.stopCalls.length).toBe(1)
    expect(ctx.createdOscillators[1]?.stopCalls.length).toBe(1)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    expect(synth.connect(ctx.destination)).toBe(synth)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    expect(synth.disconnect()).toBe(synth)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    synth.noteOn(0)
    synth.noteOff(0.5)
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('dispose does not throw even without noteOn', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('setFrequency does not throw', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    expect(() => { synth.setFrequency(440) }).not.toThrow()
  })

  it('setGain does not throw', () => {
    const ctx = h.mockContext()
    const synth = createFMSynth(ctx)
    expect(() => { synth.setGain(0.5) }).not.toThrow()
  })

  it('accepts custom modRatio', () => {
    const ctx = h.mockContext()
    // Just verify it constructs without error when overriding defaults
    expect(() => { createFMSynth(ctx, { modRatio: 2.0 }) }).not.toThrow()
  })

  it('accepts custom modIndex and scales modPeak correctly', () => {
    const ctx = h.mockContext()
    // frequency=100, modIndex=5 → modPeak=500
    const synth = createFMSynth(ctx, { frequency: 100, modIndex: 5 })
    synth.noteOn(0)
    // modGain (index 0) peak should be 500
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(500)
  })

  it('accepts custom ampAdsr props', () => {
    const ctx = h.mockContext()
    expect(() => {
      createFMSynth(ctx, {
        ampAdsr: { attack: 0.05, decay: 0.3, sustain: 0.5, release: 0.6 },
      })
    }).not.toThrow()
  })

  it('accepts custom modAdsr props', () => {
    const ctx = h.mockContext()
    expect(() => {
      createFMSynth(ctx, {
        modAdsr: { attack: 0.01, decay: 0.5, sustain: 0.8, release: 0.3 },
      })
    }).not.toThrow()
  })

  it('two instances have distinct ids', () => {
    const ctx = h.mockContext()
    const a = createFMSynth(ctx)
    const b = createFMSynth(ctx)
    expect(a.id).not.toBe(b.id)
  })
})
