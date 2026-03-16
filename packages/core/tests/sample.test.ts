import { describe, it, expect } from 'vitest'
import { createAudioContext } from '../src/context.js'
import { decodeSample, createSamplePlayer } from '../src/sample.js'
import { createMockBackendContext, createMockBuffer } from './utils/audioTestUtils.js'
import { createTestWav } from './utils/createTestWav.js'

describe('decodeSample', () => {
  it('decodes valid audio data via backend', async () => {
    const ctx = createAudioContext({ offline: { length: 44100 } })
    const wav = createTestWav()
    const arrayBuffer = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength)
    const buffer = await decodeSample(ctx, arrayBuffer)
    expect(buffer).toBeDefined()
    expect(buffer.duration).toBeGreaterThan(0)
    expect(buffer.sampleRate).toBeGreaterThan(0)
    expect(buffer.numberOfChannels).toBeGreaterThanOrEqual(1)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('throws ScoreError for empty ArrayBuffer', async () => {
    const ctx = createAudioContext({ offline: { length: 44100 } })
    await expect(decodeSample(ctx, new ArrayBuffer(0))).rejects.toThrow('Cannot decode empty audio data')
  })

  it('delegates to backend decodeAudio', async () => {
    const mockCtx = createMockBackendContext()
    const wav = createTestWav()
    const arrayBuffer = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength)
    const buffer = await decodeSample(mockCtx, arrayBuffer)
    expect(buffer.duration).toBe(1.0) // mock default
  })

  it('preserves sample rate from source file', async () => {
    const ctx = createAudioContext({ offline: { length: 44100 } })
    const wav = createTestWav({ sampleRate: 44100 })
    const arrayBuffer = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength)
    const buffer = await decodeSample(ctx, arrayBuffer)
    expect(buffer.sampleRate).toBe(44100)
  })
})

describe('createSamplePlayer', () => {
  it('returns an AudioComponent with start, stop, setPlaybackRate, setGain', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    expect(typeof player.start).toBe('function')
    expect(typeof player.stop).toBe('function')
    expect(typeof player.setPlaybackRate).toBe('function')
    expect(typeof player.setGain).toBe('function')
    expect(typeof player.connect).toBe('function')
    expect(typeof player.disconnect).toBe('function')
    expect(typeof player.dispose).toBe('function')
  })

  it('exposes the buffer reference', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer({ duration: 2.5 })
    const player = createSamplePlayer(mockCtx, buffer)
    expect(player.buffer).toBe(buffer)
    expect(player.buffer.duration).toBe(2.5)
  })

  it('start creates a buffer source via backend', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    player.start()
    expect(mockCtx.createdBufferSources.length).toBe(1)
  })

  it('each start creates a new buffer source (one-shot pattern)', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    player.start()
    player.start()
    expect(mockCtx.createdBufferSources.length).toBe(2)
  })

  it('stop does not throw when nothing is playing', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    expect(() => { player.stop(); }).not.toThrow()
  })

  it('stop after start does not throw', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    player.start()
    expect(() => { player.stop(); }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    const result = player.connect(mockCtx.destination)
    expect(result).toBe(player)
  })

  it('disconnect does not throw', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    player.connect(mockCtx.destination)
    expect(() => player.disconnect()).not.toThrow()
  })

  it('dispose cleans up without throwing', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    player.start()
    player.connect(mockCtx.destination)
    expect(() => { player.dispose(); }).not.toThrow()
  })

  it('dispose when never started does not throw', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    const player = createSamplePlayer(mockCtx, buffer)
    expect(() => { player.dispose(); }).not.toThrow()
  })

  it('creates gain node for volume control', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    createSamplePlayer(mockCtx, buffer, { gain: 0.5 })
    expect(mockCtx.createdGains.length).toBe(1)
  })

  it('respects custom gain prop', () => {
    const mockCtx = createMockBackendContext()
    const buffer = createMockBuffer()
    createSamplePlayer(mockCtx, buffer, { gain: 0.7 })
    expect(mockCtx.createdGains[0].gain).toBeCloseTo(0.7)
  })

  it('integration: decode and play with real backend', async () => {
    const ctx = createAudioContext({ offline: { length: 44100 } })
    const wav = createTestWav()
    const arrayBuffer = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength)
    const buffer = await decodeSample(ctx, arrayBuffer)
    const player = createSamplePlayer(ctx, buffer)
    player.connect(ctx.destination)
    expect(() => { player.start(); }).not.toThrow()
    expect(() => { player.stop(); }).not.toThrow()
    expect(() => { player.dispose(); }).not.toThrow()
  })
})
