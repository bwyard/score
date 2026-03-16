import { describe, it, expect, afterAll } from 'vitest'
import { createAudioContext } from '../src/context.js'
import type { BackendContext } from '../src/backend/types.js'
import { createMockBackendProvider } from './utils/audioTestUtils.js'

describe('createAudioContext', () => {
  const contexts: BackendContext[] = []

  afterAll(async () => {
    await Promise.all(contexts.map((ctx) => ctx.close().catch(() => {})))
  })

  const makeContext = (options?: Parameters<typeof createAudioContext>[0]) => {
    const ctx = createAudioContext({ offline: { length: 44100 }, ...options })
    contexts.push(ctx)
    return ctx
  }

  it('returns an object with currentTime, sampleRate, state, and destination', () => {
    const ctx = makeContext()
    expect(ctx).toHaveProperty('currentTime')
    expect(ctx).toHaveProperty('sampleRate')
    expect(ctx).toHaveProperty('state')
    expect(ctx).toHaveProperty('destination')
  })

  it('respects custom sampleRate option', () => {
    const ctx = makeContext({ sampleRate: 48000 })
    expect(ctx.sampleRate).toBe(48000)
  })

  it('has a valid state string', () => {
    const ctx = makeContext()
    expect(typeof ctx.state).toBe('string')
    expect(['suspended', 'running', 'closed']).toContain(ctx.state)
  })

  it('currentTime is a number >= 0', () => {
    const ctx = makeContext()
    expect(typeof ctx.currentTime).toBe('number')
    expect(ctx.currentTime).toBeGreaterThanOrEqual(0)
  })

  it('sampleRate is a positive number', () => {
    const ctx = makeContext()
    expect(typeof ctx.sampleRate).toBe('number')
    expect(ctx.sampleRate).toBeGreaterThan(0)
  })

  it('destination exists', () => {
    const ctx = makeContext()
    expect(ctx.destination).toBeDefined()
  })

  it('createGain() returns a node with gain property', () => {
    const ctx = makeContext()
    const gain = ctx.createGain()
    expect(gain).toBeDefined()
    expect(gain).toHaveProperty('gain')
  })

  it('createOscillator() returns a node with start/stop', () => {
    const ctx = makeContext()
    const osc = ctx.createOscillator()
    expect(osc).toBeDefined()
    expect(osc).toHaveProperty('start')
    expect(osc).toHaveProperty('stop')
  })

  it('defaults to offline with length 44100 when no options', () => {
    const ctx = makeContext()
    expect(ctx.sampleRate).toBe(44100)
  })

  it('throws ScoreError when construction fails', () => {
    expect(() => createAudioContext({ offline: { length: -1 } })).toThrow()
  })

  it('uses custom backend when provided', () => {
    const mockBackend = createMockBackendProvider()
    const ctx = createAudioContext({ backend: mockBackend })
    expect(mockBackend.contexts.length).toBe(1)
    expect(ctx.sampleRate).toBe(44100)
  })

  it('defaults to web-audio backend when none specified', () => {
    const ctx = makeContext()
    expect(ctx.createOscillator).toBeDefined()
    expect(ctx.createGain).toBeDefined()
    expect(ctx.createNoise).toBeDefined()
  })
})
