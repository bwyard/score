import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createAudioContext } from '../src/context.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createAudioContext', () => {
  it('returns an object with currentTime, sampleRate, state, and destination', () => {
    const ctx = h.context()
    expect(ctx).toHaveProperty('currentTime')
    expect(ctx).toHaveProperty('sampleRate')
    expect(ctx).toHaveProperty('state')
    expect(ctx).toHaveProperty('destination')
  })

  it('respects custom sampleRate option', () => {
    const ctx = h.context({ sampleRate: 48000 })
    expect(ctx.sampleRate).toBe(48000)
  })

  it('has a valid state string', () => {
    const ctx = h.context()
    expect(['suspended', 'running', 'closed']).toContain(ctx.state)
  })

  it('currentTime is a number >= 0', () => {
    const ctx = h.context()
    expect(ctx.currentTime).toBeGreaterThanOrEqual(0)
  })

  it('sampleRate is a positive number', () => {
    const ctx = h.context()
    expect(ctx.sampleRate).toBeGreaterThan(0)
  })

  it('destination exists', () => {
    const ctx = h.context()
    expect(ctx.destination).toBeDefined()
  })

  it('createGain() returns a node with gain property', () => {
    const ctx = h.context()
    const gain = ctx.createGain()
    expect(gain).toHaveProperty('gain')
  })

  it('createOscillator() returns a node with start/stop', () => {
    const ctx = h.context()
    const osc = ctx.createOscillator()
    expect(osc).toHaveProperty('start')
    expect(osc).toHaveProperty('stop')
  })

  it('defaults to sampleRate 44100', () => {
    const ctx = h.context()
    expect(ctx.sampleRate).toBe(44100)
  })

  it('throws ScoreError when construction fails', () => {
    expect(() => createAudioContext({ offline: { length: -1 } })).toThrow()
  })

  it('uses custom backend when provided', () => {
    const mockBackend = h.mockProvider()
    const ctx = createAudioContext({ backend: mockBackend })
    expect(mockBackend.contexts.length).toBe(1)
    expect(ctx.sampleRate).toBe(44100)
  })

  it('backend context has all factory methods', () => {
    const ctx = h.context()
    expect(ctx.createOscillator).toBeDefined()
    expect(ctx.createGain).toBeDefined()
    expect(ctx.createNoise).toBeDefined()
    expect(ctx.decodeAudio).toBeDefined()
    expect(ctx.createBufferSource).toBeDefined()
  })
})
