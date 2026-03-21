// Chorus effect — multiple delayed voices with slight detuning
// Uses multiple DelayNodes + GainNodes for voice spread
// NOTE: Initial implementation uses static delay offsets per voice.
// Phase 8b (LFO core primitive) will upgrade to true modulated chorus.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createChorus}.
 *
 * Chorus thickens a signal by layering slightly delayed, pitch-shifted copies.
 * The result ranges from subtle widening to lush ensemble character.
 *
 * @remarks
 * This implementation uses static delay offsets per voice.
 * Phase 8b will upgrade to true LFO-modulated chorus.
 */
export type ChorusProps = {
  /** LFO modulation rate in Hz. Not yet active — reserved for Phase 8b. Default `0.5`. */
  readonly rate?: number
  /** Voice delay depth in seconds `0–0.02`. Controls the spread between voices. Default `0.002`. */
  readonly depth?: number
  /** Wet/dry mix `0–1`. Default `0.5`. */
  readonly mix?: number
  /** Number of chorus voices `2–4`. More voices = richer, denser texture. Default `3`. */
  readonly voices?: number
}

/**
 * Create a chorus effect for thickening, widening, and ensemble character.
 * Layers multiple slightly-delayed copies of the input, creating the illusion
 * of multiple performers playing in unison. Classic on strings, pads, and guitars.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Chorus configuration.
 * @returns AudioComponent with `setDepth` and `setMix` setters.
 *
 * @example
 * ```ts
 * // Thick three-voice pad chorus
 * const chorus = createChorus(context, { voices: 3, depth: 0.004, mix: 0.5 })
 * ```
 *
 * @example
 * ```ts
 * // Subtle two-voice widening on a synth bass
 * const widen = createChorus(context, { voices: 2, depth: 0.001, mix: 0.2 })
 * ```
 *
 * @see {@link createFlanger} — for comb-filter flanger with feedback
 * @see {@link createStereoWidener} — for mid/side stereo width control
 */
export const createChorus = (
  context: ScoreAudioContext,
  props?: ChorusProps,
) => {
  const voiceCount = Math.max(2, Math.min(props?.voices ?? 3, 4))
  const depth = Math.max(0, Math.min(props?.depth ?? 0.002, 0.02))
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1.0))

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })

  // Dry path
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Create voice delay lines with spread offsets — declarative, no push
  const mixNode = context.createGain({ gain: 1.0 / voiceCount })

  const voices = Array.from({ length: voiceCount }, (_, i) => {
    const offset = depth * ((i + 1) / voiceCount)
    const voiceDelay = context.createDelay({ delayTime: 0.01 + offset, maxDelayTime: 0.05 })
    const voiceGain = context.createGain({ gain: 1.0 })
    inputGain.connect(voiceDelay)
    voiceDelay.connect(voiceGain)
    voiceGain.connect(mixNode)
    return { voiceDelay, voiceGain } as const
  })

  mixNode.connect(wetGain)
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly setDepth: (value: number, time?: number) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('chorus'),
    type: 'chorus' as const,

    /**
     * Set the voice delay depth. Controls the spread between chorus voices.
     * Higher values create more pitch movement and widening.
     *
     * @param value - Depth in seconds `0–0.02`. `0.002` = subtle, `0.015` = wide.
     * @param time - Optional schedule time in seconds.
     */
    setDepth: (value: number, time?: number) => {
      const clamped = Math.max(0, Math.min(value, 0.02))
      voices.forEach((v, i) => {
        const offset = clamped * ((i + 1) / voices.length)
        v.voiceDelay.setDelayTime(0.01 + offset, time)
      })
    },

    /**
     * Set the wet/dry mix. `0` = dry, `1` = full chorus.
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
      try { mixNode.disconnect() } catch { /* already disconnected */ }
      voices.forEach(v => {
        try { v.voiceDelay.disconnect() } catch { /* already disconnected */ }
        try { v.voiceGain.disconnect() } catch { /* already disconnected */ }
      })
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
