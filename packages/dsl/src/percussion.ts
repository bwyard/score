// percussion.ts — Percussion instrument factories for @score/dsl
//
// All factories return ChainablePart via createPart().
// Model aliases (Kick808, Kick909, etc.) are thin wrappers: Kick().model('808').
// Old InstrumentDescriptor factories remain in instruments.ts as deprecated stubs.

import { createPart }         from './chain.js'
import { euclidean }          from '@score/pattern'
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
 * @returns A `ChainablePart` for `'kick808'`. Equivalent to `Kick(hits).model('808')`.
 *
 * @example
 * ```ts
 * // Classic 808 four-on-the-floor
 * const kick = Kick808().volume(0.9).decay(0.7)
 * // Euclidean 808 pattern
 * const kick = Kick808(5).swing(0.1)
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
 * @returns A `ChainablePart` for `'kick909'`. Equivalent to `Kick(hits).model('909')`.
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
 * @returns A `ChainablePart` for `'hihat808'`. Equivalent to `HiHat(hits).model('808')`.
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
 * Roland TR-808 open hi-hat — same six detuned square oscillators as {@link Hihat808}
 * but with a longer default decay (0.3 s) giving the sustained, washy open-hat sound.
 * Sugar for `HiHat(hits).model('808').open()`.
 *
 * @param hits - Optional euclidean hit count (1–16). Sets `_pattern` via `euclidean(hits, 16)`.
 * @returns A `ChainablePart` for `'hihatopen808'`. Equivalent to `HiHat(hits).model('808').open()`.
 *
 * @example
 * ```ts
 * const openHat = HihatOpen808().pattern([0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0]).volume(0.6)
 * // Equivalent:
 * const openHat = HiHat().model('808').open().pattern([0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0]).volume(0.6)
 * ```
 *
 * @see {@link Hihat808} — closed variant
 * @see {@link HiHat} — base hi-hat factory
 */
export const HihatOpen808 = (hits?: number): ChainablePart => HiHat(hits).model('808').open()

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

// ── Clap909 ───────────────────────────────────────────────────────────────────

/**
 * Roland TR-909-style clap — four staggered white-noise bursts through a tight bandpass.
 *
 * @param hits - Optional euclidean hit count (1–16). Sets `_pattern` via `euclidean(hits, 16)`.
 *   Omit for the engine default (beats 2 and 4).
 * @returns A `ChainablePart` for `'clap909'`.
 *
 * @example
 * ```ts
 * const clap = Clap909().volume(0.8)
 * ```
 */
export const Clap909 = (hits?: number): ChainablePart =>
  createPart({
    instrumentType: 'clap909',
    props: {},
    ...(hits !== undefined ? { _pattern: euclidean(hits, 16) } : {}),
  })

// ── KickHardstyle ─────────────────────────────────────────────────────────────

/**
 * Hardstyle kick — sine body with reverse-bass pitch envelope (sweeps UP then falls)
 * through a tanh waveshaper for the characteristic hard, warm distortion.
 *
 * @param hits - Optional euclidean hit count (1–16). Sets `_pattern` via `euclidean(hits, 16)`.
 *   Omit for the engine default (4-on-the-floor).
 * @returns A `ChainablePart` for `'kickHardstyle'`.
 *
 * @example
 * ```ts
 * const kick = KickHardstyle().volume(0.95)
 * ```
 */
export const KickHardstyle = (hits?: number): ChainablePart =>
  createPart({
    instrumentType: 'kickHardstyle',
    props: {},
    ...(hits !== undefined ? { _pattern: euclidean(hits, 16) } : {}),
  })

// ── KickHardcore ─────────────────────────────────────────────────────────────

/**
 * Hardcore/gabber kick — short punchy sine body hard-clipped to near square wave.
 * Short decay (0.25 s default) built for 160–200 BPM gabber tempos.
 *
 * @param hits - Optional euclidean hit count (1–16). Sets `_pattern` via `euclidean(hits, 16)`.
 *   Omit for the engine default (4-on-the-floor).
 * @returns A `ChainablePart` for `'kickHardcore'`.
 *
 * @example
 * ```ts
 * const kick = KickHardcore().volume(0.9)
 * ```
 */
export const KickHardcore = (hits?: number): ChainablePart =>
  createPart({
    instrumentType: 'kickHardcore',
    props: {},
    ...(hits !== undefined ? { _pattern: euclidean(hits, 16) } : {}),
  })
