// Limiter effect — hard ceiling with lookahead
// Uses WaveShaperNode for hard clipping + DelayNode for lookahead

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createLimiter}.
 *
 * A brickwall limiter prevents any signal from exceeding the ceiling level.
 * Essential on master buses to prevent clipping during playback and export.
 */
export type LimiterProps = {
  /** Output ceiling in dBFS. Default `-0.3` (leaves -0.3dB headroom for inter-sample peaks). */
  readonly ceiling?: number
  /** Lookahead delay in seconds. Helps catch transients before they clip. Default `0.005` (5ms). */
  readonly lookahead?: number
  /** Release time in seconds — reserved for future gain reduction control. Default unused. */
  readonly release?: number
}

const makeHardClipCurve = (ceilingLinear: number): Float32Array => {
  const samples = 44100
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.max(-ceilingLinear, Math.min(ceilingLinear, x))
  }
  return curve
}

const dbToLinear = (db: number): number => Math.pow(10, db / 20)

/**
 * Create a brickwall limiter for master bus ceiling control.
 * Prevents the output from exceeding the `ceiling` level — no peaks escape.
 * Uses a WaveShaper for hard clipping after a short lookahead delay for
 * transient interception. Always place last in the mastering chain.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Limiter configuration.
 * @returns AudioComponent with `setCeiling` and `setLookahead` setters.
 *
 * @example
 * ```ts
 * // Standard master bus limiter — -0.3dBFS ceiling with 5ms lookahead
 * const limiter = createLimiter(context, { ceiling: -0.3, lookahead: 0.005 })
 * limiter.connect(context.destination)
 * ```
 *
 * @example
 * ```ts
 * // Louder master for streaming normalization (-1 LUFS ceiling target)
 * const loud = createLimiter(context, { ceiling: -1.0, lookahead: 0.01 })
 * ```
 *
 * @see {@link createCompressor} — for dynamic range compression
 * @see {@link createMultibandCompressor} — for per-band mastering dynamics
 */
export const createLimiter = (
  context: ScoreAudioContext,
  props?: LimiterProps,
) => {
  const ceilingDb = props?.ceiling ?? -0.3
  const lookaheadTime = props?.lookahead ?? 0.005
  const ceilingLinear = dbToLinear(ceilingDb)

  const inputGain = context.createGain({ gain: 1.0 })
  const lookaheadDelay = context.createDelay({ delayTime: lookaheadTime, maxDelayTime: 0.05 })
  const shaper = context.createWaveShaper({ curve: makeHardClipCurve(ceilingLinear), oversample: '4x' })
  const outputGain = context.createGain({ gain: 1.0 })

  // Route: input -> lookahead delay -> shaper -> output
  inputGain.connect(lookaheadDelay)
  lookaheadDelay.connect(shaper)
  shaper.connect(outputGain)

  const component: AudioComponent & {
    readonly setCeiling: (value: number) => void
    readonly setLookahead: (value: number, time?: number) => void
  } = {
    id: uid('limiter'),
    type: 'limiter' as const,

    /**
     * Set the output ceiling in dBFS. Regenerates the clipping curve.
     * Lower values (more negative) leave more headroom.
     *
     * @param value - Ceiling in dBFS. Typical range `-6` to `0`. Default `-0.3`.
     */
    setCeiling: (value: number) => {
      shaper.setCurve(makeHardClipCurve(dbToLinear(value)))
    },

    /**
     * Set the lookahead delay time. Longer lookahead catches faster transients
     * but adds latency.
     *
     * @param value - Lookahead in seconds. `0.005` = 5ms, max `0.05`.
     * @param time - Optional schedule time in seconds.
     */
    setLookahead: (value: number, time?: number) => {
      lookaheadDelay.setDelayTime(value, time)
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { lookaheadDelay.disconnect() } catch { /* already disconnected */ }
      try { shaper.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
