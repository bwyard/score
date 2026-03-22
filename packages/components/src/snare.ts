import type { ScoreAudioContext } from '@score/core'
import type { BackendBuffer } from '@score/core'
import { uid } from '@score/core'
import { Sample, type SampleComponent } from './sample.js'

/**
 * Configuration for {@link Snare}.
 */
export type SnareProps = {
  /** Output gain 0–1. Default `0.8`. */
  readonly gain?: number
}

/**
 * Create a Snare drum component — a one-shot sample player tuned for snare drum use.
 * Wraps {@link Sample} with snare-specific defaults: no looping, `1.0` playback rate,
 * and a default gain of `0.8`.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param buffer - Decoded audio buffer containing the snare drum sample.
 * @param props - Optional snare configuration. If omitted all defaults apply.
 * @returns A {@link SampleComponent} with `id` prefixed `snare` and `type` set to `'snare'`.
 *
 * @example
 * ```ts
 * const buffer = await context.decodeAudioData(snareAudioData)
 * const snare = Snare(context, buffer, { gain: 0.8 })
 * snare.connect(context.destination)
 * snare.start(context.currentTime)
 * ```
 *
 * @see {@link Sample} — the underlying one-shot sample player
 * @see {@link Kick} — kick counterpart with a default gain of `0.9`
 * @see {@link HiHat} — hi-hat counterpart with open/closed gain modes
 */
export const Snare = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: SnareProps,
): SampleComponent => {
  const sample = Sample(context, buffer, {
    loop: false,
    playbackRate: 1.0,
    gain: props?.gain ?? 0.8,
  })
  const snare: SampleComponent = {
    ...sample,
    id: uid('snare'),
    type: 'snare',
    connect: (dest) => { sample.connect(dest); return snare },
    disconnect: () => { sample.disconnect(); return snare },
  }
  return snare
}
