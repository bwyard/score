// Distortion effect — wave shaping with dry/wet mix
// Uses WaveShaperNode for nonlinear distortion + gain nodes for mixing

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Distortion algorithm character.
 *
 * - `'soft'` — smooth, rounded clipping — tube amplifier warmth
 * - `'hard'` — abrupt hard clipping — solid-state grit
 * - `'foldback'` — signal folds back on itself — harsh, aliased industrial character
 */
export type DistortionMode = 'soft' | 'hard' | 'foldback'

/**
 * Configuration props for {@link createDistortion}.
 *
 * Wave-shaping distortion adds harmonic content via nonlinear transfer curves.
 * Low amounts add warmth; high amounts go from crunch to full saturation.
 */
export type DistortionProps = {
  /** Distortion amount `0–1`. `0` = clean, `1` = maximum harmonic content. Default `0.5`. */
  readonly amount?: number
  /** Distortion character — soft tube warmth, hard clip grit, or foldback chaos. Default `'soft'`. */
  readonly mode?: DistortionMode
  /** Wet/dry mix `0–1`. Default `0.5`. */
  readonly mix?: number
}

const makeSoftCurve = (amount: number): Float32Array => {
  const samples = 44100
  const curve = new Float32Array(samples)
  const k = amount * 100
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
  }
  return curve
}

const makeHardCurve = (amount: number): Float32Array => {
  const samples = 44100
  const curve = new Float32Array(samples)
  const threshold = 1 - amount * 0.9
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.max(-threshold, Math.min(threshold, x)) / threshold
  }
  return curve
}

const makeFoldbackCurve = (amount: number): Float32Array => {
  const samples = 44100
  const curve = new Float32Array(samples)
  const threshold = 1 - amount * 0.8
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    if (Math.abs(x) > threshold) {
      curve[i] = Math.abs(Math.abs((x - threshold) % (threshold * 4)) - threshold * 2) - threshold
    } else {
      curve[i] = x
    }
  }
  return curve
}

const curveGenerators: Readonly<Record<DistortionMode, (amount: number) => Float32Array>> = {
  soft: makeSoftCurve,
  hard: makeHardCurve,
  foldback: makeFoldbackCurve,
}

/**
 * Create a wave-shaping distortion effect for grit, crunch, and harmonic saturation.
 * Choose `'soft'` for tube-style warmth on synths and vocals,
 * `'hard'` for aggressive guitar-amp crunch,
 * or `'foldback'` for industrial mayhem.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Distortion configuration.
 * @returns AudioComponent with `setAmount` and `setMix` setters.
 *
 * @example
 * ```ts
 * // Soft saturation on a bass synth for analogue warmth
 * const warmth = createDistortion(context, { amount: 0.2, mode: 'soft', mix: 0.3 })
 * ```
 *
 * @example
 * ```ts
 * // Hard clip industrial lead at full drive
 * const crunch = createDistortion(context, { amount: 0.9, mode: 'hard', mix: 0.8 })
 * ```
 *
 * @see {@link createSaturation} — for tanh-based soft saturation with simpler controls
 * @see {@link createBitCrusher} — for lo-fi digital distortion
 */
export const createDistortion = (
  context: ScoreAudioContext,
  props?: DistortionProps,
) => {
  const amount = Math.max(0, Math.min(props?.amount ?? 0.5, 1.0))
  const mode = props?.mode ?? 'soft'
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1.0))

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const shaper = context.createWaveShaper({ curve: curveGenerators[mode](amount), oversample: '2x' })

  // Dry path: input -> dry -> output
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Wet path: input -> shaper -> wet -> output
  inputGain.connect(shaper)
  shaper.connect(wetGain)
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly setAmount: (value: number, mode?: DistortionMode) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('distortion'),
    type: 'distortion' as const,
    input: inputGain,

    /**
     * Set the distortion amount and optionally switch the mode.
     * Regenerates the transfer curve immediately.
     *
     * @param value - Distortion amount `0–1`.
     * @param mode - Optional new mode (`'soft'`, `'hard'`, `'foldback'`). Defaults to the initially configured mode.
     */
    setAmount: (value: number, newMode?: DistortionMode) => {
      const clamped = Math.max(0, Math.min(value, 1.0))
      const m = newMode ?? mode
      shaper.setCurve(curveGenerators[m](clamped))
    },

    /**
     * Set the wet/dry mix. `0` = dry, `1` = fully distorted.
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
      try { shaper.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
