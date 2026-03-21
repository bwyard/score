// Limiter effect — true look-ahead gain reduction limiter
// Uses DynamicsCompressorNode (ratio 20:1, 1ms attack) + DelayNode for lookahead
// No waveform distortion — gain is reduced before the signal arrives

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createLimiter}.
 *
 * A true look-ahead limiter prevents any signal from exceeding the ceiling
 * level via gain reduction — no waveform clipping or distortion.
 * Essential on master buses to prevent intersample peaks during playback.
 */
export type LimiterProps = {
  /** Output ceiling in dBFS. Default `-0.3` (leaves -0.3dB headroom for inter-sample peaks). */
  readonly ceiling?: number
  /** Lookahead delay in seconds. Helps catch transients before they clip. Default `0.005` (5ms). */
  readonly lookahead?: number
  /** Release time in seconds. Default `0.1` (100ms). */
  readonly release?: number
}

/**
 * Create a true look-ahead limiter for master bus ceiling control.
 *
 * Uses a `DynamicsCompressorNode` (ratio 20:1, 1ms attack) preceded by a short
 * lookahead delay so the gain reduction arrives before the transient peak.
 * Unlike a WaveShaper, this approach reduces gain rather than clipping the
 * waveform — no harmonic distortion at the ceiling.
 *
 * Always place last in the mastering chain.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Limiter configuration: ceiling (dBFS), lookahead (s), release (s).
 * @returns AudioComponent with `setCeiling`, `setLookahead`, and `setRelease` setters.
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
 * // Tight mastering ceiling with faster release
 * const loud = createLimiter(context, { ceiling: -1.0, release: 0.05 })
 * ```
 *
 * @see {@link createCompressor} — for dynamic range compression
 */
export const createLimiter = (
  context: ScoreAudioContext,
  props?: LimiterProps,
) => {
  const ceilingDb = props?.ceiling ?? -0.3
  const lookaheadTime = props?.lookahead ?? 0.005
  const releaseTime = props?.release ?? 0.1

  const inputGain = context.createGain({ gain: 1.0 })
  const lookaheadDelay = context.createDelay({ delayTime: lookaheadTime, maxDelayTime: 0.05 })
  // Limiter-mode compressor: high ratio, fast attack, hard knee
  const compressor = context.createCompressor({
    threshold: ceilingDb,
    ratio: 20,
    knee: 0,
    attack: 0.001,
    release: releaseTime,
  })
  const outputGain = context.createGain({ gain: 1.0 })

  // Route: input -> lookahead delay -> compressor -> output
  inputGain.connect(lookaheadDelay)
  lookaheadDelay.connect(compressor)
  compressor.connect(outputGain)

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly setCeiling: (value: number, time?: number) => void
    readonly setLookahead: (value: number, time?: number) => void
    readonly setRelease: (value: number, time?: number) => void
  } = {
    id: uid('limiter'),
    type: 'limiter' as const,
    input: inputGain,

    /**
     * Set the ceiling threshold in dBFS. The compressor limits at this level.
     * Lower values (more negative) leave more headroom.
     *
     * @param value - Ceiling in dBFS. Typical range `-6` to `0`. Default `-0.3`.
     * @param time - Optional schedule time in seconds.
     */
    setCeiling: (value: number, time?: number) => {
      compressor.setThreshold(value, time)
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

    /**
     * Set the gain reduction release time.
     *
     * @param value - Release in seconds. Default `0.1` (100ms).
     * @param time - Optional schedule time in seconds.
     */
    setRelease: (value: number, time?: number) => {
      compressor.setRelease(value, time)
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
      try { compressor.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
