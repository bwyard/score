// Flanger effect — short delay with feedback for comb filtering
// Uses short DelayNode + feedback GainNode
// NOTE: Initial implementation uses fixed delay time.
// Phase 8b (LFO core primitive) will upgrade to true modulated flanger.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createFlanger}.
 *
 * A flanger mixes a very short delayed copy of the signal with the original,
 * creating comb-filter sweeps with a metallic, jet-plane character.
 *
 * @remarks
 * This implementation uses a fixed delay time.
 * Phase 8b will introduce LFO modulation for the classic time-varying sweep.
 */
export type FlangerProps = {
  /** LFO modulation rate in Hz. Reserved for Phase 8b. Default `0.5`. */
  readonly rate?: number
  /** Delay depth in seconds `0–0.01`. Controls the comb-filter notch spacing. Default `0.002`. */
  readonly depth?: number
  /** Feedback amount `0–0.95`. Higher values = sharper, more metallic resonance. Default `0.5`. */
  readonly feedback?: number
  /** Wet/dry mix `0–1`. Default `0.5`. */
  readonly mix?: number
}

/**
 * Create a flanger effect for comb-filtering and metallic sweep character.
 * Classic on guitar, synth pads, and drum overheads — ranges from subtle
 * jet-plane shimmer to industrial metallic resonance.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Flanger configuration.
 * @returns AudioComponent with `setDepth`, `setFeedback`, and `setMix` setters.
 *
 * @example
 * ```ts
 * // Classic flanger on an 80s synth pad
 * const flange = createFlanger(context, { depth: 0.003, feedback: 0.6, mix: 0.4 })
 * ```
 *
 * @example
 * ```ts
 * // Extreme metallic resonance on a noise texture
 * const metal = createFlanger(context, { depth: 0.008, feedback: 0.9, mix: 0.8 })
 * ```
 *
 * @see {@link createPhaser} — for allpass-based phase sweeping
 * @see {@link createChorus} — for multi-voice ensemble thickening
 */
export const createFlanger = (
  context: ScoreAudioContext,
  props?: FlangerProps,
) => {
  const depth = Math.max(0, Math.min(props?.depth ?? 0.002, 0.01))
  const feedbackAmount = Math.min(props?.feedback ?? 0.5, 0.95)
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1.0))

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const flangeDelay = context.createDelay({ delayTime: depth, maxDelayTime: 0.02 })
  const feedbackGain = context.createGain({ gain: feedbackAmount })

  // Dry path
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Wet path: input -> delay -> wet -> output
  inputGain.connect(flangeDelay)
  flangeDelay.connect(wetGain)
  wetGain.connect(outputGain)

  // Feedback: delay -> feedback -> delay
  flangeDelay.connect(feedbackGain)
  feedbackGain.connect(flangeDelay)

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly setDepth: (value: number, time?: number) => void
    readonly setFeedback: (value: number, time?: number) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('flanger'),
    type: 'flanger' as const,
    input: inputGain,

    /**
     * Set the flange delay depth. Controls the comb-filter frequency spacing.
     * Shorter delays = higher-frequency notches; longer = lower.
     *
     * @param value - Depth in seconds `0–0.01`. `0.002` = subtle, `0.008` = dramatic.
     * @param time - Optional schedule time in seconds.
     */
    setDepth: (value: number, time?: number) => {
      flangeDelay.setDelayTime(Math.max(0, Math.min(value, 0.01)), time)
    },

    /**
     * Set the feedback amount. Higher values create sharper, more metallic resonance.
     * Clamped to `0.95` to prevent instability.
     *
     * @param value - Feedback `0–0.95`.
     * @param time - Optional schedule time in seconds.
     */
    setFeedback: (value: number, time?: number) => {
      feedbackGain.setGain(Math.min(value, 0.95), time)
    },

    /**
     * Set the wet/dry mix. `0` = dry, `1` = fully flanged.
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
      try { flangeDelay.disconnect() } catch { /* already disconnected */ }
      try { feedbackGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
