// Wolfram elementary cellular automata
// 256 possible rules (0-255) define how each cell updates based on its 3-cell neighbourhood
// Rule 30 produces highly random-looking output; Rule 90 produces a Sierpinski triangle

import { ScoreError } from '@score/core'

/**
 * Look up the next state of a cell given the Wolfram rule number and the
 * three-cell neighbourhood (left, center, right).
 */
const applyRule = (rule: number, left: number, center: number, right: number): number => {
  // The 3-bit pattern encodes the neighbourhood as a number 0-7
  const pattern = (left << 2) | (center << 1) | right
  return (rule >> pattern) & 1
}

/**
 * Run a Wolfram elementary cellular automaton and return every generation.
 *
 * Each cell's next state depends on its own state and its two immediate
 * neighbours, encoded as a 3-bit number (0–7). The `rule` parameter selects
 * which of the 256 possible update functions to use — a lookup table for all
 * 8 neighbourhood configurations.
 *
 * Notable rules:
 * - **Rule 30** — highly chaotic, used in Mathematica's random number generator
 * - **Rule 90** — Sierpinski triangle (XOR of left and right neighbours)
 * - **Rule 110** — proven Turing complete
 * - **Rule 0** — all cells die immediately
 * - **Rule 255** — all cells become 1 immediately
 *
 * @param rule - Wolfram rule number in [0, 255].
 * @param width - Number of cells per row. Must be ≥ 1.
 * @param generations - Number of rows to generate (including the seed row). Must be ≥ 1.
 * @param seed - Initial cell state. Default: single `1` in the center cell.
 * @returns 2D array `[generation][cell]` of `0`s and `1`s, with `generations` rows.
 * @throws `ScoreError` if `rule < 0`, `rule > 255`, `width < 1`, or `generations < 1`.
 *
 * @example
 * ```ts
 * // Rule 30, 16 cells wide, 8 generations
 * const grid = wolframCA(30, 16, 8)
 * // grid[0] → seed row (single 1 in center)
 * // grid[7] → 8th generation
 *
 * // Use the center column of rule 30 as a random bit stream
 * const bits = wolframCA(30, 64, 64).map(row => row[32])
 * ```
 */
export const wolframCA = (
  rule: number,
  width: number,
  generations: number,
  seed?: number[],
): number[][] => {
  if (rule < 0 || rule > 255) {
    throw ScoreError('wolframCA: rule must be in [0, 255]', {
      received: rule,
      fix: 'Pass an integer rule in [0, 255]. Try rule 30 for chaos, rule 90 for Sierpinski.',
      docs: 'https://en.wikipedia.org/wiki/Elementary_cellular_automaton',
      code: 'WOLFRAM_INVALID_RULE',
    })
  }
  if (width < 1) {
    throw ScoreError('wolframCA: width must be ≥ 1', {
      received: width,
      fix: 'Pass width ≥ 1.',
      docs: 'https://en.wikipedia.org/wiki/Elementary_cellular_automaton',
      code: 'WOLFRAM_INVALID_WIDTH',
    })
  }
  if (generations < 1) {
    throw ScoreError('wolframCA: generations must be ≥ 1', {
      received: generations,
      fix: 'Pass generations ≥ 1.',
      docs: 'https://en.wikipedia.org/wiki/Elementary_cellular_automaton',
      code: 'WOLFRAM_INVALID_GENERATIONS',
    })
  }

  // Build initial row
  const initialRow: number[] = seed
    ? seed.slice(0, width).concat(Array(Math.max(0, width - seed.length)).fill(0))
    : Array.from({ length: width }, (_, i) => (i === Math.floor(width / 2) ? 1 : 0))

  // Pure reduce — each generation is derived from the previous row, no push, no let loops
   
  return (Array.from({ length: generations - 1 })).reduce<number[][]>(
    (acc) => {
      const prev = acc[acc.length - 1]!
      const next = Array.from({ length: width }, (_, c) => {
        const left = prev[(c - 1 + width) % width]!
        const center = prev[c]!
        const right = prev[(c + 1) % width]!
        return applyRule(rule, left, center, right)
      })
      return [...acc, next]
    },
    [initialRow],
  )
}

/**
 * Extract a single generation row from a Wolfram rule 30 automaton.
 *
 * Convenience wrapper around {@link wolframCA} using rule 30 with a 64-cell
 * width and a center seed. Rule 30 is Wolfram's canonical source of
 * pseudorandomness and is highly chaotic even from a single-cell seed.
 *
 * @param rule - Wolfram rule number in [0, 255]. Default `30`.
 * @param generation - Which generation row to extract (0-indexed). Default `0`.
 * @returns Array of `64` cells (`0`s and `1`s) at the requested generation.
 *
 * @example
 * ```ts
 * // The 8th generation of rule 30
 * const row = wolframRow(30, 8)
 * // → 64-element array of 0s and 1s
 *
 * // Use as a velocity pattern
 * const vels = wolframRow(30, 4).slice(0, 16).map(b => b * 0.8 + 0.2)
 * ```
 */
export const wolframRow = (rule = 30, generation = 0): number[] => {
  const width = 64
  const gens = Math.max(1, generation + 1)
  const grid = wolframCA(rule, width, gens)
  return grid[generation] ?? grid[grid.length - 1]!
}
