// live.ts — Global side-effecting commands for Score Live mode
//
// In Live mode, all @score/dsl exports are auto-injected into scope.
// These global commands affect ALL currently-playing slots at the next bar boundary.
// They are side-effecting (dispatch to the engine's global state).
//
// Song files do NOT import from this module — these are live session only.
// The GUI evaluates live sessions with this module's exports in scope.
//
// Current stub: dispatches log messages until the engine global-state wiring lands
// (engine signal coord item: "Song chain: .swing() .groove() .keyChange() .tempoRamp()").

import type { EffectDescriptor } from '@score/core'
import type { ChainablePart } from './chain.js'

// ── Engine dispatch stub ──────────────────────────────────────────────────────
// BOUNDARY — IO: live mode state changes. Real engine wiring in engine signal coord.

const dispatch = (command: string, payload: unknown): void => {
  // BOUNDARY — IO: live mode command → engine global state
  // Stub: log for now. Engine wiring replaces this in engine signal coord PR.
  console.log(`[Score Live] ${command}:`, payload)
}

// ── Tempo / key / meter ──────────────────────────────────────────────────────

/**
 * Set global tempo — all slots follow at next bar boundary.
 *
 * @example
 * ```ts
 * bpm(140)   // all slots change to 140 BPM
 * ```
 */
export const bpm = (n: number): void => {
  dispatch('bpm', n)
}

/**
 * Set global key — scale-aware parts follow at next bar boundary.
 *
 * @example
 * ```ts
 * key('Am')  // all scale-aware parts shift to A minor
 * ```
 */
export const key = (k: string): void => {
  dispatch('key', k)
}

/**
 * Set global time signature — e.g. `'4/4'`, `'7/8'`, `'3/4'`.
 *
 * @example
 * ```ts
 * meter('7/8')
 * ```
 */
export const meter = (sig: string): void => {
  dispatch('meter', sig)
}

// ── Global groove / feel ─────────────────────────────────────────────────────

/**
 * Apply a groove template to all slots globally.
 *
 * @param g - GrooveDescriptor or built-in name (e.g. `'shuffle'`, `'swing16'`).
 *
 * @example
 * ```ts
 * groove('shuffle')
 * groove(GrooveShuffle)
 * ```
 */
export const groove = (g: Record<string, unknown> | string): void => {
  dispatch('groove', g)
}

/**
 * Set global swing (0–1) applied to all off-beats.
 *
 * @example
 * ```ts
 * swing(0.1)   // subtle shuffle
 * swing(0.5)   // heavy swing
 * ```
 */
export const swing = (amount: number): void => {
  dispatch('swing', amount)
}

// ── Loop structure ────────────────────────────────────────────────────────────

/**
 * Set global loop length in bars.
 *
 * @example
 * ```ts
 * bars(32)  // loop every 32 bars
 * ```
 */
export const bars = (n: number): void => {
  dispatch('bars', n)
}

// ── Seed ─────────────────────────────────────────────────────────────────────

/**
 * Set global stochastic seed — all stochastic parts use this seed.
 *
 * @example
 * ```ts
 * seed(42)     // deterministic seed
 * seed(seed()) // new random seed (logged for replay)
 * ```
 */
export const seed = (n: number): void => {
  dispatch('seed', n)
}

// ── Master chain ─────────────────────────────────────────────────────────────

/**
 * Set master effects chain on the main output.
 *
 * @example
 * ```ts
 * import { Compressor, Limiter } from '@score/dsl'
 * master([Compressor(), Limiter()])
 * ```
 */
export const master = (effects: EffectDescriptor[]): void => {
  dispatch('master', effects)
}

// ── Monitoring ────────────────────────────────────────────────────────────────

/**
 * Toggle metronome click.
 */
export const click = (): void => {
  dispatch('click', true)
}

/**
 * Enable session seed logging — all seeds stored with timestamps.
 * Session file: `.score/sessions/YYYY-MM-DDTHH-MM.seeds.json`.
 */
export const logSeeds = (): void => {
  dispatch('logSeeds', true)
}

// ── DJ commands ───────────────────────────────────────────────────────────────

/**
 * Crossfade from slot/group `a` to slot/group `b` over `time` bars.
 *
 * @param a - Source slot name or ChainablePart.
 * @param b - Target slot name or ChainablePart.
 * @param time - Crossfade duration in bars. Default `1`.
 *
 * @example
 * ```ts
 * crossfade('kick-a', 'kick-b', 2)   // crossfade kick variants over 2 bars
 * ```
 */
export const crossfade = (a: string | ChainablePart, b: string | ChainablePart, time = 1): void => {
  dispatch('crossfade', { a, b, time })
}

/**
 * Route a slot to the cue bus (pre-listen before fading in).
 *
 * @param slot - Slot name or ChainablePart to pre-listen.
 *
 * @example
 * ```ts
 * cue('newDrop')   // pre-listen newDrop on headphones
 * ```
 */
export const cue = (slot: string | ChainablePart): void => {
  dispatch('cue', slot)
}

/**
 * Throw a live effect on the master output at the given wet level.
 *
 * @param effect - EffectDescriptor to apply.
 * @param wet - Wet amount 0–1. Default `1`.
 *
 * @example
 * ```ts
 * import { Reverb } from '@score/dsl'
 * fx(Reverb({ wet: 0.8 }), 0.8)   // throw reverb on master
 * ```
 */
export const fx = (effect: EffectDescriptor, wet = 1): void => {
  dispatch('fx', { effect, wet })
}
