// Stereo Widener effect — mid/side processing for stereo width control
// Uses StereoPannerNode + GainNodes for mid/side balance
// width: 0 = mono, 1 = normal stereo, 2 = extra wide

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createStereoWidener}.
 *
 * Controls the stereo width via mid/side gain balance.
 * `0` = mono (center only), `1` = normal stereo, `2` = extra wide (boosted sides).
 */
export type StereoWidenerProps = {
  /** Stereo width `0–2`. `0` = mono, `1` = unity, `2` = maximum width. Default `1.0`. */
  readonly width?: number
}

/**
 * Create a stereo widener using mid/side processing.
 * Widen narrow-sounding synth pads into expansive stereo fields,
 * or narrow a muddy mix for tighter mono compatibility.
 * Use carefully — excessive width collapses to silence in mono.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Stereo widener configuration.
 * @returns AudioComponent with a `setWidth` setter.
 *
 * @example
 * ```ts
 * // Push a pad to the far edges of the stereo field
 * const widen = createStereoWidener(context, { width: 1.8 })
 * ```
 *
 * @example
 * ```ts
 * // Narrow a full mix to 75% for more focused club sound
 * const narrow = createStereoWidener(context, { width: 0.75 })
 * ```
 *
 * @see {@link createChorus} — for width via multi-voice delay
 * @see {@link createAutoPan} — for rhythmic stereo movement
 */
export const createStereoWidener = (
  context: ScoreAudioContext,
  props?: StereoWidenerProps,
) => {
  const width = Math.max(0, Math.min(props?.width ?? 1.0, 2.0))

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const midGain = context.createGain({ gain: 2.0 - width })
  const sideGain = context.createGain({ gain: width })
  const panLeft = context.createStereoPanner({ pan: -1 })
  const panRight = context.createStereoPanner({ pan: 1 })

  // Mid path: input -> midGain -> output (center, no pan)
  inputGain.connect(midGain)
  midGain.connect(outputGain)

  // Side path: input -> sideGain -> split to left/right panners -> output
  inputGain.connect(sideGain)
  sideGain.connect(panLeft)
  sideGain.connect(panRight)
  panLeft.connect(outputGain)
  panRight.connect(outputGain)

  const component: AudioComponent & {
    readonly setWidth: (value: number, time?: number) => void
  } = {
    id: uid('stereo-widener'),
    type: 'stereo-widener' as const,

    /**
     * Set the stereo width. `1.0` = unity (no change). `0` = mono. `2.0` = maximum width.
     *
     * @param value - Width `0–2.0`.
     * @param time - Optional schedule time in seconds.
     */
    setWidth: (value: number, time?: number) => {
      const clamped = Math.max(0, Math.min(value, 2.0))
      midGain.setGain(2.0 - clamped, time)
      sideGain.setGain(clamped, time)
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
      try { midGain.disconnect() } catch { /* already disconnected */ }
      try { sideGain.disconnect() } catch { /* already disconnected */ }
      try { panLeft.disconnect() } catch { /* already disconnected */ }
      try { panRight.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
