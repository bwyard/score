import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { decodeSample, createSamplePlayer } from '../src/sample.js'
import { createTestWav } from './utils/createTestWav.js'

const h = useHarness()
afterAll(() => h.cleanup())

const testWavData = (): ArrayBuffer => {
  const wav = createTestWav()
  return new Uint8Array(wav).buffer
}

describe('decodeSample', () => {
  it('decodes valid audio data via backend', async () => {
    const buffer = await decodeSample(h.context(), testWavData())
    expect(buffer.duration).toBeGreaterThan(0)
    expect(buffer.sampleRate).toBeGreaterThan(0)
    expect(buffer.numberOfChannels).toBeGreaterThanOrEqual(1)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('throws ScoreError for empty ArrayBuffer', async () => {
    await expect(decodeSample(h.context(), new ArrayBuffer(0)))
      .rejects.toThrow('Cannot decode empty audio data')
  })

  it('delegates to backend decodeAudio', async () => {
    const mock = h.mockContext()
    const buffer = await decodeSample(mock, testWavData())
    expect(buffer.duration).toBe(1.0) // mock default
  })

  it('preserves sample rate from source', async () => {
    const buffer = await decodeSample(h.context(), testWavData())
    expect(buffer.sampleRate).toBe(44100)
  })
})

describe('createSamplePlayer', () => {
  it('has start, stop, setPlaybackRate, setGain, connect, disconnect, dispose', () => {
    const player = createSamplePlayer(h.mockContext(), h.mockBuffer())
    expect(typeof player.start).toBe('function')
    expect(typeof player.stop).toBe('function')
    expect(typeof player.setPlaybackRate).toBe('function')
    expect(typeof player.setGain).toBe('function')
    expect(typeof player.connect).toBe('function')
    expect(typeof player.disconnect).toBe('function')
    expect(typeof player.dispose).toBe('function')
  })

  it('exposes the buffer reference', () => {
    const buf = h.mockBuffer({ duration: 2.5 })
    const player = createSamplePlayer(h.mockContext(), buf)
    expect(player.buffer).toBe(buf)
    expect(player.buffer.duration).toBe(2.5)
  })

  it('start creates a buffer source via backend', () => {
    const mock = h.mockContext()
    const player = createSamplePlayer(mock, h.mockBuffer())
    player.start()
    expect(mock.createdBufferSources.length).toBe(1)
  })

  it('each start creates a new source (one-shot pattern)', () => {
    const mock = h.mockContext()
    const player = createSamplePlayer(mock, h.mockBuffer())
    player.start()
    player.start()
    expect(mock.createdBufferSources.length).toBe(2)
  })

  it('stop does not throw when nothing is playing', () => {
    expect(() => { createSamplePlayer(h.mockContext(), h.mockBuffer()).stop() }).not.toThrow()
  })

  it('stop after start does not throw', () => {
    const player = createSamplePlayer(h.mockContext(), h.mockBuffer())
    player.start()
    expect(() => { player.stop() }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const mock = h.mockContext()
    const player = createSamplePlayer(mock, h.mockBuffer())
    expect(player.connect(mock.destination)).toBe(player)
  })

  it('disconnect does not throw', () => {
    const mock = h.mockContext()
    const player = createSamplePlayer(mock, h.mockBuffer())
    player.connect(mock.destination)
    expect(() => { player.disconnect() }).not.toThrow()
  })

  it('dispose cleans up without throwing', () => {
    const mock = h.mockContext()
    const player = createSamplePlayer(mock, h.mockBuffer())
    player.start()
    player.connect(mock.destination)
    expect(() => { player.dispose() }).not.toThrow()
  })

  it('dispose when never started does not throw', () => {
    expect(() => { createSamplePlayer(h.mockContext(), h.mockBuffer()).dispose() }).not.toThrow()
  })

  it('creates gain node for volume control', () => {
    const mock = h.mockContext()
    createSamplePlayer(mock, h.mockBuffer(), { gain: 0.5 })
    expect(mock.createdGains.length).toBe(1)
  })

  it('respects custom gain prop', () => {
    const mock = h.mockContext()
    createSamplePlayer(mock, h.mockBuffer(), { gain: 0.7 })
    expect(mock.createdGains[0]?.gain).toBeCloseTo(0.7)
  })

  it('integration: decode and play with real backend', async () => {
    const ctx = h.context()
    const buffer = await decodeSample(ctx, testWavData())
    const player = createSamplePlayer(ctx, buffer)
    player.connect(ctx.destination)
    expect(() => { player.start() }).not.toThrow()
    expect(() => { player.stop() }).not.toThrow()
    expect(() => { player.dispose() }).not.toThrow()
  })
})
