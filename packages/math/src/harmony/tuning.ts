// Tuning systems as frequency multiplier tables relative to C4 (261.63 Hz)
// Each function returns Record<string, number> mapping note name → frequency ratio from C4
// Multiply C4 (261.63) by the ratio to get the actual frequency in Hz

/**
 * Just intonation frequency ratios relative to C4.
 *
 * Just intonation uses small integer ratios that align with the natural
 * harmonic series, producing pure, beatless intervals. Chords ring with
 * exceptional clarity — widely used in early music, choir writing, and
 * drone-based electronic music. The trade-off is that the ratios differ
 * per key, so modulation causes pitch shifts.
 *
 * @returns Record mapping note names to frequency ratios from C4 (261.63 Hz).
 *   Multiply a ratio by 261.63 to get the frequency in Hz.
 *   Ratios: C=1, C#=25/24, D=9/8, Eb=6/5, E=5/4, F=4/3, F#=45/32,
 *   G=3/2, Ab=8/5, A=5/3, Bb=9/5, B=15/8.
 *
 * @example
 * ```ts
 * const t = just()
 * t['C']  // → 1       (C4 = 261.63 Hz)
 * t['E']  // → 1.25    (pure major third: 5/4)
 * t['G']  // → 1.5     (pure fifth: 3/2)
 *
 * // Tune a chord to pure just intervals
 * const C4 = 261.63
 * const Emaj = ['C', 'E', 'G'].map(note => C4 * just()[note])
 * ```
 *
 * @see {@link pythagorean} — built from pure fifths only
 * @see {@link meantone} — compromise between pure thirds and pure fifths
 * @see {@link circleOfFifths} — navigating harmonic space
 */
export const just = (): Record<string, number> => ({
  C: 1,
  'C#': 25 / 24,
  D: 9 / 8,
  Eb: 6 / 5,
  E: 5 / 4,
  F: 4 / 3,
  'F#': 45 / 32,
  G: 3 / 2,
  Ab: 8 / 5,
  A: 5 / 3,
  Bb: 9 / 5,
  B: 15 / 8,
})

/**
 * Pythagorean tuning frequency ratios relative to C4.
 *
 * Pythagorean tuning is built entirely from stacked pure fifths (3/2),
 * producing perfectly resonant fifths and fourths. Major thirds are wide
 * (81/64 ≈ 408 cents vs. 386 cents just), giving the system a bright,
 * tense character favoured in medieval music and parallel fifths writing.
 * The "wolf fifth" (between G# and D#) is the accumulated Pythagorean comma.
 *
 * @returns Record mapping note names to frequency ratios from C4 (261.63 Hz).
 *   All intervals derived by stacking pure 3/2 fifths and reducing by octaves.
 *   C=1, C#=2187/2048, D=9/8, E=81/64, F=4/3, G=3/2, A=27/16, B=243/128.
 *
 * @example
 * ```ts
 * const t = pythagorean()
 * t['G']  // → 1.5         (pure fifth: 3/2)
 * t['D']  // → 1.125       (9/8 — two fifths up, octave down)
 * t['A']  // → 1.6875      (27/16)
 *
 * // Wide bright major third characteristic of medieval tuning
 * const C4 = 261.63
 * const wideMajorThird = C4 * pythagorean()['E']  // → ~335 Hz (sharper than just)
 * ```
 *
 * @see {@link just} — pure harmonic ratios for clear chords
 * @see {@link meantone} — tempers the wide thirds for better triads
 */
export const pythagorean = (): Record<string, number> => ({
  C: 1,
  'C#': 2187 / 2048,
  D: 9 / 8,
  E: 81 / 64,
  F: 4 / 3,
  G: 3 / 2,
  A: 27 / 16,
  B: 243 / 128,
})

/**
 * Quarter-comma meantone frequency ratios relative to C4.
 *
 * Quarter-comma meantone tempers each fifth by 1/4 of the syntonic comma
 * (81/80), making major thirds perfectly pure (5/4) at the cost of slightly
 * narrow fifths. Widely used in Renaissance and Baroque keyboard music —
 * the sound of harpsichords and organs of that era. Major thirds glow; the
 * wolf fifth (G#–D#) is the notorious trade-off.
 *
 * @remarks
 * Approximations used: D≈1.1180 (√(5/4)), E=1.25 (5/4 exact),
 * F≈1.3375, G≈1.4953, A≈1.6719, B≈1.8692. These match the standard
 * quarter-comma meantone values to four decimal places.
 *
 * @returns Record mapping note names to frequency ratios from C4 (261.63 Hz).
 *
 * @example
 * ```ts
 * const t = meantone()
 * t['E']  // → 1.25    (pure major third: exactly 5/4)
 * t['G']  // → 1.4953  (slightly narrow fifth)
 *
 * // Warm Renaissance-style major chord
 * const C4 = 261.63
 * const chord = ['C', 'E', 'G'].map(n => C4 * meantone()[n])
 * ```
 *
 * @see {@link just} — rationally pure but key-dependent
 * @see {@link pythagorean} — built from pure fifths, wide thirds
 */
