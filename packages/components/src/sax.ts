// Sax — sawtooth oscillator + bandpass filter modelling a saxophone-like timbre.
//
// Architecture:
//   oscillator (sawtooth) → bandpass filter (freq 1200, Q 2) → gain → output
//
// Each trigger() call uses scheduleEnvelope for an ADSR shape (attack 15ms) so
// the tone has the characteristic sax articulation. Use trigger() from a sequencer
// callback or function pattern; call start() once to bring the oscillator up.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import { noteNameToHz } from '@score/musical'

/**
 * Configuration for {@link Sax}.
 */
export type SaxProps = {
  /**
   * Initial pitch as a note name (`'A4'`).
   * Default `'A4'` (440 Hz).
   */
  readonly note?: string
  /** Output gain 0–1. This is the peak envelope gain. Default `0.4`. */
  readonly gain?: number
}

/**
 * Sax component — extends {@link AudioComponent} with a trigger method for note articulation.
 */
export type SaxComponent = AudioComponent & {
  /** Start the underlying oscillator. Call once before any trigger(). */
  readonly start: (time?: number) => void
  /** Stop the underlying oscillator. */
  readonly stop: (time?: number) => void
  /**
   * Trigger a note with ADSR envelope — attack 15ms, decay 100ms, sustain 0.6, release 80ms.
   * @param time - Scheduled audio time for the note to start.
   * @param duration - Total note duration in seconds (attack + decay + sustain hold + release). Default `0.35`.
   */
  readonly trigger: (time: number, duration?: number) => void
  /**
   * Change the pitch at runtime.
   * @param hz - Target frequency in Hz.
   * @param time - Optional schedule time.
   */
  readonly setFrequency: (hz: number, time?: number) => void
}

/**
 * Create a Sax instrument — sawtooth oscillator with bandpass filter for a saxophone-like timbre.
 *
 * @param context - Backend audio context.
 * @param props - Sax configuration.
 * @returns SaxComponent with trigger() for sequencer use and setFrequency() for live pitch control.
 *
 * @example
 * ```ts
 * const sax = Sax(context, { note: 'A4', gain: 0.4 })
 * sax.connect(context.destination)
 * sax.start()
 * // In a sequencer callback:
 * sax.trigger(pos.time, 0.3)
 * ```
 */
export const Sax = (
  context: ScoreAudioContext,
  props?: SaxProps,
): SaxComponent => {
  const freq      = noteNameToHz(props?.note ?? 'A4')
  const peakGain  = props?.gain ?? 0.4

  const oscNode    = context.createOscillator({ type: 'sawtooth', frequency: freq })
  const filterNode = context.createFilter({ type: 'bandpass', frequency: 1200, Q: 2 })
  const gainNode   = context.createGain({ gain: 0 })  // starts silent — trigger() shapes it

  // Wire: osc → bandpass → gain → output
  oscNode.connect(filterNode)
  filterNode.connect(gainNode)

  const component: SaxComponent = {
    id: uid('sax'),
    type: 'sax' as const,

    start: (time?: number) => { oscNode.start(time) },
    stop:  (time?: number) => { oscNode.stop(time) },

    trigger: (time: number, duration = 0.35) => {
      gainNode.scheduleEnvelope({
        peak: peakGain,
        attack:  0.015,  // 15ms — classic sax tongue attack
        decay:   0.1,
        sustain: 0.6,
        release: 0.08,
        startTime: time,
        duration,
      })
    },

    setFrequency: (hz: number, time?: number) => { oscNode.setFrequency(hz, time) },

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
      try { oscNode.disconnect() } catch { /* already disconnected */ }
      try { filterNode.disconnect() } catch { /* already disconnected */ }
      try { gainNode.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
