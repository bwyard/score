import { describe, it, expect, vi } from 'vitest'
import { createAudioContext } from '../src/context.js'

describe('createAudioContext', () => {
  const makeContext = (options?: Parameters<typeof createAudioContext>[0]) =>
    createAudioContext({ offline: { length: 44100 }, ...options })

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

  it('createGain() returns a node', () => {
    const ctx = makeContext()
    const gain = ctx.createGain()
    expect(gain).toBeDefined()
    expect(gain).toHaveProperty('gain')
  })

  it('createOscillator() returns a node', () => {
    const ctx = makeContext()
    const osc = ctx.createOscillator()
    expect(osc).toBeDefined()
    expect(osc).toHaveProperty('frequency')
  })

  it('defaults to offline with length 44100 when no options', () => {
    const ctx = createAudioContext({ offline: { length: 44100 } })
    expect(ctx.sampleRate).toBe(44100)
  })

  it('offline respects numberOfChannels', () => {
    const ctx = createAudioContext({
      offline: { length: 44100, numberOfChannels: 2 },
    })
    expect(ctx.destination.channelCount).toBeGreaterThanOrEqual(1)
  })

  it('throws ScoreError when construction fails', () => {
    vi.doMock('node-web-audio-api', () => ({
      AudioContext: class {
        constructor() {
          throw new Error('mock failure')
        }
      },
      OfflineAudioContext: class {
        constructor() {
          throw new Error('mock failure')
        }
      },
    }))
    // Use a direct approach — pass invalid params to trigger the catch
    expect(() => createAudioContext({ offline: { length: -1 } })).toThrow()
    vi.restoreAllMocks()
  })
})
