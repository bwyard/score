// ADSR — Standalone Attack-Decay-Sustain-Release envelope
// Trigger on any BackendGainNode for one-shot amplitude shaping

import type { BackendContext, BackendGainNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration for {@link createADSR}.
 */
export type ADSRProps = {
  /** Attack time in seconds — ramp from silence to peak. Default `0.005`. */
  readonly attack?: number
  /** Decay time in seconds — fall from peak to sustain level. Default `0.1`. */
  readonly decay?: number
  /** Sustain level `0–1` — fraction of peak held during note on. Default `0.7`. */
  readonly sustain?: number
  /** Release time in seconds — fade from sustain level to silence. Default `0.2`. */
  readonly release?: number
  /** Peak gain level reached at top of attack. Default `1.0`. */
  readonly peak?: number
}

/**
 * Create a standalone ADSR envelope that can be triggered on any gain node.
 * Unlike instrument-embedded envelopes, this is a reusable primitive —
 * use the same ADSR instance across multiple notes or instruments.
 *
 * The envelope shape: silence → attack → peak → decay → sustain → release → silence.
 *
 * @param _context - Backend audio context. Accepted for API consistency; reserved for future scheduling extensions.
 * @param props - Default ADSR parameter values. All overridable per trigger call.
 * @returns Object with `trigger(gainNode, startTime, duration?)` to fire the envelope.
 *
 * @example
 * ```ts
 * import { createADSR } from '@score/modulation'
 *
 * const adsr = createADSR(context, { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 })
 *
 * // In sequencer callback — fire the envelope at the scheduled note time:
 * adsr.trigger(myGainNode, context.currentTime)
 *
 * // With explicit duration (e.g. for a short staccato note):
 * adsr.trigger(myGainNode, context.currentTime, 0.2)
 * ```
 *
 * @see {@link createLFO} — for continuous oscillating modulation
 */
export const createADSR = (
  _context: BackendContext,
  props?: ADSRProps,
): {
  readonly id: string
  readonly type: 'adsr'
  readonly trigger: (gainNode: BackendGainNode, startTime: number, duration?: number) => void
  readonly dispose: () => void
} => {
  const attack  = props?.attack  ?? 0.005
  const decay   = props?.decay   ?? 0.1
  const sustain = props?.sustain ?? 0.7
  const release = props?.release ?? 0.2
  const peak    = props?.peak    ?? 1.0

  return {
    id: uid('adsr'),
    type: 'adsr' as const,

    /**
     * Trigger the envelope on a gain node at a specific time.
     *
     * @param gainNode - The gain node to envelope — its amplitude will follow the ADSR curve.
     * @param startTime - Schedule time in seconds (use `context.currentTime` based values).
     * @param duration - Total note duration in seconds. Defaults to `attack + decay + release + 0.05`.
     */
    trigger: (gainNode: BackendGainNode, startTime: number, duration?: number) => {
      const noteDur = duration ?? (attack + decay + release + 0.05)
      gainNode.scheduleEnvelope({
        peak,
        attack,
        decay,
        sustain,
        release,
        startTime,
        duration: noteDur,
      })
    },

    dispose: () => { /* no audio nodes to clean up — envelope targets external gain nodes */ },
  }
}
