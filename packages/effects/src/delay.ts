// Delay effect — delay with feedback and dry/wet mix
// Uses backend delay node + gain nodes for feedback routing

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createDelay}.
 *
 * Controls the delay time, feedback loop amount, and dry/wet blend.
 * Quarter-note delay at 120 BPM = `0.5s`, eighth-note = `0.25s`.
 */
export type DelayProps = {
  /** Delay time in seconds. Default `0.25` (quarter note at 120 BPM). Max `5`. */
  readonly time?: number
  /** Feedback amount `0–0.95`. Higher values create longer echo tails. Clamped to `0.95` to prevent runaway. Default `0.3`. */
  readonly feedback?: number
  /** Wet/dry mix `0–1`. `0` = dry, `1` = fully wet. Default `0.5`. */
  readonly mix?: number
}

/**
 * Create a feedback delay effect for echo and rhythmic repetition.
 * A core building block of dub, house, and ambient — from a single slap-back
 * to infinite shimmer. Sync `time` to your BPM for musical results.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Delay configuration.
 * @returns AudioComponent with `setTime`, `setFeedback`, and `setMix` setters.
 *
 * @example
 * ```ts
 * // Dotted-eighth delay for classic house lead
 * const delay = createDelay(context, { time: 0.375, feedback: 0.4, mix: 0.3 })
 * ```
 *
 * @example
 * ```ts
 * // Long dub echo with heavy feedback
 * const dub = createDelay(context, { time: 0.5, feedback: 0.7, mix: 0.6 })
 * ```
 *
 * @see {@link createReverb} — for room and space effects
 * @see {@link createFlanger} — for short modulated delay effects
 */
export const createDelay = (
  context: ScoreAudioContext,
  props?: DelayProps,
) => {
  const delayTime = props?.time ?? 0.25
  const feedbackAmount = Math.min(props?.feedback ?? 0.3, 0.95)
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1.0))

  // Create nodes
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const feedbackGain = context.createGain({ gain: feedbackAmount })
  const delayNode = context.createDelay({ delayTime, maxDelayTime: 5.0 })

  // Route: input -> dry -> output
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Route: input -> delay -> wet -> output
  inputGain.connect(delayNode)
  delayNode.connect(wetGain)
  wetGain.connect(outputGain)

  // Feedback: delay -> feedback -> delay
  delayNode.connect(feedbackGain)
  feedbackGain.connect(delayNode)

  const component: AudioComponent & {
    readonly setTime: (value: number, time?: number) => void
    readonly setFeedback: (value: number, time?: number) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('delay'),
    type: 'delay' as const,

    /**
     * Set the delay time in seconds.
     *
     * @param value - Delay time in seconds. `0.25` = quarter note at 120 BPM.
     * @param time - Optional schedule time in seconds.
     */
    setTime: (value: number, time?: number) => { delayNode.setDelayTime(value, time) },

    /**
     * Set the feedback amount. Controls how many echoes are heard before silence.
     * Clamped to `0.95` to prevent runaway feedback.
     *
     * @param value - Feedback `0–0.95`. `0.8+` creates long, dense echo tails.
     * @param time - Optional schedule time in seconds.
     */
    setFeedback: (value: number, time?: number) => {
      feedbackGain.setGain(Math.min(value, 0.95), time)
    },

    /**
     * Set the wet/dry mix. `0` = dry signal only, `1` = delay only.
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
      try {
        outputGain.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { dryGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { feedbackGain.disconnect() } catch { /* already disconnected */ }
      try { delayNode.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
