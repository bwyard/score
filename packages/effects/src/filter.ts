// Filter effect — wraps a backend biquad filter node
// Supports lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendFilterNode, FilterType } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createFilter}.
 *
 * Controls the filter type and key parameters. The biquad filter covers
 * everything from tone-shaping EQ to resonant synthesis filtering.
 */
export type FilterProps = {
  /** Filter topology. `'lowpass'` cuts highs, `'highpass'` cuts lows, etc. Default `'lowpass'`. */
  readonly type?: FilterType
  /** Cutoff or center frequency in Hz. Default `1000`. */
  readonly frequency?: number
  /** Resonance (Q factor). Higher values create a resonant peak at the cutoff. Default `1`. */
  readonly Q?: number
  /** Gain in dB for peaking and shelf filters. Default `0`. */
  readonly gain?: number
}

/**
 * Create a biquad filter effect for tone-shaping and synthesis.
 * From gentle roll-offs on drum buses to screaming resonant sweeps on leads —
 * the workhorse of electronic music sound design.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Filter configuration.
 * @returns AudioComponent with `setFrequency`, `setQ`, and `setGain` setters.
 *
 * @example
 * ```ts
 * // Classic lowpass filter sweep on a synth pad
 * const filter = createFilter(context, { type: 'lowpass', frequency: 800, Q: 2 })
 * filter.setFrequency(4000, context.currentTime + 4) // open up over 4 bars
 * ```
 *
 * @example
 * ```ts
 * // Highpass on bass to clean up sub on small speakers
 * const hp = createFilter(context, { type: 'highpass', frequency: 60 })
 * ```
 *
 * @see {@link createEQ} — for multi-band shelving EQ
 */
export const createFilter = (
  context: ScoreAudioContext,
  props?: FilterProps,
) => {
  const filterNode: BackendFilterNode = context.createFilter({
    type: props?.type ?? 'lowpass',
    frequency: props?.frequency ?? 1000,
    Q: props?.Q ?? 1,
    gain: props?.gain ?? 0,
  })

  const component: AudioComponent & {
    readonly setFrequency: (value: number, time?: number) => void
    readonly setQ: (value: number, time?: number) => void
    readonly setGain: (value: number, time?: number) => void
  } = {
    id: uid('filter'),
    type: 'filter' as const,

    /**
     * Set the filter cutoff or center frequency.
     *
     * @param value - Frequency in Hz. Typical range `20–20000`.
     * @param time - Optional schedule time in seconds.
     */
    setFrequency: (value: number, time?: number) => { filterNode.setFrequency(value, time) },

    /**
     * Set the resonance (Q factor). Higher values produce a pronounced peak at the cutoff.
     *
     * @param value - Q factor. `0.707` = Butterworth (no peak), `10+` = sharp resonance.
     * @param time - Optional schedule time in seconds.
     */
    setQ: (value: number, time?: number) => { filterNode.setQ(value, time) },

    /**
     * Set the filter gain in dB. Only meaningful for `'peaking'`, `'lowshelf'`, and `'highshelf'` types.
     *
     * @param value - Gain in dB. Positive = boost, negative = cut.
     * @param time - Optional schedule time in seconds.
     */
    setGain: (value: number, time?: number) => { filterNode.setFilterGain(value, time) },

    connect: (destination: ScoreAudioNode) => {
      filterNode.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        filterNode.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try {
        filterNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
