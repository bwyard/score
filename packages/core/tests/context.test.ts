import { describe, it, expect } from 'vitest'
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
})
