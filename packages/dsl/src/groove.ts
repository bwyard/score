// groove.ts — Groove descriptor factory + built-in groove templates for @score/dsl
//
// GrooveDescriptor carries timing offsets and velocity curves across 16 steps.
// The engine applies offsets (in seconds) and velocity multipliers at play time.
// All values are pure data — no AudioContext.

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Groove descriptor — per-step timing offsets and velocity multipliers.
 *
 * `offsets` are in seconds, applied additively to each step's schedule time.
 * `velocities` are multipliers on step amplitude (0.5 = half velocity, 1.5 = accent).
 * Both arrays must be 16 elements (one per step in a standard bar).
 *
 * The engine reads this from `SongDescriptor._groove` and applies it to every
 * part on every step tick.
 */
export type GrooveDescriptor = {
  readonly _type: 'GrooveDescriptor'
  /** Display name, e.g. `'Shuffle'`. */
  readonly name: string
  /** Per-step timing offsets in seconds. 16 values. Positive = late, negative = early. */
  readonly offsets: readonly number[]
  /** Per-step velocity multipliers. 16 values. `1.0` = no change. */
  readonly velocities: readonly number[]
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Define a custom groove template.
 *
 * `offsets` and `velocities` are padded/truncated to 16 steps.
 * Omitting either fills with zeros (offsets) or ones (velocities).
 *
 * @param desc - Groove configuration.
 * @returns A frozen {@link GrooveDescriptor}.
 *
 * @example
 * ```ts
 * // Custom reggae offbeat pocket — slightly late on even steps
 * const GrooveReggae = defineGroove({
 *   name: 'Reggae',
 *   offsets: Array.from({ length: 16 }, (_, i) => i % 2 === 0 ? 0 : 0.015),
 * })
 *
 * export default Song(80, [...]).groove(GrooveReggae)
 * ```
 *
 * @see {@link GrooveShuffle}, {@link GrooveSwing16}, {@link GrooveHipHop}
 */
export const defineGroove = (desc: {
  readonly name: string
  readonly offsets?: readonly number[]
  readonly velocities?: readonly number[]
}): GrooveDescriptor => {
  const pad16 = (arr: readonly number[] | undefined, fill: number): readonly number[] => {
    const src = arr ?? []
    return Array.from({ length: 16 }, (_, i) => src[i] ?? fill)
  }

  return {
    _type: 'GrooveDescriptor',
    name: desc.name,
    offsets: pad16(desc.offsets, 0),
    velocities: pad16(desc.velocities, 1.0),
  }
}

// ── Built-in grooves ──────────────────────────────────────────────────────────

/**
 * Straight groove — all steps on the grid, equal velocity.
 * Equivalent to no groove at all. Use as a reset or default.
 */
export const GrooveStraight = defineGroove({
  name: 'Straight',
})

/**
 * Shuffle groove — odd 16th-note steps are pushed ~30 ms late.
 * Creates a classic swing/shuffle feel on hi-hats and snares.
 * Offset: 0, +0.030s alternating across all 16 steps.
 */
export const GrooveShuffle = defineGroove({
  name: 'Shuffle',
  offsets: Array.from({ length: 16 }, (_, i) => i % 2 === 0 ? 0 : 0.030),
  velocities: Array.from({ length: 16 }, (_, i) => i % 2 === 0 ? 1.0 : 0.85),
})

/**
 * 16th-note swing groove — alternating 16ths pushed forward.
 * Lighter than GrooveShuffle (~20 ms), tighter feel. Good for house and funk.
 */
export const GrooveSwing16 = defineGroove({
  name: 'Swing 16th',
  offsets: Array.from({ length: 16 }, (_, i) => i % 2 === 0 ? 0 : 0.020),
  velocities: Array.from({ length: 16 }, (_, i) => i % 2 === 0 ? 1.0 : 0.9),
})

/**
 * Hip-hop laid-back groove — snare/backbeat slightly late and softer.
 * Steps 4, 5, 12, 13 (around beats 2 and 4) pushed 20–35 ms late.
 * Creates the relaxed behind-the-beat feel of classic boom-bap.
 */
export const GrooveHipHop = defineGroove({
  name: 'Hip-Hop',
  offsets:    [0, 0, 0, 0,  0.020, 0.035, 0, 0,  0, 0, 0, 0,  0.020, 0.035, 0, 0],
  velocities: [1.1, 0.8, 0.9, 0.7,  0.95, 0.8, 0.7, 0.85,  1.0, 0.75, 0.85, 0.7,  0.9, 0.8, 0.75, 0.85],
})

/**
 * Latin groove — clave-influenced timing with accented downbeats.
 * Steps 0, 3, 6, 9, 12 accented (Son clave pattern feel).
 * Off-beats pushed slightly late for a flowing sway.
 */
export const GrooveLatin = defineGroove({
  name: 'Latin',
  offsets:    [0, 0.010, 0, 0,  0.010, 0, 0.015, 0,  0, 0.010, 0, 0,  0.010, 0, 0.015, 0],
  velocities: [1.2, 0.7, 0.85, 1.0,  0.7, 0.9, 1.1, 0.75,  1.0, 0.7, 0.85, 0.9,  0.7, 0.85, 1.1, 0.75],
})

/**
 * MPC-style groove — slightly quantised with subtle velocity humanization.
 * Mimics the natural imprecision of an MPC drum machine with pads.
 * All offsets ≤ 8 ms, velocity variation ±15%.
 */
export const GrooveMPC = defineGroove({
  name: 'MPC',
  offsets:    [0, 0.002, 0.005, 0.001,  0.003, 0.007, 0.002, 0.004,  0.001, 0.006, 0.003, 0.002,  0.005, 0.003, 0.008, 0.001],
  velocities: [1.05, 0.9, 0.95, 0.85,  1.0, 0.88, 0.92, 0.87,  1.02, 0.86, 0.93, 0.89,  0.97, 0.91, 0.88, 0.94],
})
