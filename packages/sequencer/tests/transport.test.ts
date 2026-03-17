import { describe, it, expect } from 'vitest'
import { createTransport } from '../src/transport.js'
import { mockContext } from './utils/harness.js'

describe('createTransport', () => {
  it('returns correct shape', () => {
    const transport = createTransport(mockContext())
    expect(typeof transport.play).toBe('function')
    expect(typeof transport.stop).toBe('function')
    expect(typeof transport.pause).toBe('function')
    expect(typeof transport.seek).toBe('function')
    expect(transport.position).toBeDefined()
    expect(typeof transport.state).toBe('string')
    expect(typeof transport.bpm).toBe('number')
    expect(typeof transport.setBPM).toBe('function')
    expect(typeof transport.onBeat).toBe('function')
    expect(typeof transport.onBar).toBe('function')
    expect(typeof transport.onTick).toBe('function')
    expect(typeof transport.dispose).toBe('function')
  })

  it('initial state is stopped', () => {
    const transport = createTransport(mockContext())
    expect(transport.state).toBe('stopped')
  })

  it('play() changes state to playing', () => {
    const transport = createTransport(mockContext())
    transport.play()
    expect(transport.state).toBe('playing')
    transport.dispose()
  })

  it('stop() changes state to stopped', () => {
    const transport = createTransport(mockContext())
    transport.play()
    transport.stop()
    expect(transport.state).toBe('stopped')
  })

  it('pause() from playing changes state to paused', () => {
    const transport = createTransport(mockContext())
    transport.play()
    transport.pause()
    expect(transport.state).toBe('paused')
    transport.dispose()
  })

  it('play() from paused changes state to playing', () => {
    const transport = createTransport(mockContext())
    transport.play()
    transport.pause()
    expect(transport.state).toBe('paused')
    transport.play()
    expect(transport.state).toBe('playing')
    transport.dispose()
  })

  it('stop() from paused changes state to stopped', () => {
    const transport = createTransport(mockContext())
    transport.play()
    transport.pause()
    transport.stop()
    expect(transport.state).toBe('stopped')
  })

  it('pause() from stopped does not change state (stays stopped)', () => {
    const transport = createTransport(mockContext())
    transport.pause()
    expect(transport.state).toBe('stopped')
  })

  it('play() from playing is idempotent', () => {
    const transport = createTransport(mockContext())
    transport.play()
    transport.play()
    expect(transport.state).toBe('playing')
    transport.dispose()
  })

  it('initial position is { bar: 0, beat: 0, tick: 0, time: 0 }', () => {
    const transport = createTransport(mockContext())
    expect(transport.position).toEqual({ bar: 0, beat: 0, tick: 0, time: 0 })
  })

  it('stop() resets position to { bar: 0, beat: 0, tick: 0, time: 0 }', () => {
    const transport = createTransport(mockContext())
    transport.play()
    transport.seek(2, 3, 1)
    transport.stop()
    expect(transport.position).toEqual({ bar: 0, beat: 0, tick: 0, time: 0 })
  })

  it('seek() updates position', () => {
    const transport = createTransport(mockContext())
    transport.seek(2, 1, 3)
    expect(transport.position).toMatchObject({ bar: 2, beat: 1, tick: 3 })
  })

  it('seek() with only bar param defaults beat/tick to 0', () => {
    const transport = createTransport(mockContext())
    transport.seek(5)
    expect(transport.position).toMatchObject({ bar: 5, beat: 0, tick: 0 })
  })

  it('default BPM is 120', () => {
    const transport = createTransport(mockContext())
    expect(transport.bpm).toBe(120)
  })

  it('setBPM updates bpm', () => {
    const transport = createTransport(mockContext())
    transport.setBPM(140)
    expect(transport.bpm).toBe(140)
  })

  it('onTick registers without throwing', () => {
    const transport = createTransport(mockContext())
    expect(() => { transport.onTick(() => {}) }).not.toThrow()
    transport.dispose()
  })

  it('onBeat registers without throwing', () => {
    const transport = createTransport(mockContext())
    expect(() => { transport.onBeat(() => {}) }).not.toThrow()
    transport.dispose()
  })

  it('onBar registers without throwing', () => {
    const transport = createTransport(mockContext())
    expect(() => { transport.onBar(() => {}) }).not.toThrow()
    transport.dispose()
  })

  it('dispose does not throw', () => {
    const transport = createTransport(mockContext())
    expect(() => { transport.dispose() }).not.toThrow()
  })

  it('dispose when playing stops first', () => {
    const transport = createTransport(mockContext())
    transport.play()
    expect(transport.state).toBe('playing')
    transport.dispose()
    // After dispose, internal clock is stopped
    expect(transport.state).toBe('stopped')
  })

  it('custom timeSignature is accepted', () => {
    const transport = createTransport(mockContext(), { timeSignature: [3, 4] })
    expect(transport.bpm).toBe(120) // still default
    transport.dispose()
  })

  it('custom ticksPerBeat is accepted', () => {
    const transport = createTransport(mockContext(), { ticksPerBeat: 8 })
    expect(transport.bpm).toBe(120)
    transport.dispose()
  })
})
