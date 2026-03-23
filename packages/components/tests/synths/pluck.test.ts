// pluck.test.ts — createPluck observable behaviour tests (Karplus-Strong)
// Follows Kent C. Dodds: test behaviour, not implementation.

import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createPluck } from '../../src/synths/pluck.js'

const h = useHarness()

describe('createPluck', () => {
  it('has noteOn, noteOff, setFrequency, setGain, connect, disconnect, dispose', () => {
    const pluck = createPluck(h.mockContext())
    expect(typeof pluck.noteOn).toBe('function')
    expect(typeof pluck.noteOff).toBe('function')
    expect(typeof pluck.setFrequency).toBe('function')
    expect(typeof pluck.setGain).toBe('function')
    expect(typeof pluck.connect).toBe('function')
    expect(typeof pluck.disconnect).toBe('function')
    expect(typeof pluck.dispose).toBe('function')
  })

  it('id is prefixed pluck', () => {
    expect(createPluck(h.mockContext()).id).toMatch(/^pluck/)
  })

  it('type is pluck', () => {
    expect(createPluck(h.mockContext()).type).toBe('pluck')
  })

  it('produces unique id per call', () => {
    expect(createPluck(h.mockContext()).id).not.toBe(createPluck(h.mockContext()).id)
  })

  it('default output gain is 0.7', () => {
    const ctx = h.mockContext()
    createPluck(ctx)
    const gains = ctx.createdGains
    expect(gains[gains.length - 1]?.gain).toBeCloseTo(0.7)
  })

  it('caller gain override is respected', () => {
    const ctx = h.mockContext()
    createPluck(ctx, { gain: 0.5 })
    const gains = ctx.createdGains
    expect(gains[gains.length - 1]?.gain).toBeCloseTo(0.5)
  })

  it('noteOn does not throw', () => {
    expect(() => { createPluck(h.mockContext()).noteOn(0) }).not.toThrow()
  })

  it('noteOn can be called multiple times (re-trigger)', () => {
    const ctx = h.mockContext()
    const pluck = createPluck(ctx)
    expect(() => {
      pluck.noteOn(0)
      pluck.noteOn(0.5)
      pluck.noteOn(1.0)
    }).not.toThrow()
  })

  it('noteOff is a no-op (does not throw)', () => {
    const ctx = h.mockContext()
    const pluck = createPluck(ctx)
    pluck.noteOn(0)
    expect(() => { pluck.noteOff(0.5) }).not.toThrow()
  })

  it('noteOff without noteOn does not throw', () => {
    expect(() => { createPluck(h.mockContext()).noteOff(0) }).not.toThrow()
  })

  it('setFrequency does not throw', () => {
    expect(() => { createPluck(h.mockContext()).setFrequency(440) }).not.toThrow()
  })

  it('setGain does not throw', () => {
    expect(() => { createPluck(h.mockContext()).setGain(0.5) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const pluck = createPluck(ctx)
    expect(pluck.connect(ctx.destination)).toBe(pluck)
  })

  it('disconnect returns self for chaining', () => {
    const pluck = createPluck(h.mockContext())
    expect(pluck.disconnect()).toBe(pluck)
  })

  it('dispose does not throw after noteOn', () => {
    const ctx = h.mockContext()
    const pluck = createPluck(ctx)
    pluck.noteOn(0)
    expect(() => { pluck.dispose() }).not.toThrow()
  })

  it('dispose does not throw without noteOn', () => {
    expect(() => { createPluck(h.mockContext()).dispose() }).not.toThrow()
  })

  it('frequency prop is accepted (82.4 Hz — low E guitar)', () => {
    expect(() => { createPluck(h.mockContext(), { frequency: 82.4, feedback: 0.995 }) }).not.toThrow()
  })

  it('feedback clamped to 0–0.9999', () => {
    // feedback=2.0 should clamp without throwing
    expect(() => { createPluck(h.mockContext(), { feedback: 2.0 }).noteOn(0) }).not.toThrow()
    // feedback=-1 should clamp without throwing
    expect(() => { createPluck(h.mockContext(), { feedback: -1 }).noteOn(0) }).not.toThrow()
  })
})
