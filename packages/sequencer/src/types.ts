/** A step pattern — either a static array of values or a generator function. */
export type PatternInput<T = number> = T[] | Pattern<T>

/**
 * A generator function that produces a step value on demand.
 *
 * @param step - The current step index (0-based, wrapping at the sequencer's `steps` count).
 * @param bar  - The current bar number from the transport position.
 * @param seed - Optional song seed, passed from `StepSequencerProps.seed` for deterministic stochastic patterns.
 */
export type Pattern<T> = (step: number, bar: number, seed?: number) => T

/** The playback state of a {@link Transport}. */
export type TransportState = 'stopped' | 'playing' | 'paused'

/**
 * A snapshot of the current bar-beat-tick playhead position.
 * All fields are zero-indexed.
 */
export type Position = { bar: number; beat: number; tick: number; time: number }

/** Global swing configuration. `amount` is clamped 0–1 (0 = straight, 1 = full triplet). */
export type SwingConfig = { amount: number }

/**
 * Canonical temporal snapshot passed to all real-time consumers (canvas themes, annotation
 * sources, GUI hooks). Replaces loose step/bar/bpm fields — one type, one import.
 *
 * Per ADR 027: `@score/sequencer` is the source of truth for time. All consumers import
 * `TemporalTick` from here; `@score/conductor` is a future seam that will eventually own this.
 *
 * @example
 * ```ts
 * const tick: TemporalTick = { step: 4, bar: 1, beat: 0, bpm: 128, time: 1.5, stepCount: 16 }
 * ```
 */
export type TemporalTick = {
  /** Current sequencer step (0-based, wraps at stepCount). */
  readonly step:      number
  /** Current bar number (0-based). */
  readonly bar:       number
  /** Current beat within bar (0-based). */
  readonly beat:      number
  /** Current BPM. */
  readonly bpm:       number
  /** Absolute playback time in seconds. */
  readonly time:      number
  /** Total step count for the current pattern (default 16). */
  readonly stepCount: number
}
