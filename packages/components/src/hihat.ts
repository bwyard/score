import type { ScoreAudioContext } from '@score/core'
import type { BackendBuffer } from '@score/core'
import { uid } from '@score/core'
import { Sample, type SampleComponent } from './sample.js'

/**
 * Configuration for {@link HiHat}.
 */
export type HiHatProps = {
  /** Output gain 0–1. Defaults to `0.8` (open) or `0.6` (closed) when omitted. */
  readonly gain?: number
  /**
   * `true` for an open hi-hat (sustains longer at higher gain).
   * `false` or omitted for a closed hi-hat. Default `false`.
   */
  readonly open?: boolean
}

/**
 * Create a HiHat component — a one-shot sample player with open/closed gain modes.
 * Wraps {@link Sample} with hi-hat-specific defaults: no looping, `1.0` playback rate,
 * and a default gain of `0.8` for open hi-hats or `0.6` for closed hi-hats.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param buffer - Decoded audio buffer containing the hi-hat sample.
 * @param props - Optional hi-hat configuration. Pass `{ open: true }` for an open hi-hat.
 * @returns A {@link SampleComponent} with `id` prefixed `hihat` and `type` set to `'hihat'`.
 *
 * @example
 * ```ts
 * const buffer = await context.decodeAudioData(hihatAudioData)
 *
 * // Closed hi-hat (default gain 0.6)
 * const closed = HiHat(context, buffer)
 * closed.connect(context.destination)
 * closed.start(context.currentTime)
 *
 * // Open hi-hat (default gain 0.8)
 * const open = HiHat(context, buffer, { open: true })
 * open.connect(context.destination)
 * open.start(context.currentTime)
 * ```
 *
 * @see {@link Sample} — the underlying one-shot sample player
 * @see {@link Kick} — kick counterpart
 * @see {@link Snare} — snare counterpart
 */
export const HiHat = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: HiHatProps,
): SampleComponent => {
  // Open hi-hat has higher gain sustain (0.8 default vs 0.6 closed)
  const defaultGain = props?.open === true ? 0.8 : 0.6
  const gain = props?.gain ?? defaultGain

  const sample = Sample(context, buffer, {
    loop: false,
    playbackRate: 1.0,
    gain,
  })
  const hihat: SampleComponent = {
    ...sample,
    id: uid('hihat'),
    type: 'hihat',
    connect: (dest) => { sample.connect(dest); return hihat },
    disconnect: () => { sample.disconnect(); return hihat },
  }
  return hihat
}
