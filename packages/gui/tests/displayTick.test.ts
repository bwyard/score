// displayTick.test.ts — Unit tests for createDisplayTick factory.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDisplayTick }                               from '../src/main/display-tick.js'
import type { TickCache }                                  from '../src/main/display-tick.js'
import type { MainToRenderer }                             from '../src/main/ipc-types.js'

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeCache = (overrides: Partial<TickCache> = {}): TickCache => ({
  step:      0,
  stepCount: 16,
  bar:       0,
  beat:      0,
  bpm:       120,
  dirty:     false,
  ...overrides,
})

type SendCall = { channel: keyof MainToRenderer; payload: MainToRenderer[keyof MainToRenderer] }
type SendFn   = <K extends keyof MainToRenderer>(channel: K, payload: MainToRenderer[K]) => void

const makeSend = (): { send: SendFn; calls: SendCall[] } => {
  const calls: SendCall[] = []
  const send: SendFn = (channel, payload) => {
    calls.push({ channel, payload: payload })
  }
  return { send, calls }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('createDisplayTick', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(()  => { vi.useRealTimers() })

  it('returns start and stop functions', () => {
    const { send } = makeSend()
    const displayTick = createDisplayTick(send, makeCache())
    expect(typeof displayTick.start).toBe('function')
    expect(typeof displayTick.stop).toBe('function')
  })

  it('does not send before start() is called', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ dirty: true })
    createDisplayTick(send, cache)
    vi.advanceTimersByTime(100)
    expect(calls).toHaveLength(0)
  })

  it('does not send when cache is not dirty', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ dirty: false })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()
    vi.advanceTimersByTime(100)
    expect(calls).toHaveLength(0)
  })

  it('sends display:tick and engine:tick when dirty and interval fires', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ step: 3, stepCount: 16, bar: 0, beat: 3, bpm: 140, dirty: true })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()
    vi.advanceTimersByTime(16)
    // Both channels sent per tick — identical payloads
    expect(calls).toHaveLength(2)
    const expectedPayload = { step: 3, stepCount: 16, bar: 0, beat: 3, bpm: 140 }
    expect(calls[0]?.channel).toBe('display:tick')
    expect(calls[0]?.payload).toEqual(expectedPayload)
    expect(calls[1]?.channel).toBe('engine:tick')
    expect(calls[1]?.payload).toEqual(expectedPayload)
  })

  it('resets dirty to false after sending', () => {
    const { send } = makeSend()
    const cache = makeCache({ dirty: true })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()
    vi.advanceTimersByTime(16)
    expect(cache.dirty).toBe(false)
  })

  it('does not send again after dirty is cleared', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ dirty: true })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()
    vi.advanceTimersByTime(16)   // fires — sends display:tick + engine:tick, clears dirty
    vi.advanceTimersByTime(100)  // further ticks — dirty is false, no more sends
    expect(calls).toHaveLength(2)
  })

  it('sends on each interval where dirty is true', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ dirty: false })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()

    cache.dirty = true
    vi.advanceTimersByTime(16)   // tick 1 — dirty, sends display:tick + engine:tick
    expect(calls).toHaveLength(2)

    cache.dirty = true
    vi.advanceTimersByTime(16)   // tick 2 — dirty again, sends display:tick + engine:tick
    expect(calls).toHaveLength(4)
  })

  it('always sends latest cache values at fire time', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ step: 0, dirty: false })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()

    cache.step  = 7
    cache.dirty = true
    vi.advanceTimersByTime(16)
    expect((calls[0]?.payload as { step: number }).step).toBe(7)
  })

  it('start() is idempotent — calling twice does not double-fire', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ dirty: true })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()
    displayTick.start()  // second call is no-op
    vi.advanceTimersByTime(16)
    expect(calls).toHaveLength(2)  // display:tick + engine:tick, not 4
  })

  it('stop() halts the interval', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ dirty: false })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()
    displayTick.stop()

    cache.dirty = true
    vi.advanceTimersByTime(100)
    expect(calls).toHaveLength(0)
  })

  it('stop() is idempotent — calling twice does not throw', () => {
    const { send } = makeSend()
    const displayTick = createDisplayTick(send, makeCache())
    displayTick.start()
    displayTick.stop()
    expect(() => { displayTick.stop() }).not.toThrow()
  })

  it('can restart after stop', () => {
    const { send, calls } = makeSend()
    const cache = makeCache({ dirty: false })
    const displayTick = createDisplayTick(send, cache)
    displayTick.start()
    displayTick.stop()

    displayTick.start()
    cache.dirty = true
    vi.advanceTimersByTime(16)
    expect(calls).toHaveLength(2)  // display:tick + engine:tick
  })
})
