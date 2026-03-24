// pad.test.ts — createPad observable behaviour tests
// Follows Kent C. Dodds: test behaviour, not implementation.

import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createPad } from '../../src/synths/pad.js'

const h = useHarness()

describe('createPad', () => {
  it('has noteOn, noteOff, setFrequency, setFilterFrequency, setGain, connect, disconnect, dispose', () => {
    const pad = createPad(h.mockContext())
    expect(typeof pad.noteOn).toBe('function')
    expect(typeof pad.noteOff).toBe('function')
    expect(typeof pad.setFrequency).toBe('function')
    expect(typeof pad.setFilterFrequency).toBe('function')
    expect(typeof pad.setGain).toBe('function')
    expect(typeof pad.connect).toBe('function')
    expect(typeof pad.disconnect).toBe('function')
    expect(typeof pad.dispose).toBe('function')
  })

  it('id is prefixed pad', () => {
    expect(createPad(h.mockContext()).id).toMatch(/^pad/)
  })

  it('type is pad', () => {
    expect(createPad(h.mockContext()).type).toBe('pad')
  })

  it('produces unique id per call', () => {
    expect(createPad(h.mockContext()).id).not.toBe(createPad(h.mockContext()).id)
  })

  it('pad default unison=2 creates 4 oscillators', () => {
    const ctx = h.mockContext()
    createPad(ctx)
    // 2 pairs × 2 = 4 oscillators
    expect(ctx.createdOscillators.length).toBe(4)
  })

  it('caller can override unison to 1 (2 oscillators)', () => {
    const ctx = h.mockContext()
    createPad(ctx, { unison: 1 })
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('default output gain is 0.6', () => {
    const ctx = h.mockContext()
    createPad(ctx)
    // outputGain is the last gain node created
    const gains = ctx.createdGains
    expect(gains[gains.length - 1]?.gain).toBeCloseTo(0.6)
  })

  it('caller gain override is respected', () => {
    const ctx = h.mockContext()
    createPad(ctx, { gain: 0.4 })
    const gains = ctx.createdGains
    expect(gains[gains.length - 1]?.gain).toBeCloseTo(0.4)
  })

  it('noteOn starts oscillators once', () => {
    const ctx = h.mockContext()
    const pad = createPad(ctx)
    pad.noteOn(1.0)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOn called twice does not restart oscillators', () => {
    const ctx = h.mockContext()
    const pad = createPad(ctx)
    pad.noteOn(0)
    pad.noteOn(0.5)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOff schedules oscillator stop', () => {
    const ctx = h.mockContext()
    const pad = createPad(ctx)
    pad.noteOn(0)
    pad.noteOff(0.5)
    expect(ctx.createdOscillators.every(o => o.stopCalls.length === 1)).toBe(true)
  })

  it('setFrequency does not throw', () => {
    const pad = createPad(h.mockContext())
    expect(() => { pad.setFrequency(440) }).not.toThrow()
  })

  it('setFilterFrequency does not throw', () => {
    const pad = createPad(h.mockContext())
    expect(() => { pad.setFilterFrequency(2000) }).not.toThrow()
  })

  it('setGain does not throw', () => {
    const pad = createPad(h.mockContext())
    expect(() => { pad.setGain(0.5) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const pad = createPad(ctx)
    expect(pad.connect(ctx.destination)).toBe(pad)
  })

  it('disconnect returns self for chaining', () => {
    const pad = createPad(h.mockContext())
    expect(pad.disconnect()).toBe(pad)
  })

  it('dispose does not throw after noteOn/noteOff', () => {
    const ctx = h.mockContext()
    const pad = createPad(ctx)
    pad.noteOn(0)
    pad.noteOff(0.5)
    expect(() => { pad.dispose() }).not.toThrow()
  })

  it('dispose does not throw without noteOn', () => {
    expect(() => { createPad(h.mockContext()).dispose() }).not.toThrow()
  })

  it('caller adsr.attack override does not throw', () => {
    const ctx = h.mockContext()
    expect(() => {
      const pad = createPad(ctx, { adsr: { attack: 0.5, release: 2.0 } })
      pad.noteOn(0)
    }).not.toThrow()
  })
})
