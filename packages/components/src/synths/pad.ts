// pad.ts — Pad instrument component for @score/components
//
// Wraps SubtractiveSynth with pad-optimised defaults:
// slow attack (0.3s), long release (1.2s), 2-pair unison, 8¢ detune, 2000Hz filter.
// Callers can override any field via props.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import { createSubtractiveSynth } from './subtractive.js'
import type { SubtractiveSynthComponent, SubtractiveSynthProps } from './subtractive.js'

/**
 * Configuration props for {@link createPad}.
 * All fields mirror {@link SubtractiveSynthProps} — any field not set uses pad defaults.
 */
export type PadProps = SubtractiveSynthProps

/**
 * A pad instrument component — slow attack, long release, fat unison.
 * Extends {@link AudioComponent} with note-on / note-off.
 */
export type PadComponent = AudioComponent & {
  /**
   * Gate a note on: trigger amp + filter attack-decay-sustain.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOn: (time?: number) => void
  /**
   * Gate a note off: trigger amp + filter release.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the oscillator frequency in Hz.
   * @param value - Target frequency in Hz.
   * @param time  - Optional schedule time.
   */
  readonly setFrequency: (value: number, time?: number) => void
  /**
   * Set the filter base cutoff frequency in Hz.
   * @param value - Cutoff frequency in Hz.
   * @param time  - Optional schedule time.
   */
  readonly setFilterFrequency: (value: number, time?: number) => void
  /**
   * Set the output gain.
   * @param value - Gain 0–1.
   * @param time  - Optional schedule time.
   */
  readonly setGain: (value: number, time?: number) => void
}

// Pad defaults — applied as base, caller props override
const PAD_DEFAULTS: SubtractiveSynthProps = {
  wave:   'sawtooth',
  unison: 2,
  detune: 8,
  filter: { type: 'lowpass', frequency: 2000, Q: 1, envDepth: 600,
            adsr: { attack: 0.4, decay: 0.5, sustain: 0.6, release: 1.2 } },
  adsr:   { attack: 0.3, decay: 0.2, sustain: 0.8, release: 1.2 },
  gain:   0.6,
}

/**
 * Create a pad instrument component.
 *
 * Wraps {@link createSubtractiveSynth} with pad-optimised defaults:
 * slow attack (0.3 s), long release (1.2 s), 2-pair unison, 8¢ detune, lowpass filter at 2000 Hz.
 *
 * Signal path: 4 detuned oscillators → unison mixer → resonant lowpass filter (filter ADSR)
 * → amp VCA (amp ADSR) → output gain.
 *
 * @param context - Backend audio context.
 * @param props   - Pad configuration. Overrides pad defaults; all fields optional.
 * @returns A {@link PadComponent} with `id` prefixed `pad` and `type` set to `'pad'`.
 *
 * @example
 * ```ts
 * // Default pad — slow attack, long release
 * const pad = createPad(context, { frequency: 220 })
 * pad.connect(context.destination)
 * pad.noteOn(context.currentTime)
 * pad.noteOff(context.currentTime + 2.0)
 * pad.dispose()
 *
 * // Custom filter — brighter pad
 * const bright = createPad(context, { filter: { frequency: 3500, Q: 2 }, gain: 0.5 })
 * ```
 *
 * @see {@link PadProps}
 * @see {@link PadComponent}
 * @throws Never — invalid props are silently clamped.
 */
export const createPad = (
  context: ScoreAudioContext,
  props?: PadProps,
): PadComponent => {
  // Merge pad defaults with caller props (caller wins on all fields)
  const mergedProps: SubtractiveSynthProps = {
    ...PAD_DEFAULTS,
    ...props,
    filter: { ...PAD_DEFAULTS.filter, ...props?.filter,
              adsr: { ...PAD_DEFAULTS.filter?.adsr, ...props?.filter?.adsr } },
    adsr:   { ...PAD_DEFAULTS.adsr, ...props?.adsr },
  }

  const inner: SubtractiveSynthComponent = createSubtractiveSynth(context, mergedProps)

  const component: PadComponent = {
    id:                 uid('pad'),
    type:               'pad' as const,
    noteOn:             inner.noteOn,
    noteOff:            inner.noteOff,
    setFrequency:       inner.setFrequency,
    setFilterFrequency: inner.setFilterFrequency,
    setGain:            inner.setGain,

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
