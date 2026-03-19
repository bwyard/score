// Theremin — continuous-pitch sine tone with LFO vibrato.
//
// Architecture:
//   oscillator (sine) → vibrato LFO wired to oscillator frequencyParam
//   oscillator → gain → output
//
// The frequency param is modulated at `vibratoRate` Hz with `vibratoDepth` Hz amplitude.
// setFrequency() changes the oscillator's base pitch at runtime.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import { createLFO } from '@score/modulation'
import { noteNameToHz } from '@score/musical'

/**
 * Configuration for {@link Theremin}.
 */
export type ThereminProps = {
  /**
   * Initial pitch as a note name (`'A4'`) or raw Hz value.
   * Default `'A4'` (440 Hz).
   */
  readonly note?: string
  /**
   * Vibrato rate in Hz — how fast the pitch wavers.
   * `0` disables vibrato. Default `5`.
   */
  readonly vibratoRate?: number
  /**
   * Vibrato depth in Hz — how wide the pitch wavers.
   * `8` = ±8 Hz at 440 Hz base. Default `8`.
   */
  readonly vibratoDepth?: number
  /** Output gain 0–1. Default `0.4`. */
  readonly gain?: number
}

/**
 * Theremin component — extends {@link AudioComponent} with continuous pitch and gain controls.
 */
export type ThereminComponent = AudioComponent & {
  /** Start the theremin oscillator. Call once, then use setFrequency/setGain live. */
  readonly start: (time?: number) => void
  /** Stop the theremin oscillator. */
  readonly stop: (time?: number) => void
  /**
   * Set the base frequency in Hz at runtime.
   * @param hz - Target frequency.
   * @param time - Optional schedule time. Defaults to `context.currentTime`.
   */
  readonly setFrequency: (hz: number, time?: number) => void
  /**
   * Set the output gain at runtime.
   * @param value - Gain 0–1.
   * @param time - Optional schedule time.
   */
  readonly setGain: (value: number, time?: number) => void
}

/**
 * Create a Theremin instrument — continuous sine tone with LFO vibrato.
 *
 * @param context - Backend audio context.
 * @param props - Theremin configuration.
 * @returns ThereminComponent with live frequency and gain controls.
 *
 * @example
 * ```ts
 * const theremin = Theremin(context, { note: 'A4', vibratoRate: 5, vibratoDepth: 8, gain: 0.4 })
 * theremin.connect(context.destination)
 * theremin.start()
 * // Live control
 * theremin.setFrequency(550)    // glide up
 * theremin.setGain(0.0)         // silence (hand-off)
 * ```
 */
export const Theremin = (
  context: ScoreAudioContext,
  props?: ThereminProps,
): ThereminComponent => {
  const baseFreq   = noteNameToHz(props?.note ?? 'A4')
  const vibratoRate  = props?.vibratoRate  ?? 5
  const vibratoDepth = props?.vibratoDepth ?? 8
  const initialGain  = props?.gain ?? 0.4

  const oscNode  = context.createOscillator({ type: 'sine', frequency: baseFreq })
  const gainNode = context.createGain({ gain: initialGain })

  // LFO modulates oscillator frequency for vibrato
  const lfo = createLFO(context, { rate: vibratoRate, shape: 'sine', depth: vibratoDepth })
  lfo.connect(oscNode.frequencyParam)

  // Wire: osc → gain → output
  oscNode.connect(gainNode)

  const component: ThereminComponent = {
    id: uid('theremin'),
    type: 'theremin' as const,

    start: (time?: number) => { oscNode.start(time) },
    stop:  (time?: number) => { oscNode.stop(time) },

    setFrequency: (hz: number, time?: number) => { oscNode.setFrequency(hz, time) },
    setGain:      (value: number, time?: number) => { gainNode.setGain(value, time) },

    connect: (destination: ScoreAudioNode) => {
      gainNode.connect(destination)
      return component
    },

    disconnect: () => {
      try { gainNode.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { oscNode.stop() } catch { /* already stopped */ }
      lfo.dispose()
      try { oscNode.disconnect() } catch { /* already disconnected */ }
      try { gainNode.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
