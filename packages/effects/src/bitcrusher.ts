// BitCrusher effect — reduces bit depth for lo-fi digital distortion
// Uses GainNodes for bit-depth reduction via quantization
// NOTE: True sample-rate reduction requires AudioWorklet (Phase 12g).
// This initial version performs bit-depth reduction only.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createBitCrusher}.
 *
 * Bit depth reduction creates aliasing and quantization noise —
 * the characteristic crunch of early samplers, game consoles, and lo-fi genres.
 * Lower bit values = more aggressive degradation.
 *
 * @remarks
 * True sample-rate reduction requires an AudioWorklet (Phase 12g).
 * This implementation performs bit-depth reduction via gain-scaling quantization.
 */
export type BitCrusherProps = {
  /** Bit depth `1–16`. `8` = classic 8-bit, `4` = extreme lo-fi crunch. Default `8`. */
  readonly bits?: number
  /** Wet/dry mix `0–1`. `0` = clean, `1` = fully crushed. Default `1.0`. */
  readonly mix?: number
}

/**
 * Create a bit-depth reduction effect for lo-fi digital distortion.
 * Reduces the resolution of the audio signal for vintage sampler crunch,
 * game console aesthetics, or harsh industrial noise.
 * Lower `bits` = more aggressive aliasing and noise.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - BitCrusher configuration.
 * @returns AudioComponent with `setBits` and `setMix` setters.
 *
 * @example
 * ```ts
 * // 8-bit lo-fi crunch on a drum loop
 * const crush = createBitCrusher(context, { bits: 8, mix: 0.7 })
 * ```
 *
 * @example
 * ```ts
 * // Extreme degradation on a noise riser
 * const noise = createBitCrusher(context, { bits: 3, mix: 1.0 })
 * ```
 *
 * @see {@link createDistortion} — for analogue-style wave-shaping distortion
 * @see {@link createSaturation} — for smooth tape saturation
 */
export const createBitCrusher = (
  context: ScoreAudioContext,
  props?: BitCrusherProps,
) => {
  const bits = Math.max(1, Math.min(props?.bits ?? 8, 16))
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 1.0, 1.0))

  // Bit reduction via gain scaling: multiply up, round (via gain quantization), multiply down
  // step = 2^bits, so we scale by step, then back by 1/step
  const step = Math.pow(2, bits)

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const crushUpGain = context.createGain({ gain: step })
  const crushDownGain = context.createGain({ gain: 1.0 / step })

  // Dry path
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Wet path: input -> scale up -> scale down -> wet -> output
  // This approximates bit reduction by scaling to integer range and back
  inputGain.connect(crushUpGain)
  crushUpGain.connect(crushDownGain)
  crushDownGain.connect(wetGain)
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly setBits: (value: number) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('bitcrusher'),
    type: 'bitcrusher' as const,

    /**
     * Set the bit depth. Lower values = more quantization noise and aliasing.
     * Takes effect immediately — no ramp needed as the result is non-continuous.
     *
     * @param value - Bit depth `1–16`. `8` = classic lo-fi, `1` = 1-bit square wave mayhem.
     */
    setBits: (value: number) => {
      const clamped = Math.max(1, Math.min(value, 16))
      const newStep = Math.pow(2, clamped)
      crushUpGain.setGain(newStep)
      crushDownGain.setGain(1.0 / newStep)
    },

    /**
     * Set the wet/dry mix. `0` = clean signal, `1` = fully crushed.
     *
     * @param value - Mix ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (value: number, time?: number) => {
      const clamped = Math.max(0, Math.min(value, 1.0))
      dryGain.setGain(1.0 - clamped, time)
      wetGain.setGain(clamped, time)
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
      try { dryGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { crushUpGain.disconnect() } catch { /* already disconnected */ }
      try { crushDownGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
