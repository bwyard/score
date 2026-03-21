// DSL pattern modifiers — drift and keepFor
// These operate on note-name patterns and sit at the DSL level (not engine layer).
//
// drift()   — slowly wanders note pitch around a center using an OU process
// keepFor() — locks a pattern to the same bar evaluation for N bars

import { createOUProcess } from '@score/math'
import type { PatternFn, PatternInput } from '@score/pattern'
import { resolvePattern } from '@score/pattern'

// ── Note transpose helper ─────────────────────────────────────────────────────

/** Note letters in semitone order, sharps preferred. */
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/**
 * Convert a note name to MIDI number (C4 = 60).
 * Returns -1 on invalid input.
 */
const noteToMidi = (note: string): number => {
  const m = /^([A-G])(#|b)?(-?\d+)$/.exec(note)
  if (!m) return -1
  const letter = m[1] as string
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0
  const octave = parseInt(m[3] as string, 10)
  const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  return (octave + 1) * 12 + (semitones[letter] ?? 0) + acc
}

/**
 * Convert a MIDI number to a note name (sharps preferred, C4 = 60).
 */
const midiToNote = (midi: number): string => {
  const octave = Math.floor(midi / 12) - 1
  const semitone = ((midi % 12) + 12) % 12
  return `${CHROMATIC[semitone] ?? 'C'}${String(octave)}`
}

/**
 * Transpose a note name by `semitones` steps.
 * If the note is invalid (e.g. `0` coerced to string), returns the input unchanged.
 */
const transpose = (note: string, semitones: number): string => {
  const midi = noteToMidi(note)
  if (midi < 0) return note
  return midiToNote(midi + semitones)
}

// ── drift ─────────────────────────────────────────────────────────────────────

/**
 * Slowly drift note pitches around a center note using an Ornstein-Uhlenbeck process.
 *
 * Each bar, the OU process advances one step and returns a semitone offset.
 * All steps within the same bar share the same offset, keeping the pitch coherent.
 * The process is mean-reverting — it always gravitates back toward `center`.
 *
 * This is a stateful generator (hardware-boundary exception), not a pure function.
 * The same drift instance should be shared across a song, not recreated per bar.
 *
 * @param center - The home note (e.g. `'A4'`). The process gravitates toward this pitch.
 * @param sigma - Volatility in semitones. `1` = subtle, `3` = wide drift. Default: `2`.
 * @param theta - Mean reversion speed. `0.3` = slow wander, `1.0` = snaps back fast. Default: `0.3`.
 * @returns A `PatternFn<string>` that emits transposed note names.
 *
 * @example
 * ```ts
 * // Bass line that wanders ±2 semitones around A2
 * const bassPattern = drift('A2', 2, 0.3)
 * const bass = Synth({ wave: 'sawtooth', pattern: bassPattern })
 * ```
 *
 * @see {@link keepFor} — lock a pattern for N bars
 */
export const drift = (center: string, sigma = 2, theta = 0.3): PatternFn<string> => {
  const ou = createOUProcess(theta, 0, sigma)
  // Hardware-boundary exception: sequential OU generator carries step state
  const state = { lastBar: -1, offset: 0 }

  return (_step: number, bar: number): string => {
    if (bar !== state.lastBar) {
      state.offset = Math.round(ou.next(0.1))
      state.lastBar = bar
    }
    return transpose(center, state.offset)
  }
}

// ── keepFor ───────────────────────────────────────────────────────────────────

/**
 * Lock a pattern to the same bar evaluation for `bars` consecutive bars.
 *
 * Useful in live coding to "freeze" a pattern that uses bar-varying functions
 * (`every`, `degrade`, `drift`) so it holds steady before the next variation.
 * Every `bars`-bar block evaluates the inner pattern at the same fixed bar anchor.
 *
 * @param bars - Number of bars to hold the same pattern evaluation. Must be ≥ 1.
 * @param pattern - Source pattern (array or step function).
 * @returns A step function that repeats the same bar-evaluation for `bars` bars.
 *
 * @example
 * ```ts
 * // Hold the same random degraded pattern for 4 bars before it rerolls
 * const hat = HiHat({ pattern: keepFor(4, degrade(0.3, [1, 1, 1, 1])) })
 *
 * // Lock a drift pattern in place for 8 bars
 * const bass = Synth({ pattern: keepFor(8, drift('A2', 2)) })
 * ```
 *
 * @see {@link drift} — slowly evolving pitch patterns
 */
export const keepFor = <T>(bars: number, pattern: PatternInput<T>): PatternFn<T> =>
  (step: number, bar: number): T => {
    const frozenBar = Math.floor(bar / bars) * bars
    const len = Array.isArray(pattern) ? pattern.length : 16
    const arr = resolvePattern(pattern, len, frozenBar)
    return arr[step % arr.length] as T
  }
