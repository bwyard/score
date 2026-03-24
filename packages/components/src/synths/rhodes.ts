// rhodes.ts — Rhodes electric piano component for @score/components
//
// Wraps FMSynth with DX7 Rhodes defaults:
// modRatio 1.273 (inharmonic), modIndex 3, fast attack (0.005s), long decay (0.9s).
// Callers can override any field via props.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import { createFMSynth } from './fm.js'
import type { FMSynthComponent, FMSynthProps } from './fm.js'

/**
 * Configuration props for {@link createRhodes}.
 * All fields mirror {@link FMSynthProps} — any field not set uses Rhodes defaults.
 */
export type RhodesProps = FMSynthProps

/**
 * A Rhodes electric piano component — DX7-style FM with fast attack and long decay.
 * Extends {@link AudioComponent} with note-on / note-off.
 */
export type RhodesComponent = AudioComponent & {
  /**
   * Gate a note on: trigger amp + modulation attack-decay-sustain.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOn: (time?: number) => void
  /**
   * Gate a note off: trigger amp + modulation release.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the carrier (and derived modulator) frequency in Hz.
   * @param value - Target frequency in Hz.
   * @param time  - Optional schedule time.
   */
  readonly setFrequency: (value: number, time?: number) => void
  /**
   * Set the output gain.
   * @param value - Gain 0–1.
   * @param time  - Optional schedule time.
   */
  readonly setGain: (value: number, time?: number) => void
}

// Rhodes defaults — applied as base, caller props override
const RHODES_DEFAULTS: FMSynthProps = {
  modRatio: 1.273,
  modIndex: 3,
  ampAdsr:  { attack: 0.005, decay: 0.9, sustain: 0.4, release: 0.5 },
  modAdsr:  { attack: 0.005, decay: 0.6, sustain: 0.5, release: 0.3 },
  gain:     0.65,
}

/**
 * Create a Rhodes electric piano component.
 *
 * Wraps {@link createFMSynth} with DX7 Rhodes defaults:
 * modRatio 1.273 (inharmonic "bell" character), modIndex 3, fast attack (0.005 s),
 * long tine decay (0.9 s). Classic Fender Rhodes / DX7 timbre.
 *
 * Signal path:
 * ```
 * modulator sine → modIndex gain (ADSR) → carrier.frequencyParam
 * carrier sine → amp VCA (ADSR) → output gain
 * ```
 *
 * @param context - Backend audio context.
 * @param props   - Rhodes configuration. Overrides Rhodes defaults; all fields optional.
 * @returns A {@link RhodesComponent} with `id` prefixed `rhodes` and `type` set to `'rhodes'`.
 *
 * @example
 * ```ts
 * // Default Rhodes at A3
 * const rh = createRhodes(context, { frequency: 220 })
 * rh.connect(context.destination)
 * rh.noteOn(context.currentTime)
 * rh.noteOff(context.currentTime + 1.5)
 * rh.dispose()
 *
 * // More aggressive modulation index
 * const bright = createRhodes(context, { modIndex: 6, gain: 0.5 })
 * ```
 *
 * @see {@link RhodesProps}
 * @see {@link RhodesComponent}
 * @throws Never — invalid props are silently clamped.
 */
export const createRhodes = (
  context: ScoreAudioContext,
  props?: RhodesProps,
): RhodesComponent => {
  // Merge Rhodes defaults with caller props (caller wins on all fields)
  const mergedProps: FMSynthProps = {
    ...RHODES_DEFAULTS,
    ...props,
    ampAdsr: { ...RHODES_DEFAULTS.ampAdsr, ...props?.ampAdsr },
    modAdsr: { ...RHODES_DEFAULTS.modAdsr, ...props?.modAdsr },
  }

  const inner: FMSynthComponent = createFMSynth(context, mergedProps)

  const component: RhodesComponent = {
    id:           uid('rhodes'),
    type:         'rhodes' as const,
    noteOn:       inner.noteOn,
    noteOff:      inner.noteOff,
    setFrequency: inner.setFrequency,
    setGain:      inner.setGain,

    connect: (destination: ScoreAudioNode) => {
      inner.connect(destination)
      return component
    },

    disconnect: () => {
      inner.disconnect()
      return component
    },

    dispose: inner.dispose,
  }

  return component
}
