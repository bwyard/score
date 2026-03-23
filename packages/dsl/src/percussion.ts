// percussion.ts — Percussion instrument factories for @score/dsl
//
// All factories return ChainablePart via createPart().
// Model aliases (Kick808, Kick909, etc.) are thin wrappers: Kick().model('808').
// Old InstrumentDescriptor factories remain in instruments.ts as deprecated stubs.

import { createPart } from './chain.js'
import { euclidean } from '@score/pattern'
import type { ChainablePart } from './chain.js'

// ── Kick ──────────────────────────────────────────────────────────────────────

/**
 * Kick drum factory — sine body with pitch envelope and amplitude decay.
 *
 * @param hits - Optional euclidean hit count (1–16). Sets `_pattern` via `euclidean(hits, 16)`.
 *   Omit for the engine default (4-on-the-floor).
 * @returns A `ChainablePart` for `'kick'`.
 *
 * @example
 * ```ts
 * // 4-on-the-floor kick
 * const kick = Kick().volume(0.9).reverb(0.1)
 * // Euclidean kick — 5 hits spread over 16 steps
 * const kick = Kick(5).swing(0.1)
 * ```
 *
 * @see {@link Kick808} — 808-style sine kick
 * @see {@link Kick909} — 909-style kick with noise click transient
 */
export const Kick = (hits?: number): ChainablePart =>
  createPart({
    instrumentType: 'kick',
    props: {},
    ...(hits !== undefined ? { _pattern: euclidean(hits, 16) } : {}),
  })

// ── Snare ─────────────────────────────────────────────────────────────────────

/**
 * Snare drum factory — noise burst with tone body.
 *
 * @param hits - Optional euclidean hit count (1–16). Sets `_pattern` via `euclidean(hits, 16)`.
 *   Omit for the engine default (beats 2 and 4).
 * @returns A `ChainablePart` for `'snare'`.
 *
 * @example
 * ```ts
 * // Standard backbeat
 * const snare = Snare().volume(0.7)
 * // Euclidean ghost notes — 3 hits over 16 steps
 * const snare = Snare(3).degrade(0.3)
 * ```
 *
 * @see {@link Snare909} — 909-style snare (tone + noise mix)
 */
export const Snare = (hits?: number): ChainablePart =>
  createPart({
    instrumentType: 'snare',
    props: {},
    ...(hits !== undefined ? { _pattern: euclidean(hits, 16) } : {}),
  })

// ── HiHat ─────────────────────────────────────────────────────────────────────

/**
 * Hi-hat factory — metal noise filtered to a closed or open hat timbre.
 *
 * @param hits - Optional euclidean hit count (1–16). Sets `_pattern` via `euclidean(hits, 16)`.
 *   Omit for the engine default (every other 16th note).
 * @returns A `ChainablePart` for `'hihat'`.
 *
 * @example
 * ```ts
 * // Standard 8th-note hi-hat
 * const hat = HiHat(8).volume(0.5)
 * // Euclidean hi-hat rolls — 11 hits over 16 steps
 * const hat = HiHat(11).humanize(0.01)
 * ```
 *
 * @see {@link Hihat808} — 808-style hi-hat (six detuned square oscillators)
 */
export const HiHat = (hits?: number): ChainablePart =>
  createPart({
    instrumentType: 'hihat',
    props: {},
    ...(hits !== undefined ? { _pattern: euclidean(hits, 16) } : {}),
  })

// ── Model aliases ─────────────────────────────────────────────────────────────

/**
 * Roland TR-808 kick drum — pure sine oscillator with pitch envelope and amplitude decay.
 * Sugar for `Kick(hits).model('808')`.
 *
 * @param hits - Optional euclidean hit count (1–16). Passed through to `Kick()`.
 * @returns A `ChainablePart` for `'kick'` with `_model: '808'`.
 *
 * @example
 * ```ts
 * // Classic 808 four-on-the-floor
 * const kick = Kick808().volume(0.9).decay(0.7)
 * // Euclidean 808 pattern
 * const kick = Kick808(5).pumpWith(kick)
 * ```
 *
 * @see {@link Kick} — base kick factory
 * @see {@link Kick909} — 909-style kick with noise click transient
 */
export const Kick808 = (hits?: number): ChainablePart => Kick(hits).model('808')

/**
 * Roland TR-909 kick drum — sine body with a short noise click transient for added punch.
 * Sugar for `Kick(hits).model('909')`.
 *
 * @param hits - Optional euclidean hit count (1–16). Passed through to `Kick()`.
 * @returns A `ChainablePart` for `'kick'` with `_model: '909'`.
 *
 * @example
 * ```ts
 * const kick = Kick909().volume(0.85)
 * ```
 *
 * @see {@link Kick} — base kick factory
 * @see {@link Kick808} — 808-style kick
 */
export const Kick909 = (hits?: number): ChainablePart => Kick(hits).model('909')

/**
 * Roland TR-808 hi-hat — six detuned square oscillators through bandpass + HPF filtering.
 * Sugar for `HiHat(hits).model('808')`.
 *
 * @param hits - Optional euclidean hit count (1–16). Passed through to `HiHat()`.
 * @returns A `ChainablePart` for `'hihat'` with `_model: '808'`.
 *
 * @example
 * ```ts
 * const hat = Hihat808(8).volume(0.5).chokeGroup('hat')
 * const openHat = Hihat808().hits(15).volume(0.4)
 * ```
 *
 * @see {@link HiHat} — base hi-hat factory
 */
export const Hihat808 = (hits?: number): ChainablePart => HiHat(hits).model('808')

/**
 * Roland TR-909 snare drum — two triangle oscillators (tone) mixed with filtered white noise.
 * Sugar for `Snare(hits).model('909')`.
 *
 * @param hits - Optional euclidean hit count (1–16). Passed through to `Snare()`.
 * @returns A `ChainablePart` for `'snare'` with `_model: '909'`.
 *
 * @example
 * ```ts
 * const snare = Snare909().volume(0.75)
 * ```
 *
 * @see {@link Snare} — base snare factory
 */
export const Snare909 = (hits?: number): ChainablePart => Snare(hits).model('909')
