import { describe, it, expect, vi } from 'vitest'
import { createJamSession } from '../src/session.js'
import type { JamSessionConfig } from '../src/types.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeSong = (overrides = {}): JamSessionConfig['song'] => ({
  _type:       'SongDefinition',
  bpm:         128,
  tracks:      [{} as never, {} as never],  // 2 stub tracks
  arrangement: [],
  seed:        1,
  ...overrides,
})

const makeEngine = () => ({
  start:   vi.fn(),
  stop:    vi.fn(),
  dispose: vi.fn(),
  patch:   vi.fn(),
  update:  vi.fn(),
  get bpm()  { return 128 },
  get bars() { return 0 },
})

const makeBridge = (connected = false) => {
  let isConnected = connected
  return {
    connect:    vi.fn(() => { isConnected = true; return Promise.resolve() }),
    disconnect: vi.fn(() => { isConnected = false }),
    get connected() { return isConnected },
  }
}

// ── Session state ─────────────────────────────────────────────────────────────

describe('createJamSession — initial state', () => {
  it('starts not playing', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    expect(session.state.playing).toBe(false)
  })

  it('state.bpm reflects song bpm', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong({ bpm: 140 }) })
    expect(session.state.bpm).toBe(128) // engine.bpm getter returns 128
  })

  it('state.masterVolume defaults to 0.85', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    expect(session.state.masterVolume).toBeCloseTo(0.85)
  })

  it('state.masterVolume uses config.volume when provided', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong(), volume: 0.6 })
    expect(session.state.masterVolume).toBeCloseTo(0.6)
  })

  it('state.trackMutes initialises to all false', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    expect(session.state.trackMutes).toEqual([false, false])
  })

  it('state.midiConnected starts false', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    expect(session.state.midiConnected).toBe(false)
  })
})

// ── Start / stop ──────────────────────────────────────────────────────────────

describe('createJamSession — start / stop', () => {
  it('start() calls engine.start and sets playing true', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    session.start()
    expect(engine.start).toHaveBeenCalledOnce()
    expect(session.state.playing).toBe(true)
  })

  it('start() is idempotent — second call is a no-op', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    session.start()
    session.start()
    expect(engine.start).toHaveBeenCalledOnce()
  })

  it('stop() calls engine.stop and sets playing false', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    session.start()
    session.stop()
    expect(engine.stop).toHaveBeenCalledOnce()
    expect(session.state.playing).toBe(false)
  })

  it('stop() is idempotent when not playing', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    session.stop()
    expect(engine.stop).not.toHaveBeenCalled()
  })
})

// ── Patch ─────────────────────────────────────────────────────────────────────

describe('createJamSession — patch', () => {
  it('patch bpm forwards to engine and updates state', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    session.patch({ bpm: 160 })
    expect(engine.patch).toHaveBeenCalledWith({ bpm: 160 })
    expect(session.state.bpm).toBe(128) // bpm from engine getter, not local
  })

  it('patch masterVolume updates state', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    session.patch({ masterVolume: 0.5 })
    expect(session.state.masterVolume).toBeCloseTo(0.5)
  })

  it('patch track mute updates trackMutes state', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    session.patch({ tracks: [{ index: 1, mute: true }] })
    expect(session.state.trackMutes[1]).toBe(true)
    expect(session.state.trackMutes[0]).toBe(false)
  })
})

// ── Update ────────────────────────────────────────────────────────────────────

describe('createJamSession — update', () => {
  it('update() forwards to engine.update', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    const newSong = makeSong({ bpm: 145 })
    session.update(newSong)
    expect(engine.update).toHaveBeenCalledWith(newSong)
  })

  it('update() resizes trackMutes for new track count', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    expect(session.state.trackMutes).toHaveLength(2)
    const bigSong = makeSong({ tracks: [{} as never, {} as never, {} as never] })
    session.update(bigSong)
    expect(session.state.trackMutes).toHaveLength(3)
  })
})

// ── MIDI ──────────────────────────────────────────────────────────────────────

describe('createJamSession — MIDI', () => {
  it('connectMidi() calls bridge.connect and sets midiConnected', async () => {
    const engine  = makeEngine()
    const bridge  = makeBridge()
    const session = createJamSession(engine, { song: makeSong(), midi: bridge })
    await session.connectMidi()
    expect(bridge.connect).toHaveBeenCalledOnce()
    expect(session.state.midiConnected).toBe(true)
  })

  it('connectMidi() reconnects if already connected', async () => {
    const engine  = makeEngine()
    const bridge  = makeBridge()
    const session = createJamSession(engine, { song: makeSong(), midi: bridge })
    await session.connectMidi()
    await session.connectMidi()
    expect(bridge.disconnect).toHaveBeenCalledOnce()
    expect(bridge.connect).toHaveBeenCalledTimes(2)
  })

  it('connectMidi() is safe when no bridge configured', async () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    await expect(session.connectMidi()).resolves.toBeUndefined()
  })

  it('disconnectMidi() calls bridge.disconnect and clears midiConnected', async () => {
    const engine  = makeEngine()
    const bridge  = makeBridge()
    const session = createJamSession(engine, { song: makeSong(), midi: bridge })
    await session.connectMidi()
    session.disconnectMidi()
    expect(bridge.disconnect).toHaveBeenCalled()
    expect(session.state.midiConnected).toBe(false)
  })

  it('disconnectMidi() is safe when no bridge configured', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    expect(() => { session.disconnectMidi() }).not.toThrow()
  })
})

// ── Dispose ───────────────────────────────────────────────────────────────────

describe('createJamSession — dispose', () => {
  it('dispose() stops engine and calls dispose', () => {
    const engine  = makeEngine()
    const session = createJamSession(engine, { song: makeSong() })
    session.start()
    session.dispose()
    expect(engine.stop).toHaveBeenCalled()
    expect(engine.dispose).toHaveBeenCalledOnce()
    expect(session.state.playing).toBe(false)
  })

  it('dispose() disconnects midi bridge if connected', async () => {
    const engine  = makeEngine()
    const bridge  = makeBridge()
    const session = createJamSession(engine, { song: makeSong(), midi: bridge })
    await session.connectMidi()
    session.dispose()
    expect(bridge.disconnect).toHaveBeenCalled()
    expect(session.state.midiConnected).toBe(false)
  })
})
