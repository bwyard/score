// EQ effect — 3-band equalizer using three filter instances
// lowshelf (320 Hz), peaking (1000 Hz), highshelf (3200 Hz)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendFilterNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createEQ}.
 *
 * Three-band EQ with fixed crossover points — suitable for broad tone-shaping
 * on tracks and buses. Boost to add presence, cut to clean up mud.
 */
export type EQProps = {
  /** Low shelf gain in dB at 320 Hz. Positive = bass boost, negative = bass cut. Default `0`. */
  readonly low?: number
  /** Mid peak gain in dB at 1000 Hz (Q=1). Controls presence and body. Default `0`. */
  readonly mid?: number
  /** High shelf gain in dB at 3200 Hz. Positive = air/brightness, negative = de-essing. Default `0`. */
  readonly high?: number
}

/**
 * Create a three-band equalizer for tone-shaping on tracks and buses.
 * Fixed crossover points at 320 Hz, 1 kHz, and 3.2 kHz make this ideal
 * for quick mixes — boost lows for warmth, cut mids for clarity, add high shelf for air.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - EQ configuration with gain values in dB for each band.
 * @returns AudioComponent with `setLow`, `setMid`, and `setHigh` setters.
 *
 * @example
 * ```ts
 * // Classic house bass EQ — tight low, scooped mid, bright high
 * const bassEQ = createEQ(context, { low: 3, mid: -4, high: 1 })
 * ```
 *
 * @example
 * ```ts
 * // Remove mud on a pad without touching the lows
 * const padEQ = createEQ(context, { mid: -6 })
 * ```
 *
 * @see {@link createFilter} — for single-band filter with frequency sweep
 * @see {@link createMultibandCompressor} — for per-band dynamics control
 */
export const createEQ = (
  context: ScoreAudioContext,
  props?: EQProps,
) => {
  const lowFilter: BackendFilterNode = context.createFilter({
    type: 'lowshelf',
    frequency: 320,
    gain: props?.low ?? 0,
  })

  const midFilter: BackendFilterNode = context.createFilter({
    type: 'peaking',
    frequency: 1000,
    Q: 1,
    gain: props?.mid ?? 0,
  })

  const highFilter: BackendFilterNode = context.createFilter({
    type: 'highshelf',
    frequency: 3200,
    gain: props?.high ?? 0,
  })

  // Chain: input (low) -> mid -> high -> output
  lowFilter.connect(midFilter)
  midFilter.connect(highFilter)

  const component: AudioComponent & {
    readonly setLow: (value: number, time?: number) => void
    readonly setMid: (value: number, time?: number) => void
    readonly setHigh: (value: number, time?: number) => void
  } = {
    id: uid('eq'),
    type: 'eq' as const,

    /**
     * Set the low shelf gain at 320 Hz.
     *
     * @param value - Gain in dB. `+3` = warm bass boost, `-6` = sub cut.
     * @param time - Optional schedule time in seconds.
     */
    setLow: (value: number, time?: number) => { lowFilter.setFilterGain(value, time) },

    /**
     * Set the mid peak gain at 1000 Hz.
     *
     * @param value - Gain in dB. `+3` = more presence, `-6` = removes midrange mud.
     * @param time - Optional schedule time in seconds.
     */
    setMid: (value: number, time?: number) => { midFilter.setFilterGain(value, time) },

    /**
     * Set the high shelf gain at 3200 Hz.
     *
     * @param value - Gain in dB. `+3` = air and sparkle, `-3` = tame brightness.
     * @param time - Optional schedule time in seconds.
     */
    setHigh: (value: number, time?: number) => { highFilter.setFilterGain(value, time) },

    connect: (destination: ScoreAudioNode) => {
      highFilter.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        highFilter.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try { lowFilter.disconnect() } catch { /* already disconnected */ }
      try { midFilter.disconnect() } catch { /* already disconnected */ }
      try { highFilter.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
