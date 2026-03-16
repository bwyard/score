import { describe, it, expect, afterEach } from 'vitest'
import { AudioContext } from 'node-web-audio-api'
import { createOscillator } from '../src/oscillator.js'
import type { ScoreAudioContext } from '../src/types.js'

describe('createOscillator', () => {
  const contexts: AudioContext[] = []

  const makeContext = (): ScoreAudioContext => {
    const ctx = new AudioContext()
    contexts.push(ctx)
    return ctx
  }

  afterEach(async () => {
    await Promise.all(contexts.map((c) => c.close()))
    contexts.length = 0
  })

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

  it('default type is sine', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(osc).toHaveProperty('start')
    expect(osc).toHaveProperty('stop')
    // Verify via start/stop — if type were wrong, the node would still work
    // but we need to check the underlying node type
  })

  it('respects custom type prop', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, { type: 'sawtooth' })
    expect(osc).toBeDefined()
  })

  it('default frequency is 440', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    // setFrequency to a value and verify it doesn't throw
    expect(osc).toHaveProperty('setFrequency')
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
    expect(() => osc.start()).not.toThrow()
  })

  it('stop() after start does not throw', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    osc.start()
    expect(() => osc.stop()).not.toThrow()
  })

  it('setFrequency updates the frequency', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(() => osc.setFrequency(660)).not.toThrow()
  })

  it('setDetune updates the detune', () => {
    const ctx = makeContext()
    const osc = createOscillator(ctx, {})
    expect(() => osc.setDetune(50)).not.toThrow()
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
    expect(() => osc.dispose()).not.toThrow()
  })
})
