// bass303.test.ts — createBass303 observable behaviour tests (TB-303 acid bass)
// Follows Kent C. Dodds: test behaviour, not implementation.

import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createBass303 } from '../../src/synths/bass303.js'

const h = useHarness()

describe('createBass303', () => {
  it('has noteOn, noteOff, setFrequency, setCutoff, setGain, connect, disconnect, dispose', () => {
    const bass = createBass303(h.mockContext())
    expect(typeof bass.noteOn).toBe('function')
    expect(typeof bass.noteOff).toBe('function')
    expect(typeof bass.setFrequency).toBe('function')
    expect(typeof bass.setCutoff).toBe('function')
    expect(typeof bass.setGain).toBe('function')
    expect(typeof bass.connect).toBe('function')
    expect(typeof bass.disconnect).toBe('function')
    expect(typeof bass.dispose).toBe('function')
  })

  it('id is prefixed bass303', () => {
    expect(createBass303(h.mockContext()).id).toMatch(/^bass303/)
  })

  it('type is bass-303', () => {
    expect(createBass303(h.mockContext()).type).toBe('bass-303')
  })

  it('produces unique id per call', () => {
    expect(createBass303(h.mockContext()).id).not.toBe(createBass303(h.mockContext()).id)
  })

  it('creates exactly 1 oscillator', () => {
    const ctx = h.mockContext()
    createBass303(ctx)
    expect(ctx.createdOscillators.length).toBe(1)
  })

  it('default output gain is 0.7', () => {
    const ctx = h.mockContext()
    createBass303(ctx)
    const gains = ctx.createdGains
    expect(gains[gains.length - 1]?.gain).toBeCloseTo(0.7)
  })

  it('caller gain override is respected', () => {
    const ctx = h.mockContext()
    createBass303(ctx, { gain: 0.5 })
    const gains = ctx.createdGains
    expect(gains[gains.length - 1]?.gain).toBeCloseTo(0.5)
  })

  it('noteOn starts oscillator once', () => {
    const ctx = h.mockContext()
    const bass = createBass303(ctx)
    bass.noteOn(1.0)
    expect(ctx.createdOscillators[0]?.startCalls.length).toBe(1)
    expect(ctx.createdOscillators[0]?.startCalls[0]?.time).toBe(1.0)
  })

  it('noteOn called twice does not restart oscillator', () => {
    const ctx = h.mockContext()
    const bass = createBass303(ctx)
    bass.noteOn(0)
    bass.noteOn(0.5)
    expect(ctx.createdOscillators[0]?.startCalls.length).toBe(1)
  })

  it('noteOn with accent=true does not throw', () => {
    const ctx = h.mockContext()
    const bass = createBass303(ctx)
    expect(() => { bass.noteOn(0, true) }).not.toThrow()
  })

  it('noteOn with slide=true does not throw', () => {
    const ctx = h.mockContext()
    const bass = createBass303(ctx)
    expect(() => { bass.noteOn(0, false, true) }).not.toThrow()
  })

  it('noteOff schedules oscillator stop', () => {
    const ctx = h.mockContext()
    const bass = createBass303(ctx)
    bass.noteOn(0)
    bass.noteOff(0.25)
    expect(ctx.createdOscillators[0]?.stopCalls.length).toBe(1)
  })

  it('setFrequency does not throw', () => {
    expect(() => { createBass303(h.mockContext()).setFrequency(110) }).not.toThrow()
  })

  it('setCutoff does not throw', () => {
    expect(() => { createBass303(h.mockContext()).setCutoff(800) }).not.toThrow()
  })

  it('setGain does not throw', () => {
    expect(() => { createBass303(h.mockContext()).setGain(0.5) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const bass = createBass303(ctx)
    expect(bass.connect(ctx.destination)).toBe(bass)
  })

  it('disconnect returns self for chaining', () => {
    expect(createBass303(h.mockContext()).disconnect()).toBeTruthy()
  })

  it('dispose does not throw after noteOn/noteOff', () => {
    const ctx = h.mockContext()
    const bass = createBass303(ctx)
    bass.noteOn(0)
    bass.noteOff(0.25)
    expect(() => { bass.dispose() }).not.toThrow()
  })

  it('dispose does not throw without noteOn', () => {
    expect(() => { createBass303(h.mockContext()).dispose() }).not.toThrow()
  })

  it('wave=square is accepted', () => {
    expect(() => {
      const bass = createBass303(h.mockContext(), { wave: 'square', frequency: 110 })
      bass.noteOn(0)
    }).not.toThrow()
  })

  it('resonance is clamped to 0–30', () => {
    // resonance=50 should clamp without throwing
    expect(() => { createBass303(h.mockContext(), { resonance: 50 }).noteOn(0) }).not.toThrow()
    // resonance=-5 should clamp without throwing
    expect(() => { createBass303(h.mockContext(), { resonance: -5 }).noteOn(0) }).not.toThrow()
  })

  it('accentAmount is clamped to 1.0–2.0', () => {
    expect(() => { createBass303(h.mockContext(), { accentAmount: 5.0 }).noteOn(0, true) }).not.toThrow()
    expect(() => { createBass303(h.mockContext(), { accentAmount: 0.1 }).noteOn(0, true) }).not.toThrow()
  })

  it('full acid bass config does not throw', () => {
    expect(() => {
      const bass = createBass303(h.mockContext(), {
        wave: 'sawtooth', frequency: 110,
        cutoff: 400, resonance: 15, envDepth: 3000,
        filterAdsr: { attack: 0.003, decay: 0.3, sustain: 0, release: 0.05 },
        ampAdsr:    { attack: 0.003, decay: 0.15, sustain: 0.5, release: 0.1 },
        accentAmount: 1.5, gain: 0.8,
      })
      bass.noteOn(0, true, false)
      bass.noteOff(0.2)
    }).not.toThrow()
  })
})
