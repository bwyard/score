/** A step pattern — either a static array of values or a generator function. */
export type PatternInput<T = number> = T[] | Pattern<T>

/**
 * A generator function that produces a step value on demand.
 *
 * @param step - The current step index (0-based, wrapping at the sequencer's `steps` count).
 * @param bar  - The current bar number from the transport position.
 */
export type Pattern<T> = (step: number, bar: number) => T

/** The playback state of a {@link Transport}. */
export type TransportState = 'stopped' | 'playing' | 'paused'

/**
 * A snapshot of the current bar-beat-tick playhead position.
 * All fields are zero-indexed.
 */
export type Position = { bar: number; beat: number; tick: number; time: number }

/** Global swing configuration. `amount` is clamped 0–1 (0 = straight, 1 = full triplet). */
export type SwingConfig = { amount: number }
