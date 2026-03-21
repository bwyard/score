// BPM-aware tick scheduler using audioContext.currentTime
// Uses the standard Web Audio scheduling pattern:
// setTimeout drives a lookahead loop, actual events are scheduled against currentTime

/**
 * Configuration props for {@link createClock}.
 */
export type ClockProps = {
  /** Beats per minute. Defaults to `120`. */
  readonly bpm?: number
  /** Subdivision ticks per beat. Defaults to `4` (16th notes). */
  readonly ticksPerBeat?: number
  /** How often (in ms) the lookahead loop fires. Defaults to `25`. */
  readonly lookaheadMs?: number
  /** How far ahead (in seconds) to schedule events. Defaults to `0.1`. */
  readonly scheduleAheadSec?: number
  /**
   * Optional loop scheduler — defaults to `setTimeout`.
   * Inject a manual scheduler in tests for deterministic tick advancement:
   * ```ts
   * let pending: (() => void) | null = null
   * const schedule = (fn: () => void) => { pending = fn }
   * const clock = createClock(ctx, { schedule })
   * clock.start()
   * pending?.() // advance one loop cycle
   * ```
   * SuperCollider or offline backends can pass their own scheduler here.
   */
  readonly schedule?: (fn: () => void, ms: number) => unknown
}

/**
 * A running BPM clock that dispatches tick callbacks on a precise schedule
 * derived from `audioContext.currentTime`.
 */
export type Clock = {
  /** Start the clock from tick 0. No-op if already running. */
  readonly start: () => void
  /** Stop the clock and reset the tick counter. No-op if already stopped. */
  readonly stop: () => void
  /** Update the BPM at any time; takes effect on the next scheduled tick. */
  readonly setBPM: (bpm: number) => void
  /**
   * Register a callback that fires on every scheduled tick.
   * @param callback - Receives the precise audio-context tick time and tick number.
   */
  readonly onTick: (callback: (tickTime: number, tickNumber: number) => void) => void
  /** The most recently scheduled tick number. */
  readonly currentTick: number
  /** The current BPM setting. */
  readonly bpm: number
  /** Whether the clock is currently running. */
  readonly isRunning: boolean
  /** Stop the clock and remove all registered tick callbacks. */
  readonly dispose: () => void
}

/**
 * Minimal interface for an audio rendering context.
 * Compatible with `AudioContext` from the Web Audio API.
 */
export type ClockContext = {
  /** Current audio playback time in seconds. */
  readonly currentTime: number
}

/**
 * Internal mutable state for {@link createClock}.
 * `const` binding — the object identity never changes, only its properties.
 * Property mutation is the hardware-boundary exception (engine layer only).
 */
type ClockState = {
  bpm: number
  tickDuration: number
  running: boolean
  tick: number
  nextTickTime: number
  timerId: unknown
}

/**
 * Create a BPM-aware tick clock backed by `audioContext.currentTime`.
 *
 * The clock uses the standard Web Audio double-buffering pattern: a
 * `setTimeout` loop fires every `lookaheadMs` milliseconds and pre-schedules
 * all ticks that fall within the next `scheduleAheadSec` window.  Callbacks
 * receive the *exact* scheduled audio time rather than the wall-clock time of
 * the `setTimeout` callback, so downstream nodes can call
 * `audioParam.setValueAtTime(value, tickTime)` without jitter.
 *
 * @param context - An object exposing `currentTime` (e.g. `AudioContext`).
 * @param props   - Optional configuration (BPM, subdivisions, lookahead).
 * @returns A {@link Clock} instance.
 *
 * @example
 * ```ts
 * const ctx = new AudioContext()
 * const clock = createClock(ctx, { bpm: 140, ticksPerBeat: 4 })
 * clock.onTick((tickTime, tickNumber) => {
 *   osc.frequency.setValueAtTime(440, tickTime)
 * })
 * clock.start()
 * ```
 */
export const createClock = (context: ClockContext, props?: ClockProps): Clock => {
  const ticksPerBeat = props?.ticksPerBeat ?? 4
  const lookaheadMs = props?.lookaheadMs ?? 25
  const scheduleAheadSec = props?.scheduleAheadSec ?? 0.1
  const scheduleFn = props?.schedule ?? ((fn: () => void, ms: number) => setTimeout(fn, ms))

  // Single mutable state object — const binding, property mutation only
  const state: ClockState = {
    bpm: props?.bpm ?? 120,
    tickDuration: 60 / ((props?.bpm ?? 120) * ticksPerBeat),
    running: false,
    tick: 0,
    nextTickTime: 0,
    timerId: null,
  }

  // Callback registry — const array; push is the unavoidable event-system boundary.
  const callbacks: Array<(tickTime: number, tickNumber: number) => void> = []

  const schedule = (): void => {
    while (state.nextTickTime < context.currentTime + scheduleAheadSec) {
      const currentTickNumber = state.tick
      const currentTickTime = state.nextTickTime
      for (const cb of callbacks) {
        cb(currentTickTime, currentTickNumber)
      }
      state.tick += 1
      state.nextTickTime += state.tickDuration
    }
  }

  const loop = (): void => {
    if (!state.running) return
    schedule()
    state.timerId = scheduleFn(loop, lookaheadMs)
  }

  const clock: Clock = {
    start: (): void => {
      if (state.running) return
      state.running = true
      state.nextTickTime = context.currentTime
      state.tick = 0
      loop()
    },

    stop: (): void => {
      if (state.timerId !== null) {
        clearTimeout(state.timerId as ReturnType<typeof setTimeout>)
      }
      state.running = false
      state.tick = 0
      state.timerId = null
    },

    setBPM: (bpm: number): void => {
      state.bpm = bpm
      state.tickDuration = 60 / (bpm * ticksPerBeat)
    },

    onTick: (callback: (tickTime: number, tickNumber: number) => void): void => {
      callbacks.push(callback)
    },

    get currentTick() { return state.tick },
    get bpm() { return state.bpm },
    get isRunning() { return state.running },

    dispose: (): void => {
      clock.stop()
      callbacks.length = 0
    },
  }

  return clock
}
