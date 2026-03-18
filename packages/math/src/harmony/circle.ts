// Circle of fifths — navigating harmonic space by fifths intervals

const CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'] as const

/**
 * Return the note name at position n on the circle of fifths.
 *
 * The circle of fifths arranges the 12 Western pitch classes by ascending
 * perfect fifths. Adjacent positions are harmonically "close" — useful for
 * generating key sequences, chord progressions, or modulations that feel
 * smooth and connected. Moving by +1 = up a fifth, -1 = down a fifth (up a fourth).
 *
 * Position 0 = C, 1 = G, 2 = D, and so on clockwise.
 * Wraps at 12: `circleOfFifths(12) === circleOfFifths(0)`.
 * Negative values wrap backwards: `circleOfFifths(-1)` = F (the fifth below C).
 *
 * @param n - Position on the circle (any integer, wraps mod 12).
 * @returns Note name at that position as a string.
 *
 * @example
 * ```ts
 * circleOfFifths(0)   // → 'C'
 * circleOfFifths(1)   // → 'G'
 * circleOfFifths(7)   // → 'C#'
 * circleOfFifths(13)  // → 'G'  (wraps)
 * circleOfFifths(-1)  // → 'F'  (negative wraps)
 *
 * // Generate a chord progression moving clockwise by fifths
 * const progression = [0, 1, 4, 0].map(circleOfFifths)  // C G E C
 *
 * // Modulate through the circle over 12 bars
 * const keys = Array.from({ length: 12 }, (_, i) => circleOfFifths(i))
 * ```
 *
 * @see {@link just} — tuning ratios relative to C4
 * @see {@link pythagorean} — pure fifth tuning built from this same interval
 */
export const circleOfFifths = (n: number): string =>
  CIRCLE[((n % 12) + 12) % 12] as string