export const meantone = (): Record<string, number> => ({
  C: 1,
  D: 1.1180,
  E: 1.25,
  F: 1.3375,
  G: 1.4953,
  A: 1.6719,
  B: 1.8692,
})

/**
 * 19-tone equal temperament (19-EDO) frequency ratios relative to C4.
 *
 * 19-EDO divides the octave into 19 equal steps, each of 2^(1/19).
 * Major thirds (3 steps of 2^(3/19) ≈ 1.1963) closely approximate pure 5/4,
 * making triads sound noticeably sweeter than 12-EDO. Gives access to
 * micro-intervals and new harmonic colours while remaining playable on
 * retuned keyboards. Popular in experimental and microtonal electronic music.
 *
 * @remarks
 * Chromatic step = 2^(1/19) ≈ 1.03715. The 19 notes are mapped to
 * Western note names with the chromatic scale doubled (C, C#, Db, D, ...).
 * Notes 0–18 span one octave. Note 19 = C one octave up = ratio 2.
 *
 * @returns Record mapping 19-EDO step indices (0–18) to frequency ratios
 *   from C4 (261.63 Hz). Key `0` = C, key `11` = the 12th step (≈ major 7th).
 *
 * @example
 * ```ts
 * const t = edo19()
 * t[0]   // → 1.0         (C4)
 * t[11]  // → 2^(11/19)   (≈ the major 7th in 19-EDO)
 *
 * // Microtonal sweep across 19 steps
 * const C4 = 261.63
 * const scale = Object.values(edo19()).map(r => C4 * r)
 * ```
 *
 * @see {@link edo31} — 31-EDO, even closer to just intonation
 * @see {@link just} — pure rational tuning without equal temperament
 */
export const edo19 = (): Record<string, number> => {
  const step = Math.pow(2, 1 / 19)
  return Object.fromEntries(Array.from({ length: 19 }, (_, i) => [String(i), Math.pow(step, i)]))
}

/**
 * 31-tone equal temperament (31-EDO) frequency ratios relative to C4.
 *
 * 31-EDO divides the octave into 31 equal steps, each of 2^(1/31).
 * An extraordinarily good approximation of just intonation — major thirds
 * are within 1 cent of pure 5/4, minor thirds near-perfect, and the fifth
 * very close to 3/2. Christiaan Huygens described it in 1691. Provides
 * a rich palette of enharmonic distinctions: C# and Db are different pitches.
 *
 * @remarks
 * Chromatic step = 2^(1/31) ≈ 1.02290. Contains 31 distinct pitches per
 * octave, making it the finest resolution tuning in this library. The
 * mapping gives each step index 0–30 a frequency ratio.
 *
 * @returns Record mapping 31-EDO step indices (0–30) to frequency ratios
 *   from C4 (261.63 Hz). Key `0` = C, key `18` ≈ major 7th.
 *
 * @example
 * ```ts
 * const t = edo31()
 * t[0]   // → 1.0           (C4)
 * t[18]  // → 2^(18/31)     (near-pure major 7th)
 *
 * // 31-EDO has more notes than 19-EDO
 * Object.keys(edo31()).length   // → 31
 * Object.keys(edo19()).length   // → 19
 *
 * // Enharmonic distinction: C# (step 5) ≠ Db (step 6)
 * const C4 = 261.63
 * const cSharp = C4 * edo31()[5]
 * const dFlat  = C4 * edo31()[6]
 * ```
 *
 * @see {@link edo19} — 19-EDO with sweeter major thirds
 * @see {@link just} — rational tuning that 31-EDO closely approximates
 */
export const edo31 = (): Record<string, number> => {
  const step = Math.pow(2, 1 / 31)
  return Object.fromEntries(Array.from({ length: 31 }, (_, i) => [String(i), Math.pow(step, i)]))
}
