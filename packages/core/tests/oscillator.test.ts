import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createOscillator } from '../src/oscillator.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createOscillator', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const osc = createOscillator(h.context(), {})
    expect(typeof osc.connect).toBe('function')
    expect(typeof osc.disconnect).toBe('function')
    expect(typeof osc.dispose).toBe('function')
  })

  it('has start and stop methods', () => {
    const osc = createOscillator(h.context(), {})
    expect(typeof osc.start).toBe('function')
    expect(typeof osc.stop).toBe('function')
  })

  it('has setFrequency and setDetune methods', () => {
    const osc = createOscillator(h.context(), {})
    expect(typeof osc.setFrequency).toBe('function')
    expect(typeof osc.setDetune).toBe('function')
  })

  it('accepts custom type prop', () => {
    expect(() => createOscillator(h.context(), { type: 'sawtooth' })).not.toThrow()
  })

  it('accepts custom frequency prop', () => {
    expect(() => createOscillator(h.context(), { frequency: 880 })).not.toThrow()
  })

  it('accepts detune prop', () => {
    expect(() => createOscillator(h.context(), { detune: 100 })).not.toThrow()
  })

  it('start() does not throw', () => {
    const osc = createOscillator(h.context(), {})
    expect(() => { osc.start() }).not.toThrow()
  })

  it('stop() after start does not throw', () => {
    const osc = createOscillator(h.context(), {})
    osc.start()
    expect(() => { osc.stop() }).not.toThrow()
  })

  it('setFrequency does not throw', () => {
    expect(() => { createOscillator(h.context(), {}).setFrequency(660) }).not.toThrow()
  })

  it('setDetune does not throw', () => {
    expect(() => { createOscillator(h.context(), {}).setDetune(50) }).not.toThrow()
  })

  it('connect and disconnect work', () => {
    const ctx = h.context()
    const osc = createOscillator(ctx, {})
    expect(() => { osc.connect(ctx.destination) }).not.toThrow()
    expect(() => { osc.disconnect() }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.context()
    const osc = createOscillator(ctx, {})
    expect(osc.connect(ctx.destination)).toBe(osc)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.context()
    const osc = createOscillator(ctx, {})
    osc.start()
    osc.connect(ctx.destination)
    expect(() => { osc.dispose() }).not.toThrow()
  })

  it('disconnect when not connected does not throw', () => {
    expect(() => { createOscillator(h.context(), {}).disconnect() }).not.toThrow()
  })

  it('dispose when never started does not throw', () => {
    expect(() => { createOscillator(h.context(), {}).dispose() }).not.toThrow()
  })

  it('delegates to backend createOscillator', () => {
    const mock = h.mockContext()
    createOscillator(mock, { type: 'square', frequency: 220 })
    expect(mock.createdOscillators.length).toBe(1)
  })
})
