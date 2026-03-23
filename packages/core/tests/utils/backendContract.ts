// Backend contract test suite — any BackendProvider implementation must pass these
// Run with: runBackendContractTests(myBackend) inside a describe block

import { describe, it, expect, afterAll } from 'vitest'
import type { BackendContext, BackendProvider } from '../../src/backend/types.js'

export const runBackendContractTests = (provider: BackendProvider) => {
  const contexts: BackendContext[] = []
  const makeCtx = (): BackendContext => {
    const ctx = provider.createContext({ offline: { length: 44100 } })
    contexts.push(ctx)
    return ctx
  }

  afterAll(async () => {
    for (const ctx of contexts) {
      try { await ctx.close() } catch { /* offline contexts may not support close */ }
    }
  })

  describe(`BackendProvider: ${provider.name}`, () => {
    // --- Provider ---

    it('has a name string', () => {
      expect(typeof provider.name).toBe('string')
      expect(provider.name.length).toBeGreaterThan(0)
    })

    it('createContext returns a BackendContext', () => {
      const ctx = makeCtx()
      expect(ctx).toBeDefined()
      expect(typeof ctx.currentTime).toBe('number')
      expect(typeof ctx.sampleRate).toBe('number')
      expect(typeof ctx.state).toBe('string')
      expect(ctx.destination).toBeDefined()
    })

    it('respects sampleRate option', () => {
      const ctx = provider.createContext({ sampleRate: 48000, offline: { length: 48000 } })
      contexts.push(ctx)
      expect(ctx.sampleRate).toBe(48000)
    })

    // --- Context properties ---

    it('currentTime is >= 0', () => {
      const ctx = makeCtx()
      expect(ctx.currentTime).toBeGreaterThanOrEqual(0)
    })

    it('sampleRate is positive', () => {
      const ctx = makeCtx()
      expect(ctx.sampleRate).toBeGreaterThan(0)
    })

    it('state is a valid string', () => {
      const ctx = makeCtx()
      expect(['running', 'suspended', 'closed']).toContain(ctx.state)
    })

    it('destination has connect and disconnect', () => {
      const ctx = makeCtx()
      expect(typeof ctx.destination.connect).toBe('function')
      expect(typeof ctx.destination.disconnect).toBe('function')
    })

    // --- createOscillator ---

    it('createOscillator returns a node with required methods', () => {
      const ctx = makeCtx()
      const osc = ctx.createOscillator()
      expect(typeof osc.connect).toBe('function')
      expect(typeof osc.disconnect).toBe('function')
      expect(typeof osc.start).toBe('function')
      expect(typeof osc.stop).toBe('function')
      expect(typeof osc.setFrequency).toBe('function')
      expect(typeof osc.setDetune).toBe('function')
      expect(typeof osc.schedulePitchEnvelope).toBe('function')
    })

    it('createOscillator start/stop do not throw', () => {
      const ctx = makeCtx()
      const osc = ctx.createOscillator()
      expect(() => { osc.start() }).not.toThrow()
      expect(() => { osc.stop() }).not.toThrow()
    })

    it('createOscillator connects to destination', () => {
      const ctx = makeCtx()
      const osc = ctx.createOscillator()
      expect(() => { osc.connect(ctx.destination) }).not.toThrow()
    })

    // --- createGain ---

    it('createGain returns a node with required methods', () => {
      const ctx = makeCtx()
      const gain = ctx.createGain()
      expect(typeof gain.connect).toBe('function')
      expect(typeof gain.disconnect).toBe('function')
      expect(typeof gain.gain).toBe('number')
      expect(typeof gain.setGain).toBe('function')
    })

    it('createGain defaults to gain 1.0', () => {
      const ctx = makeCtx()
      const gain = ctx.createGain()
      expect(gain.gain).toBeCloseTo(1.0)
    })

    it('createGain respects initial gain', () => {
      const ctx = makeCtx()
      const gain = ctx.createGain({ gain: 0.5 })
      expect(gain.gain).toBeCloseTo(0.5)
    })

    it('createGain connects to destination', () => {
      const ctx = makeCtx()
      const gain = ctx.createGain()
      expect(() => { gain.connect(ctx.destination) }).not.toThrow()
    })

    // --- createNoise ---

    it('createNoise returns a node with required methods', () => {
      const ctx = makeCtx()
      const noise = ctx.createNoise()
      expect(typeof noise.connect).toBe('function')
      expect(typeof noise.disconnect).toBe('function')
      expect(typeof noise.start).toBe('function')
      expect(typeof noise.stop).toBe('function')
    })

    it('createNoise start/stop do not throw', () => {
      const ctx = makeCtx()
      const noise = ctx.createNoise()
      expect(() => { noise.start() }).not.toThrow()
      expect(() => { noise.stop() }).not.toThrow()
    })

    it('createNoise supports all noise types', () => {
      const ctx = makeCtx()
      expect(() => { ctx.createNoise({ type: 'white' }) }).not.toThrow()
      expect(() => { ctx.createNoise({ type: 'pink' }) }).not.toThrow()
      expect(() => { ctx.createNoise({ type: 'brown' }) }).not.toThrow()
    })

    // --- decodeAudio ---

    it('decodeAudio returns a BackendBuffer', async () => {
      const ctx = makeCtx()
      // Minimal valid WAV: 44-byte header + 2 bytes of silence
      const wav = createMinimalWav()
      const buffer = await ctx.decodeAudio(wav)
      expect(buffer).toBeDefined()
      expect(typeof buffer.duration).toBe('number')
      expect(typeof buffer.length).toBe('number')
      expect(typeof buffer.sampleRate).toBe('number')
      expect(typeof buffer.numberOfChannels).toBe('number')
      expect(buffer.duration).toBeGreaterThan(0)
      expect(buffer.length).toBeGreaterThan(0)
      expect(buffer.sampleRate).toBeGreaterThan(0)
      expect(buffer.numberOfChannels).toBeGreaterThanOrEqual(1)
    })

    // --- createBufferSource ---

    it('createBufferSource returns a node with required methods', async () => {
      const ctx = makeCtx()
      const wav = createMinimalWav()
      const buffer = await ctx.decodeAudio(wav)
      const source = ctx.createBufferSource(buffer)
      expect(typeof source.connect).toBe('function')
      expect(typeof source.disconnect).toBe('function')
      expect(typeof source.start).toBe('function')
      expect(typeof source.stop).toBe('function')
      expect(typeof source.loop).toBe('boolean')
      expect(typeof source.setLoop).toBe('function')
      expect(typeof source.setPlaybackRate).toBe('function')
    })

    it('createBufferSource start/stop do not throw', async () => {
      const ctx = makeCtx()
      const wav = createMinimalWav()
      const buffer = await ctx.decodeAudio(wav)
      const source = ctx.createBufferSource(buffer)
      expect(() => { source.start() }).not.toThrow()
      expect(() => { source.stop() }).not.toThrow()
    })

    it('createBufferSource respects loop prop', async () => {
      const ctx = makeCtx()
      const wav = createMinimalWav()
      const buffer = await ctx.decodeAudio(wav)
      const source = ctx.createBufferSource(buffer, { loop: true })
      expect(source.loop).toBe(true)
    })

    // --- Node connectivity ---

    it('nodes can chain: osc -> gain -> destination', () => {
      const ctx = makeCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      expect(() => {
        osc.connect(gain)
        gain.connect(ctx.destination)
      }).not.toThrow()
    })

    // --- suspend/resume/close ---

    it('suspend and resume are callable', () => {
      const ctx = makeCtx()
      expect(typeof ctx.suspend).toBe('function')
      expect(typeof ctx.resume).toBe('function')
      expect(typeof ctx.close).toBe('function')
    })
  })
}

// Minimal valid WAV file for contract tests (44 header + 100 samples of silence)
const createMinimalWav = (): ArrayBuffer => {
  const numSamples = 100
  const dataSize = numSamples * 2
  const buf = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buf)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)       // PCM
  view.setUint16(22, 1, true)       // mono
  view.setUint32(24, 44100, true)   // sample rate
  view.setUint32(28, 88200, true)   // byte rate
  view.setUint16(32, 2, true)       // block align
  view.setUint16(34, 16, true)      // bits per sample

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)
  // samples are zero-initialized (silence)

  return buf
}

const writeString = (view: DataView, offset: number, str: string): void => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}
