// DSL-level modulation source descriptor factories.
// Pure data — no AudioContext. The engine wires these up at play time.
//
// Musical names are the primary API:
//   .tremolo(4)         → LFO on volume
//   .vibrato(5, 8)      → sine on pitch
//   .wobble(0.5)        → LFO on filter cutoff
//
// .modulate(param, source) is the power escape hatch for everything else.

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Pure data descriptor for a modulation source.
 * Produced by `lfo()`, `sine()`, `ramp()`, `lorenz()`, `ou()`, `logistic()`.
 * The engine reads this at play time and connects the source to the target param.
 */
export type ModulationDescriptor = {
  readonly _type: 'ModulationDescriptor'
  /** Source algorithm identifier. */
  readonly source: 'lfo' | 'sine' | 'ramp' | 'lorenz' | 'ou' | 'logistic'
  /** Source-specific parameters. */
  readonly params: Record<string, unknown>
}

// ── Factories ─────────────────────────────────────────────────────────────────

const mod = (source: ModulationDescriptor['source'], params: Record<string, unknown>): ModulationDescriptor => ({
  _type: 'ModulationDescriptor',
  source,
  params,
})

/**
 * Low-frequency oscillator modulation source.
 * Produces a periodic wave (default: sine) at the given rate.
 *
 * @param rate - Oscillation frequency in Hz. Default `1`.
 * @param depth - Modulation depth 0–1. Default `1`.
 * @param shape - Wave shape. Default `'sine'`.
 *
 * @example
 * ```ts
 * Bass303('C2').modulate('filter', lfo(0.25))   // slow filter sweep
 * Pad('A3').modulate('pan', lfo(0.5, 0.8))      // stereo movement
 * ```
 */
export const lfo = (
  rate = 1,
  depth = 1,
  shape: 'sine' | 'triangle' | 'square' | 'sawtooth' = 'sine',
): ModulationDescriptor => mod('lfo', { rate, depth, shape })

/**
 * Sine wave modulation source — sugar for `lfo(rate, depth, 'sine')`.
 *
 * @param rate - Hz. @param depth - 0–1. @param phaseOffset - radians. Default `0`.
 *
 * @example
 * ```ts
 * Synth('saw', 'C3').modulate('pitch', sine(0.1, 12))  // slow vibrato ±12 Hz
 * ```
 */
export const sine = (rate = 1, depth = 1, phaseOffset = 0): ModulationDescriptor =>
  mod('sine', { rate, depth, phaseOffset })

/**
 * Linear ramp modulation source — rises from 0 to 1 over `bars` bars.
 * Useful for swell buildups, fade-ins, and automation over time.
 *
 * @param bars - Duration of the full ramp in bars. Default `8`.
 * @param loop - When true, resets after `bars`. Default `false`.
 *
 * @example
 * ```ts
 * Kick(4).modulate('volume', ramp(16))   // volume swells over 16 bars
 * ```
 */
export const ramp = (bars = 8, loop = false): ModulationDescriptor =>
  mod('ramp', { bars, loop })

/**
 * Lorenz attractor modulation source — deterministic chaos, never repeats.
 * x/y/z axes produce correlated outputs for multi-param modulation.
 *
 * @param opts - Options: `r` = Rayleigh number / chaos intensity (default `28`),
 *   `sigma` (default `10`), `b` (default `2.667`), `speed` = traversal speed (default `0.01`).
 *
 * @example
 * ```ts
 * Bass303('C2').modulate('filter', lorenz({ r: 28 }).x)
 * Pad('Am').modulate('volume', lorenz({ r: 28 }).y)
 * ```
 */
export const lorenz = (opts?: { r?: number; sigma?: number; b?: number; speed?: number; axis?: 'x' | 'y' | 'z' }): ModulationDescriptor =>
  mod('lorenz', { r: 28, sigma: 10, b: 2.667, speed: 0.01, axis: 'x', ...opts })

/**
 * Ornstein-Uhlenbeck process — stochastic mean-reverting drift.
 * Produces smooth brownian motion that always gravitates back to center.
 * Same process as `drift()` but as a generic modulation source.
 *
 * @param theta - Mean reversion speed. `0.1` = slow, `1.0` = fast snap. Default `0.3`.
 * @param sigma - Volatility / spread. Default `1`.
 *
 * @example
 * ```ts
 * Synth('saw', 'C3').modulate('pan', ou(0.3))  // brownian pan wander
 * ```
 */
export const ou = (theta = 0.3, sigma = 1): ModulationDescriptor =>
  mod('ou', { theta, sigma })

/**
 * Logistic map modulation source — edge-of-chaos sequence via `x → r·x·(1-x)`.
 * At `r` near 4, produces unpredictable but bounded values.
 *
 * @param r - Bifurcation parameter. `3.57` = onset of chaos, `4.0` = fully chaotic. Default `3.9`.
 * @param seed - Initial value (0–1). Default `0.5`.
 *
 * @example
 * ```ts
 * Kick(4).modulate('volume', logistic(3.9))  // chaotic velocity
 * ```
 */
export const logistic = (r = 3.9, seed = 0.5): ModulationDescriptor =>
  mod('logistic', { r, seed })
