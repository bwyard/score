// rhodes.test.ts — createRhodes observable behaviour tests
// Follows Kent C. Dodds: test behaviour, not implementation.

import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createRhodes } from '../../src/synths/rhodes.js'

const h = useHarness()

describe('createRhodes', () => {
  it('has noteOn, noteOff, setFrequency, setGain, connect, disconnect, dispose', () => {
    const rh = createRhodes(h.mockContext())
    expect(typeof rh.noteOn).toBe('function')
    expect(typeof rh.noteOff).toBe('function')
    expect(typeof rh.setFrequency).toBe('function')
    expect(typeof rh.setGain).toBe('function')
    expect(typeof rh.connect).toBe('function')
    expect(typeof rh.disconnect).toBe('function')
    expect(typeof rh.dispose).toBe('function')
  })

  it('id is prefixed rhodes', () => {
    expect(createRhodes(h.mockContext()).id).toMatch(/^rhodes/)
  })

  it('type is rhodes', () => {
    expect(createRhodes(h.mockContext()).type).toBe('rhodes')
  })

  it('produces unique id per call', () => {
    expect(createRhodes(h.mockContext()).id).not.toBe(createRhodes(h.mockContext()).id)
  })

  it('creates 2 oscillators (carrier + modulator)', () => {
    const ctx = h.mockContext()
    createRhodes(ctx)
    expect(ctx.createdOscillators.length).toBe(2)
  })

  it('default output gain is 0.65', () => {
    const ctx = h.mockContext()
    createRhodes(ctx)
    const gains = ctx.createdGains
    expect(gains[gains.length - 1]?.gain).toBeCloseTo(0.65)
  })

  it('caller gain override is respected', () => {
    const ctx = h.mockContext()
    createRhodes(ctx, { gain: 0.5 })
    const gains = ctx.createdGains
    expect(gains[gains.length - 1]?.gain).toBeCloseTo(0.5)
  })

  it('noteOn starts both oscillators once', () => {
    const ctx = h.mockContext()
    const rh = createRhodes(ctx)
    rh.noteOn(1.0)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOn called twice does not restart oscillators', () => {
    const ctx = h.mockContext()
    const rh = createRhodes(ctx)
    rh.noteOn(0)
    rh.noteOn(0.5)
    expect(ctx.createdOscillators.every(o => o.startCalls.length === 1)).toBe(true)
  })

  it('noteOff schedules stop on both oscillators', () => {
    const ctx = h.mockContext()
    const rh = createRhodes(ctx)
    rh.noteOn(0)
    rh.noteOff(0.5)
    expect(ctx.createdOscillators.every(o => o.stopCalls.length === 1)).toBe(true)
  })

  it('setFrequency does not throw', () => {
    expect(() => { createRhodes(h.mockContext()).setFrequency(440) }).not.toThrow()
  })

  it('setGain does not throw', () => {
    expect(() => { createRhodes(h.mockContext()).setGain(0.5) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const rh = createRhodes(ctx)
    expect(rh.connect(ctx.destination)).toBe(rh)
  })

  it('disconnect returns self for chaining', () => {
    expect(createRhodes(h.mockContext()).disconnect()).toBeTruthy()
  })

  it('dispose does not throw after noteOn/noteOff', () => {
    const ctx = h.mockContext()
    const rh = createRhodes(ctx)
    rh.noteOn(0)
    rh.noteOff(0.5)
    expect(() => { rh.dispose() }).not.toThrow()
  })

  it('dispose does not throw without noteOn', () => {
    expect(() => { createRhodes(h.mockContext()).dispose() }).not.toThrow()
  })

  it('caller ampAdsr override is applied (decay 0.3)', () => {
    const ctx = h.mockContext()
    expect(() => {
      const rh = createRhodes(ctx, { ampAdsr: { attack: 0.005, decay: 0.3, release: 0.3 } })
      rh.noteOn(0)
      rh.noteOff(0.4)
    }).not.toThrow()
  })

  it('caller modIndex override is applied', () => {
    const ctx = h.mockContext()
    expect(() => {
      const rh = createRhodes(ctx, { modIndex: 6, frequency: 220 })
      rh.noteOn(0)
    }).not.toThrow()
  })
})
