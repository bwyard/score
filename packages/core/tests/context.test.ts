import { describe, it, expect, afterEach } from 'vitest'
import { createAudioContext } from '../src/context.js'

describe('createAudioContext', () => {
  const contexts: { close: () => Promise<void> }[] = []

  const tracked = (options?: Parameters<typeof createAudioContext>[0]) => {
    const ctx = createAudioContext(options)
    contexts.push(ctx as unknown as { close: () => Promise<void> })
    return ctx
  }

  afterEach(async () => {
    await Promise.all(contexts.map((c) => c.close()))
    contexts.length = 0
  })

  it('returns an object with currentTime, sampleRate, state, and destination', () => {
    const ctx = tracked()
    expect(ctx).toHaveProperty('currentTime')
    expect(ctx).toHaveProperty('sampleRate')
    expect(ctx).toHaveProperty('state')
    expect(ctx).toHaveProperty('destination')
  })

  it('respects custom sampleRate option', () => {
    const ctx = tracked({ sampleRate: 48000 })
    expect(ctx.sampleRate).toBe(48000)
  })

  it('has a valid state string', () => {
    const ctx = tracked()
    expect(typeof ctx.state).toBe('string')
    expect(['suspended', 'running', 'closed']).toContain(ctx.state)
  })

  it('currentTime is a number >= 0', () => {
    const ctx = tracked()
    expect(typeof ctx.currentTime).toBe('number')
    expect(ctx.currentTime).toBeGreaterThanOrEqual(0)
  })

  it('sampleRate is a positive number', () => {
    const ctx = tracked()
    expect(typeof ctx.sampleRate).toBe('number')
    expect(ctx.sampleRate).toBeGreaterThan(0)
  })

  it('destination exists', () => {
    const ctx = tracked()
    expect(ctx.destination).toBeDefined()
  })

  it('close() returns a Promise', () => {
    const ctx = tracked()
    const result = ctx.close()
    expect(result).toBeInstanceOf(Promise)
  })

  it('resume() returns a Promise', () => {
    const ctx = tracked()
    const result = ctx.resume()
    expect(result).toBeInstanceOf(Promise)
  })

  it('createGain() returns a node', () => {
    const ctx = tracked()
    const gain = ctx.createGain()
    expect(gain).toBeDefined()
    expect(gain).toHaveProperty('gain')
  })

  it('createOscillator() returns a node', () => {
    const ctx = tracked()
    const osc = ctx.createOscillator()
    expect(osc).toBeDefined()
    expect(osc).toHaveProperty('frequency')
  })
})
