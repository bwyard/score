import { describe, it, expect, afterEach } from 'vitest'
import { OfflineAudioContext } from 'node-web-audio-api'
import { createGain } from '../src/gain.js'
import type { ScoreAudioContext } from '../src/types.js'

describe('createGain', () => {
  const contexts: OfflineAudioContext[] = []

  const makeContext = (): ScoreAudioContext => {
    const ctx = new OfflineAudioContext(1, 44100, 44100)
    contexts.push(ctx)
    return ctx
  }

  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    expect(g).toHaveProperty('connect')
    expect(g).toHaveProperty('disconnect')
    expect(g).toHaveProperty('dispose')
    expect(typeof g.connect).toBe('function')
    expect(typeof g.disconnect).toBe('function')
    expect(typeof g.dispose).toBe('function')
  })

  it('default gain is 1.0', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    expect(g.node.gain.value).toBeCloseTo(1.0)
  })

  it('respects custom gain prop', () => {
    const ctx = makeContext()
    const g = createGain(ctx, { gain: 0.5 })
    expect(g.node.gain.value).toBeCloseTo(0.5)
  })

  it('setGain updates the gain value', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    expect(() => g.setGain(0.75)).not.toThrow()
  })

  it('connect and disconnect work without throwing', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    expect(() => g.connect(ctx.destination)).not.toThrow()
    expect(() => g.disconnect()).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    const result = g.connect(ctx.destination)
    expect(result).toBe(g)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    g.connect(ctx.destination)
    expect(() => g.dispose()).not.toThrow()
  })

  it('node property exposes the underlying GainNode', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    expect(g.node).toBeDefined()
    expect(g.node).toHaveProperty('gain')
  })

  it('disconnect when not connected does not throw', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    expect(() => g.disconnect()).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = makeContext()
    const g = createGain(ctx)
    expect(() => g.dispose()).not.toThrow()
  })
})
