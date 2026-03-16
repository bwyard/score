import { describe, it, expect, afterAll } from 'vitest'
import { webAudioBackend } from '../src/backend/web-audio.js'
import type { BackendContext, BackendProvider } from '../src/backend/types.js'

describe('webAudioBackend', () => {
  const contexts: BackendContext[] = []

  const track = <T extends BackendContext>(ctx: T): T => {
    contexts.push(ctx)
    return ctx
  }

  afterAll(async () => {
    await Promise.all(contexts.map((ctx) => ctx.close().catch(() => {})))
  })

  it('is a BackendProvider with name "web-audio"', () => {
    const backend: BackendProvider = webAudioBackend
    expect(backend.name).toBe('web-audio')
    expect(typeof backend.createContext).toBe('function')
  })

  it('creates an offline context', () => {
    const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
    expect(ctx.sampleRate).toBe(44100)
    expect(ctx.destination).toBeDefined()
    expect(typeof ctx.createOscillator).toBe('function')
    expect(typeof ctx.createGain).toBe('function')
    expect(typeof ctx.createNoise).toBe('function')
  })

  it('respects custom sampleRate', () => {
    const ctx = track(webAudioBackend.createContext({
      sampleRate: 48000,
      offline: { length: 48000 },
    }))
    expect(ctx.sampleRate).toBe(48000)
  })

  it('throws ScoreError for invalid offline params', () => {
    expect(() => webAudioBackend.createContext({ offline: { length: -1 } })).toThrow()
  })

  describe('createOscillator', () => {
    it('returns a node with start, stop, setFrequency, setDetune, connect, disconnect', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      const osc = ctx.createOscillator()
      expect(typeof osc.start).toBe('function')
      expect(typeof osc.stop).toBe('function')
      expect(typeof osc.setFrequency).toBe('function')
      expect(typeof osc.setDetune).toBe('function')
      expect(typeof osc.connect).toBe('function')
      expect(typeof osc.disconnect).toBe('function')
    })

    it('start and stop do not throw', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      const osc = ctx.createOscillator()
      expect(() => { osc.start(); }).not.toThrow()
      expect(() => { osc.stop(); }).not.toThrow()
    })

    it('connects to destination without throwing', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      const osc = ctx.createOscillator()
      expect(() => { osc.connect(ctx.destination); }).not.toThrow()
    })
  })

  describe('createGain', () => {
    it('returns a node with gain, setGain, connect, disconnect', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      const gain = ctx.createGain()
      expect(typeof gain.gain).toBe('number')
      expect(typeof gain.setGain).toBe('function')
      expect(typeof gain.connect).toBe('function')
      expect(typeof gain.disconnect).toBe('function')
    })

    it('defaults to gain 1.0', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      const gain = ctx.createGain()
      expect(gain.gain).toBeCloseTo(1.0)
    })

    it('respects initial gain prop', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      const gain = ctx.createGain({ gain: 0.5 })
      expect(gain.gain).toBeCloseTo(0.5)
    })
  })

  describe('createNoise', () => {
    it('returns a node with start, stop, connect, disconnect', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      const noise = ctx.createNoise()
      expect(typeof noise.start).toBe('function')
      expect(typeof noise.stop).toBe('function')
      expect(typeof noise.connect).toBe('function')
      expect(typeof noise.disconnect).toBe('function')
    })

    it('start and stop do not throw', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      const noise = ctx.createNoise()
      expect(() => { noise.start(); }).not.toThrow()
      expect(() => { noise.stop(); }).not.toThrow()
    })

    it('accepts all noise types', () => {
      const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
      expect(() => ctx.createNoise({ type: 'white' })).not.toThrow()
      expect(() => ctx.createNoise({ type: 'pink' })).not.toThrow()
      expect(() => ctx.createNoise({ type: 'brown' })).not.toThrow()
    })
  })
})
