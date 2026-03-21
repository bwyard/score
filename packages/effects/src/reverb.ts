// Reverb effect — simulated reverb using parallel delay taps with exponential decay
// Uses gain nodes for dry/wet mix control

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import type { BackendGainNode, BackendDelayNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createReverb}.
 *
 * Controls the reverb tail length and wet/dry blend.
 * Longer decay creates larger perceived spaces — from tight rooms to vast halls.
 */
export type ReverbProps = {
  /** Reverb decay time in seconds. Longer = bigger room. Default `2.0`. */
  readonly decay?: number
  /** Wet/dry mix `0–1`. `0` = dry, `1` = fully wet. Default `0.3`. */
  readonly mix?: number
}

/**
 * A single parallel delay tap used internally by {@link createReverb}.
 */
type ReverbTap = {
  readonly tapDelay: BackendDelayNode
  readonly tapGain: BackendGainNode
}

/**
 * Create a reverb effect using parallel delay taps with exponential decay.
 * Simulates acoustic spaces from tight studios to cathedral halls.
 * Use sparingly on bass — mud builds fast. Works beautifully on pads and leads.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Reverb configuration.
 * @returns AudioComponent with a `setMix` setter.
 *
 * @example
 * ```ts
 * // Large hall reverb on a pad for ambient techno
 * const verb = createReverb(context, { decay: 4.0, mix: 0.4 })
 * ```
 *
 * @example
 * ```ts
 * // Tight room verb on snare
 * const snareVerb = createReverb(context, { decay: 0.8, mix: 0.2 })
 * ```
 *
 * @see {@link createDelay} — for tempo-synced echo effects
 */
export const createReverb = (
  context: ScoreAudioContext,
  props?: ReverbProps,
) => {
  const decay = props?.decay ?? 2.0
  const mixAmount = props?.mix ?? 0.3

  // Create dry/wet mix nodes
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })

  // Route: input -> dry -> output
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Create parallel delay taps to simulate reverb reflections — declarative, no push
  const taps = 6
  const tapNodes: readonly ReverbTap[] = Array.from({ length: taps }, (_, i) => {
    const tapDelay = context.createDelay({
      delayTime: (i + 1) * decay / taps,
      maxDelayTime: decay + 1,
    })
    const tapGain = context.createGain({ gain: Math.pow(0.6, i + 1) })
    inputGain.connect(tapDelay)
    tapDelay.connect(tapGain)
    tapGain.connect(wetGain)
    return { tapDelay, tapGain } as const
  })

  // Wet -> output
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('reverb'),
    type: 'reverb' as const,

    /**
     * Set the wet/dry mix. `0` = fully dry, `1` = fully reverberant.
     *
     * @param value - Mix ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (value: number, time?: number) => {
      dryGain.setGain(1.0 - value, time)
      wetGain.setGain(value, time)
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
      tapNodes.forEach(({ tapGain, tapDelay }) => {
        try { tapGain.disconnect() } catch { /* already disconnected */ }
        try { tapDelay.disconnect() } catch { /* already disconnected */ }
      })
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { dryGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
