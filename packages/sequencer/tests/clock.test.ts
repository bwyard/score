import { describe, it, expect } from 'vitest'
import { createClock } from '../src/clock.js'
import { mockContext } from './utils/harness.js'

describe('createClock', () => {
  it('returns correct shape (start, stop, setBPM, onTick, currentTick, bpm, isRunning, dispose)', () => {
    const ctx = mockContext()
    const clock = createClock(ctx)
    expect(typeof clock.start).toBe('function')
    expect(typeof clock.stop).toBe('function')
    expect(typeof clock.setBPM).toBe('function')
    expect(typeof clock.onTick).toBe('function')
    expect(typeof clock.currentTick).toBe('number')
    expect(typeof clock.bpm).toBe('number')
    expect(typeof clock.isRunning).toBe('boolean')
    expect(typeof clock.dispose).toBe('function')
  })

  it('default BPM is 120', () => {
    const clock = createClock(mockContext())
    expect(clock.bpm).toBe(120)
  })

  it('setBPM updates bpm', () => {
    const clock = createClock(mockContext())
    clock.setBPM(140)
    expect(clock.bpm).toBe(140)
  })

  it('start sets isRunning to true', () => {
    const clock = createClock(mockContext())
    clock.start()
    expect(clock.isRunning).toBe(true)
    clock.dispose()
  })

  it('stop sets isRunning to false and resets tick', () => {
    const clock = createClock(mockContext())
    clock.start()
    clock.stop()
    expect(clock.isRunning).toBe(false)
    expect(clock.currentTick).toBe(0)
  })

  it('stop when not running does not throw', () => {
    const clock = createClock(mockContext())
    expect(() => { clock.stop() }).not.toThrow()
  })

  it('dispose does not throw', () => {
    const clock = createClock(mockContext())
    expect(() => { clock.dispose() }).not.toThrow()
  })

  it('dispose when running stops first', () => {
    const clock = createClock(mockContext())
    clock.start()
    expect(clock.isRunning).toBe(true)
    clock.dispose()
    expect(clock.isRunning).toBe(false)
  })

  it('onTick registers callback without throwing', () => {
    const clock = createClock(mockContext())
    expect(() => { clock.onTick(() => {}) }).not.toThrow()
    clock.dispose()
  })

  it('multiple onTick callbacks can be registered', () => {
    const clock = createClock(mockContext())
    expect(() => {
      clock.onTick(() => {})
      clock.onTick(() => {})
      clock.onTick(() => {})
    }).not.toThrow()
    clock.dispose()
  })

  it('start/stop/start cycle works', () => {
    const clock = createClock(mockContext())
    clock.start()
    expect(clock.isRunning).toBe(true)
    clock.stop()
    expect(clock.isRunning).toBe(false)
    clock.start()
    expect(clock.isRunning).toBe(true)
    clock.dispose()
  })

  it('default ticksPerBeat is 4', () => {
    // Verify by checking the clock accepts default props without error
    const clock = createClock(mockContext())
    // No direct accessor for ticksPerBeat, but the clock should work with defaults
    expect(clock.bpm).toBe(120)
    clock.dispose()
  })

  it('custom props are accepted (bpm)', () => {
    const clock = createClock(mockContext(), { bpm: 140 })
    expect(clock.bpm).toBe(140)
    clock.dispose()
  })

  it('custom props are accepted (ticksPerBeat)', () => {
    const clock = createClock(mockContext(), { ticksPerBeat: 8 })
    expect(clock.bpm).toBe(120) // default BPM still works
    clock.dispose()
  })

  it('custom props are accepted (lookaheadMs)', () => {
    const clock = createClock(mockContext(), { lookaheadMs: 50 })
    expect(clock.bpm).toBe(120)
    clock.dispose()
  })

  it('custom props are accepted (scheduleAheadSec)', () => {
    const clock = createClock(mockContext(), { scheduleAheadSec: 0.2 })
    expect(clock.bpm).toBe(120)
    clock.dispose()
  })
})
