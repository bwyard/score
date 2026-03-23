// Saturation effect — soft-clip using tanh transfer curve
// Uses WaveShaperNode with hyperbolic tangent for musical harmonic distortion

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendWaveShaperNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createSaturation}.
 *
 * Saturation adds harmonic overtones to the signal — higher drive produces
 * more overtones, increasing warmth and perceived loudness.
 */
export type SaturationProps = {
  /** Saturation drive amount `0–1`. `0` = clean, `1` = heavily saturated. Default `0.3`. */
  readonly drive?: number
  /** Wet/dry mix `0–1`. `0` = dry signal only, `1` = fully saturated. Default `0.5`. */
  readonly mix?: number
}

/**
 * Hardware-boundary exception: engine-layer mutable state.
 * `const` binding — identity never changes, only `drive` is mutated by `setDrive`.
 */
type SaturationState = { drive: number }

const makeTanhCurve = (drive: number): Float32Array => {
  const samples = 256
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.tanh(x * (1 + drive * 4))
  }
  return curve
}

/**
 * Create a soft-clip saturation effect using a tanh transfer curve.
 * Adds harmonic warmth and tape-style compression character.
 * Lower drive values produce subtle tube warmth; higher values give
 * aggressive harmonic distortion.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Saturation configuration.
 * @returns AudioComponent with `setDrive` and `setMix` setters.
 *
 * @example
 * ```ts
 * const sat = createSaturation(context, { drive: 0.4, mix: 0.6 })
 * // Adds tape warmth to master bus
 * ```
 *
 * @example
 * ```ts
 * // Subtle analogue warmth on a synth lead
 * const lead = createSaturation(context, { drive: 0.15, mix: 0.3 })
 * ```
 */
export const createSaturation = (
  context: ScoreAudioContext,
  props?: SaturationProps,
) => {
  const driveAmount = Math.max(0, Math.min(props?.drive ?? 0.3, 1.0))
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1.0))

  const state: SaturationState = { drive: driveAmount }

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const shaper: BackendWaveShaperNode = context.createWaveShaper({
    curve: makeTanhCurve(driveAmount),
    oversample: '2x',
  })

  // Dry path: input → dry → output
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Wet path: input → shaper → wet → output
  inputGain.connect(shaper)
  shaper.connect(wetGain)
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly setDrive: (drive: number, time?: number) => void
    readonly setMix: (mix: number, time?: number) => void
  } = {
    id: uid('saturation'),
    type: 'saturation' as const,
    input: inputGain,

    /**
     * Set the saturation drive amount and regenerate the transfer curve.
     * Higher values produce more harmonics and a louder perceived signal.
     *
     * @param drive - Drive amount `0–1`. Changes take effect immediately (curve regenerated).
     * @param time - Optional — unused for curve changes, accepted for API consistency.
     */
    setDrive: (drive: number, _time?: number) => {
      state.drive = Math.max(0, Math.min(drive, 1.0))
      shaper.setCurve(makeTanhCurve(state.drive))
    },

    /**
     * Set the wet/dry mix. `0` bypasses saturation, `1` is fully saturated.
     *
     * @param mix - Wet/dry ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (mix: number, time?: number) => {
      const clamped = Math.max(0, Math.min(mix, 1.0))
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
      try { shaper.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
