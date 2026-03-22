import type { ScoreAudioContext } from '@score/core'
import type { BackendBuffer } from '@score/core'
import { uid } from '@score/core'
import { Sample, type SampleComponent } from './sample.js'

/**
 * Configuration for {@link Kick}.
 */
export type KickProps = {
  /** Output gain 0–1. Default `0.9`. */
  readonly gain?: number
}

/**
 * Create a Kick drum component — a one-shot sample player tuned for kick drum use.
 * Wraps {@link Sample} with kick-specific defaults: no looping, `1.0` playback rate,
 * and a default gain of `0.9`.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param buffer - Decoded audio buffer containing the kick drum sample.
 * @param props - Optional kick configuration. If omitted all defaults apply.
 * @returns A {@link SampleComponent} with `id` prefixed `kick` and `type` set to `'kick'`.
 *
 * @example
 * ```ts
 * const buffer = await context.decodeAudioData(kickAudioData)
 * const kick = Kick(context, buffer, { gain: 0.9 })
 * kick.connect(context.destination)
 * kick.start(context.currentTime)
 * ```
 *
 * @see {@link Sample} — the underlying one-shot sample player
 * @see {@link Snare} — snare counterpart with a default gain of `0.8`
 */
export const Kick = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: KickProps,
): SampleComponent => {
  const sample = Sample(context, buffer, {
    loop: false,
    playbackRate: 1.0,
    gain: props?.gain ?? 0.9,
  })
  const kick: SampleComponent = {
    ...sample,
    id: uid('kick'),
    type: 'kick',
    connect: (dest) => { sample.connect(dest); return kick },
    disconnect: () => { sample.disconnect(); return kick },
  }
  return kick
}
