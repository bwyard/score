import { describe, it, expect } from 'vitest'
import { createAudioContext } from '../src/context.js'
import { createOscillator } from '../src/oscillator.js'
import { createMockBackendContext } from './utils/audioTestUtils.js'

describe('createOscillator', () => {
  const makeContext = () =>
    createAudioContext({ offline: { length: 44100 } })

  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(osc).toHaveProperty('connect')
    expect(osc).toHaveProperty('disconnect')
    expect(osc).toHaveProperty('dispose')
    expect(typeof osc.connect).toBe('function')
    expect(typeof osc.disconnect).toBe('function')
    expect(typeof osc.dispose).toBe('function')
  })

  it('has start and stop methods', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(osc).toHaveProperty('start')
    expect(osc).toHaveProperty('stop')
  })

  it('respects custom type prop', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, { type: 'sawtooth' })
    expect(osc).toBeDefined()
  })

  it('respects custom frequency prop', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, { frequency: 880 })
    expect(osc).toBeDefined()
  })

  it('respects detune prop', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, { detune: 100 })
    expect(osc).toBeDefined()
  })

  it('start() does not throw', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(() => { osc.start(); }).not.toThrow()
  })

  it('stop() after start does not throw', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    osc.start()
    expect(() => { osc.stop(); }).not.toThrow()
  })

  it('setFrequency does not throw', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(() => { osc.setFrequency(660); }).not.toThrow()
  })

  it('setDetune does not throw', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(() => { osc.setDetune(50); }).not.toThrow()
  })

  it('connect and disconnect work without throwing', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(() => osc.connect(ctx.destination)).not.toThrow()
    expect(() => osc.disconnect()).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    const result = osc.connect(ctx.destination)
    expect(result).toBe(osc)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    osc.start()
    osc.connect(ctx.destination)
    expect(() => { osc.dispose(); }).not.toThrow()
  })

  it('disconnect when not connected does not throw', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(() => osc.disconnect()).not.toThrow()
  })

  it('dispose when never started does not throw', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(() => { osc.dispose(); }).not.toThrow()
  })

  it('delegates to backend createOscillator with props', () => {
    const mockCtx = createMockBackendContext()
    createOscillator(mockCtx, { type: 'square', frequency: 220, detune: 5 })
    expect(mockCtx.createdOscillators.length).toBe(1)
  })
})
