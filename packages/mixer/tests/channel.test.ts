import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createChannel } from '../src/channel.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createChannel', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(typeof ch.connect).toBe('function')
    expect(typeof ch.disconnect).toBe('function')
    expect(typeof ch.dispose).toBe('function')
  })

  it('has id and type properties', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(ch.id).toMatch(/^channel-/)
    expect(ch.type).toBe('channel')
  })

  it('has an input property (BackendNode)', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(ch.input).toBeDefined()
    expect(typeof ch.input.connect).toBe('function')
  })

  it('creates gain and panner nodes', () => {
    const ctx = h.mockContext()
    createChannel(ctx)
    // inputGain, volumeGain, muteGain, outputGain = 4 gains
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(4)
    // panNode = 1 stereo panner
    expect(ctx.createdStereoPanners.length).toBe(1)
  })

  it('creates EQ filter nodes', () => {
    const ctx = h.mockContext()
    createChannel(ctx)
    // EQ creates 3 filters (low, mid, high)
    expect(ctx.createdFilters.length).toBe(3)
  })

  it('accepts custom name', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx, { name: 'Kick' })
    expect(ch.name).toBe('Kick')
  })

  it('defaults name to Channel', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(ch.name).toBe('Channel')
  })

  it('accepts custom volume', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx, { volume: 0.5 })
    expect(ch).toBeDefined()
  })

  it('accepts custom pan', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx, { pan: -0.5 })
    expect(ch).toBeDefined()
  })

  it('accepts mute prop', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx, { mute: true })
    expect(ch.mute).toBe(true)
  })

  it('accepts solo prop', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx, { solo: true })
    expect(ch.solo).toBe(true)
  })

  it('accepts effects array', () => {
    const ctx = h.mockContext()
    const mockEffect = {
      id: 'fx-1',
      type: 'filter',
      connect: (_d: unknown) => mockEffect,
      disconnect: () => mockEffect,
      dispose: () => {},
    }
    const ch = createChannel(ctx, { effects: [mockEffect] })
    expect(ch).toBeDefined()
  })

  it('accepts eq props', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx, { eq: { low: 3, mid: -2, high: 1 } })
    expect(ch).toBeDefined()
  })

  it('setVolume does not throw', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(() => { ch.setVolume(0.6) }).not.toThrow()
  })

  it('setVolume accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(() => { ch.setVolume(0.6, 1.0) }).not.toThrow()
  })

  it('setPan does not throw', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(() => { ch.setPan(0.3) }).not.toThrow()
  })

  it('setMute does not throw', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(() => { ch.setMute(true) }).not.toThrow()
    expect(ch.mute).toBe(true)
  })

  it('setSolo does not throw', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(() => { ch.setSolo(true) }).not.toThrow()
    expect(ch.solo).toBe(true)
  })

  it('setEQ does not throw', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(() => { ch.setEQ({ low: 2, mid: -1, high: 3 }) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(ch.connect(ctx.destination)).toBe(ch)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    ch.connect(ctx.destination)
    expect(ch.disconnect()).toBe(ch)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    ch.connect(ctx.destination)
    expect(() => { ch.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    expect(() => { ch.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const ch = createChannel(ctx)
    expect(() => { ch.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const ch = createChannel(ctx)
    expect(() => { ch.dispose() }).not.toThrow()
  })

  it('createSend returns object with setLevel', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    const returnInput = h.mockNode()
    const send = ch.createSend(returnInput)
    expect(typeof send.setLevel).toBe('function')
    expect(typeof send.dispose).toBe('function')
  })

  it('createSend setLevel does not throw', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    const returnInput = h.mockNode()
    const send = ch.createSend(returnInput)
    expect(() => { send.setLevel(0.7) }).not.toThrow()
  })

  it('createSend dispose does not throw', () => {
    const ctx = h.mockContext()
    const ch = createChannel(ctx)
    const returnInput = h.mockNode()
    const send = ch.createSend(returnInput)
    expect(() => { send.dispose() }).not.toThrow()
  })
})
