// Play/stop/pause state machine with position tracking
// Uses createClock internally for tick scheduling

import type { TransportState, Position } from './types.js'
import { createClock } from './clock.js'
import type { ClockContext } from './clock.js'

/**
 * Configuration props for {@link createTransport}.
 */
export type TransportProps = {
  /** Beats per minute. Defaults to `120`. */
  readonly bpm?: number
  /** Time signature as `[beatsPerBar, beatUnit]`. Defaults to `[4, 4]`. */
  readonly timeSignature?: readonly [number, number]
  /** Subdivision ticks per beat. Defaults to `4`. */
  readonly ticksPerBeat?: number
}

/**
 * A play/stop/pause state machine with bar-beat-tick position tracking.
 *
 * Wraps a {@link Clock} and exposes higher-level transport controls plus
 * position-aware callbacks for beat, bar, and tick events.
 */
export type Transport = {
  /** Begin playback from the current position. No-op if already playing. */
  readonly play: () => void
  /** Stop playback and reset position to bar 0, beat 0, tick 0. No-op if already stopped. */
  readonly stop: () => void
  /** Pause playback, preserving the current position. No-op if not playing. */
  readonly pause: () => void
  /**
   * Jump to a specific position without affecting playback state.
   * @param bar  - Target bar (zero-indexed).
   * @param beat - Target beat within the bar. Defaults to `0`.
   * @param tick - Target tick within the beat. Defaults to `0`.
   */
  readonly seek: (bar: number, beat?: number, tick?: number) => void
  /** A snapshot of the current bar-beat-tick position. */
  readonly position: Position
  /** Current transport state: `'stopped'`, `'playing'`, or `'paused'`. */
  readonly state: TransportState
  /** The current BPM setting (delegated to the internal clock). */
  readonly bpm: number
  /**
   * Update the BPM at any time.
   * @param bpm - New beats-per-minute value.
   */
  readonly setBPM: (bpm: number) => void
  /**
   * Register a callback that fires on every beat boundary.
   * @param callback - Receives a snapshot of the position at the beat boundary.
   */
  readonly onBeat: (callback: (position: Position) => void) => void
  /**
   * Register a callback that fires on every bar boundary.
   * @param callback - Receives a snapshot of the position at the bar boundary.
   */
  readonly onBar: (callback: (position: Position) => void) => void
  /**
   * Register a callback that fires on every tick.
   * @param callback - Receives a snapshot of the current position.
   */
  readonly onTick: (callback: (position: Position) => void) => void
  /** Stop playback, dispose the internal clock, and clear all callbacks. */
  readonly dispose: () => void
}

/** Internal mutable state for {@link createTransport}. */
type TransportInternalState = {
  readonly transportState: TransportState
  readonly pos: Position
}

/**
 * Create a transport controller with bar-beat-tick position tracking.
 *
 * The transport wraps a {@link Clock} and advances a `Position` on every tick,
 * firing registered callbacks at tick, beat, and bar boundaries.
 *
 * @param context - An object exposing `currentTime` (e.g. `AudioContext`).
 * @param props   - Optional configuration (BPM, time signature, subdivisions).
 * @returns A {@link Transport} instance.
 *
 * @example
 * ```ts
 * const ctx = new AudioContext()
 * const transport = createTransport(ctx, { bpm: 128, timeSignature: [4, 4] })
 * transport.onBar((pos) => console.log('bar', pos.bar))
 * transport.play()
 * ```
 */
export const createTransport = (context: ClockContext, props?: TransportProps): Transport => {
  const ticksPerBeat = props?.ticksPerBeat ?? 4
  const beatsPerBar = props?.timeSignature?.[0] ?? 4

  // Single mutable state object — the one `let` allowed per factory function.
  let state: TransportInternalState = {
    transportState: 'stopped',
    pos: { bar: 0, beat: 0, tick: 0, time: 0 },
  }

  // Callback registries — const arrays; mutation is the unavoidable event-system boundary.
  const tickCallbacks: Array<(position: Position) => void> = []
  const beatCallbacks: Array<(position: Position) => void> = []
  const barCallbacks: Array<(position: Position) => void> = []

  const clock = createClock(context, {
    bpm: props?.bpm ?? 120,
    ticksPerBeat,
  })

  clock.onTick((tickTime: number, _tickNumber: number): void => {
    const prevBeat = state.pos.beat
    const prevBar  = state.pos.bar

    // Compute the next position using only pure `const` derivations.
    const rawTick  = state.pos.tick + 1
    const nextTick = rawTick >= ticksPerBeat ? 0 : rawTick
    const advBeat  = rawTick >= ticksPerBeat
    const rawBeat  = advBeat ? state.pos.beat + 1 : state.pos.beat
    const nextBeat = rawBeat >= beatsPerBar ? 0 : rawBeat
    const nextBar  = (advBeat && rawBeat >= beatsPerBar) ? state.pos.bar + 1 : state.pos.bar

    state = { ...state, pos: { bar: nextBar, beat: nextBeat, tick: nextTick, time: tickTime } }
    const snapshot = { ...state.pos }

    for (const cb of tickCallbacks) {
      cb(snapshot)
    }

    if (state.pos.beat !== prevBeat || state.pos.bar !== prevBar) {
      for (const cb of beatCallbacks) {
        cb(snapshot)
      }
    }

    if (state.pos.bar !== prevBar) {
      for (const cb of barCallbacks) {
        cb(snapshot)
      }
    }
  })

  const transport: Transport = {
    play: (): void => {
      if (state.transportState === 'playing') return
      state = { ...state, transportState: 'playing' }
      clock.start()
    },

    stop: (): void => {
      if (state.transportState === 'stopped') return
      state = {
        ...state,
        transportState: 'stopped',
        pos: { bar: 0, beat: 0, tick: 0, time: 0 },
      }
      clock.stop()
    },

    pause: (): void => {
      if (state.transportState !== 'playing') return
      state = { ...state, transportState: 'paused' }
      clock.stop()
    },

    seek: (bar: number, beat?: number, tick?: number): void => {
      state = {
        ...state,
        pos: { bar, beat: beat ?? 0, tick: tick ?? 0, time: state.pos.time },
      }
    },

    get position() { return { ...state.pos } },
    get state() { return state.transportState },
    get bpm() { return clock.bpm },

    setBPM: (bpm: number): void => {
      clock.setBPM(bpm)
    },

    onBeat: (callback: (position: Position) => void): void => {
      beatCallbacks.push(callback)
    },

    onBar: (callback: (position: Position) => void): void => {
      barCallbacks.push(callback)
    },

    onTick: (callback: (position: Position) => void): void => {
      tickCallbacks.push(callback)
    },

    dispose: (): void => {
      if (state.transportState === 'playing') {
        state = { ...state, transportState: 'stopped' }
      }
      clock.dispose()
      tickCallbacks.length = 0
      beatCallbacks.length = 0
      barCallbacks.length = 0
    },
  }

  return transport
}
