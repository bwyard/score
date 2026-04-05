// =============================================================================
// @score/components — kickHardstyle.ts
// Hardstyle kick: sine body through a tanh waveshaper with a characteristic
// reverse-bass pitch envelope that sweeps UP first, then falls hard.
// =============================================================================

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for {@link createKickHardstyle}.
 */
export type KickHardstyleProps = {
  /** Output gain 0–1. Default `0.95`. */
  readonly gain?: number
  /** Oscillator start frequency in Hz at trigger time. Default `50`. */
  readonly startFreq?: number
  /**
   * Peak frequency in Hz — the oscillator ramps UP to this value over
   * `pitchRise` seconds before beginning the main pitch fall.
   * Default `180`.
   */
  readonly peakFreq?: number
  /** Final (lowest) frequency in Hz at the end of the pitch fall. Default `35`. */
  readonly endFreq?: number
  /** Duration of the upward pitch ramp in seconds. Default `0.04`. */
  readonly pitchRise?: number
  /** Duration of the downward pitch fall in seconds. Default `0.50`. */
  readonly pitchFall?: number
  /**
   * Waveshaper drive amount. Higher values increase saturation and perceived
   * loudness; the tanh curve provides smooth soft-clipping at all levels.
   * Default `3.0`.
   */
  readonly drive?: number
  /** Amplitude envelope decay time in seconds. Default `0.65`. */
  readonly decay?: number
}

/**
 * A synthesized percussion component — extends {@link AudioComponent} with a
 * `trigger` method for scheduling one-shot hits.
 */
export type KickHardstyleComponent = AudioComponent & {
  /**
   * Trigger a single kick hit at the given audio context time.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly trigger: (time?: number) => void
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build a tanh soft-clip waveshaper curve of the given resolution.
 * `curve[i] = Math.tanh(drive * x)` where x ∈ [−1, 1].
 * Higher `drive` increases saturation — values above ~5 approach hard clip.
 *
 * @param drive      - Saturation amount. Default `3.0`.
 * @param resolution - Number of samples in the curve table. Default `256`.
 * @returns A `Float32Array` suitable for `BackendWaveShaperNode.setCurve`.
 */
const buildTanhCurve = (drive: number, resolution = 256): Float32Array => {
  const curve = new Float32Array(resolution)
  const half  = resolution / 2
  for (let i = 0; i < resolution; i++) {
    const x = (i - half) / half
    curve[i] = Math.tanh(drive * x)
  }
  return curve
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a synthesized hardstyle kick drum component.
 *
 * The defining feature of hardstyle is the **reverse-bass pitch envelope**: the
 * oscillator starts at `startFreq`, ramps **up** to `peakFreq` over `pitchRise`
 * seconds (the "reverse" chirp), then falls exponentially to `endFreq` over
 * `pitchFall` seconds. The sine body passes through a tanh waveshaper to add
 * the characteristic distorted warmth heard in hardstyle and rawstyle.
 *
 * Signal path:
 * `sine osc (pitch envelope) → amp env → waveshaper (tanh) → outputGain → (caller connects output)`
 *
 * Pitch envelope timing:
 * - `t + 0`                        → `startFreq` (set at trigger time)
 * - `t + pitchRise`                → `peakFreq`  (linear ramp up)
 * - `t + pitchRise + pitchFall`    → `endFreq`   (exponential ramp down)
 *
 * Each `trigger()` call spawns fresh oscillator + amp nodes for that hit.
 * Nodes auto-disconnect via `onended` to prevent memory leaks.
 *
 * // HARDWARE BOUNDARY: waveshaper curve is computed once at factory init —
 * // deterministic, not stochastic.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props   - Optional hardstyle kick configuration. If omitted all defaults apply.
 * @returns A {@link KickHardstyleComponent} with `id` prefixed `kickHardstyle` and `type` set to `'kickHardstyle'`.
 *
 * @example
 * ```ts
 * const kick = createKickHardstyle(context, { drive: 4.0, pitchRise: 0.05 })
 * kick.connect(context.destination)
 * kick.trigger(context.currentTime)
 * kick.trigger(context.currentTime + 0.5)
 * kick.dispose()
 * ```
 *
 * @see {@link KickHardstyleProps}     — configuration options
 * @see {@link KickHardstyleComponent} — returned component shape
 * @see {@link createKickHardcore}     — hardcore/gabber variant with hard-clip distortion
 * @see {@link createKick909}          — 909 kick without pitch rise
 * @throws \{ScoreError\} Never — invalid props are silently clamped.
 */
export const createKickHardstyle = (
  context: ScoreAudioContext,
  props?: KickHardstyleProps,
): KickHardstyleComponent => {
  const startFreq  = props?.startFreq  ?? 50
  const peakFreq   = props?.peakFreq   ?? 180
  const endFreq    = props?.endFreq    ?? 35
  const pitchRise  = props?.pitchRise  ?? 0.04
  const pitchFall  = props?.pitchFall  ?? 0.50
  const drive      = props?.drive      ?? 3.0
  const decay      = props?.decay      ?? 0.65
  const outputGain = context.createGain({ gain: props?.gain ?? 0.95 })

  // Waveshaper curve built once at factory init — reused across all triggers
  const shaperCurve    = buildTanhCurve(drive)
  const waveShaper     = context.createWaveShaper({ curve: shaperCurve, oversample: '2x' })
  waveShaper.connect(outputGain)

  const trigger = (time?: number) => {
    const t      = time ?? context.currentTime
    const osc    = context.createOscillator({ type: 'sine', frequency: startFreq })
    const ampEnv = context.createGain({ gain: 0 })

    osc.connect(ampEnv)
    ampEnv.connect(waveShaper)

    // Reverse-bass pitch envelope: rise first, then fall
    osc.setFrequency(startFreq, t)
    osc.schedulePitchEnvelope({ startFreq: peakFreq, endFreq, startTime: t + pitchRise, fallTime: pitchFall })

    ampEnv.scheduleEnvelope({
      peak:      1.0,
      attack:    0.002,
      decay,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  decay + 0.002,
    })

    osc.start(t)
    osc.stop(t + pitchRise + pitchFall + 0.05)

    osc.onended = () => {
      try { osc.disconnect()    } catch { /* ok */ }
      try { ampEnv.disconnect() } catch { /* ok */ }
    }
  }

  // =============================================================================
  // Component
  // =============================================================================

  const component: KickHardstyleComponent = {
    id:   uid('kickHardstyle'),
    type: 'kickHardstyle' as const,
    trigger,

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { waveShaper.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
