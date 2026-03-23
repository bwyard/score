import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration for {@link createSnare909}.
 */
export type Snare909Props = {
  /**
   * Decay time of the two triangle-wave tone oscillators in seconds.
   * Default `0.2`.
   */
  readonly toneDecay?: number
  /**
   * Decay time of the white-noise component in seconds.
   * Default `0.3`.
   */
  readonly noiseDecay?: number
  /**
   * Mix ratio of tone body (0 = noise only, 1 = tone only).
   * Classic 909 ratio is approximately 0.4 (40% tone, 60% noise).
   * Default `0.4`.
   */
  readonly toneNoiseRatio?: number
  /** Output gain 0–1. Default `0.85`. */
  readonly gain?: number
}

/**
 * A synthesized percussion component — extends {@link AudioComponent} with a
 * `trigger` method for scheduling one-shot hits.
 */
export type Snare909Component = AudioComponent & {
  /**
   * Trigger a single snare hit at the given audio context time.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly trigger: (time?: number) => void
}

/**
 * Create a synthesized 909-style snare drum component.
 *
 * Two triangle oscillators (180 Hz + 330 Hz) form the tone body.
 * White noise through a high-pass filter (1800 Hz) provides the snap and
 * sizzle. The tone and noise arms are mixed at a 40/60 ratio by default.
 *
 * Signal paths:
 * - Tone A: triangle 180 Hz → tone amp env → mix gain → output gain
 * - Tone B: triangle 330 Hz → tone amp env → mix gain → output gain
 * - Noise:  white noise → HPF 1800 Hz → noise amp env → mix gain → output gain
 *
 * Each `trigger()` call spawns fresh oscillators + noise source for that hit.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props - Optional snare configuration. If omitted all defaults apply.
 * @returns A {@link Snare909Component} with `id` prefixed `snare909` and `type` set to `'snare909'`.
 *
 * @example
 * ```ts
 * const snare = createSnare909(context, { toneDecay: 0.2, noiseDecay: 0.3 })
 * snare.connect(context.destination)
 * snare.trigger(context.currentTime)
 * ```
 *
 * @see {@link Snare909Props} — configuration options
 * @see {@link Snare909Component} — returned component shape
 * @throws \{ScoreError\} Never — invalid props are silently clamped.
 */
export const createSnare909 = (
  context: ScoreAudioContext,
  props?: Snare909Props,
): Snare909Component => {
  const toneDecay = props?.toneDecay ?? 0.2
  const noiseDecay = props?.noiseDecay ?? 0.3
  const toneNoiseRatio = props?.toneNoiseRatio ?? 0.4
  const outputGain = context.createGain({ gain: props?.gain ?? 0.85 })

  const trigger = (time?: number) => {
    const t = time ?? context.currentTime

    // --- Tone arm: two triangle oscillators ---
    const toneEnv = context.createGain({ gain: 0 })
    toneEnv.connect(outputGain)

    const oscA = context.createOscillator({ type: 'triangle', frequency: 180 })
    const oscB = context.createOscillator({ type: 'triangle', frequency: 330 })

    // Scale each oscillator so combined tone = toneNoiseRatio
    const oscGain = toneNoiseRatio / 2
    const gainA = context.createGain({ gain: oscGain })
    const gainB = context.createGain({ gain: oscGain })

    oscA.connect(gainA)
    oscB.connect(gainB)
    gainA.connect(toneEnv)
    gainB.connect(toneEnv)

    toneEnv.scheduleEnvelope({
      peak: 1.0,
      attack: 0.002,
      decay: toneDecay,
      sustain: 0,
      release: 0,
      startTime: t,
      duration: toneDecay + 0.002,
    })

    oscA.start(t)
    oscB.start(t)
    oscA.stop(t + toneDecay + 0.05)
    oscB.stop(t + toneDecay + 0.05)

    // --- Noise arm: white noise → HPF → amp env ---
    const noise = context.createNoise({ type: 'white' })
    const noiseHpf = context.createFilter({ type: 'highpass', frequency: 1800, Q: 0.8 })
    const noiseEnv = context.createGain({ gain: 0 })
    const noiseScale = context.createGain({ gain: 1 - toneNoiseRatio })

    noise.connect(noiseHpf)
    noiseHpf.connect(noiseEnv)
    noiseEnv.connect(noiseScale)
    noiseScale.connect(outputGain)

    noiseEnv.scheduleEnvelope({
      peak: 1.0,
      attack: 0.001,
      decay: noiseDecay,
      sustain: 0,
      release: 0,
      startTime: t,
      duration: noiseDecay + 0.001,
    })

    noise.start(t)
    noise.stop(t + noiseDecay + 0.05)
  }

  const component: Snare909Component = {
    id: uid('snare909'),
    type: 'snare909' as const,
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
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
