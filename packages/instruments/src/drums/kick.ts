// @score/instruments — drums/kick.ts
// Generic kick drum factory — sine oscillator with pitch drop, amplitude envelope.
// Signal path: sine osc → pitch-drop → amp envelope gain → output gain.
//
// Variants in INSTRUMENT_REGISTRY:
//   'kick'     → createGenericKick   (this file)
//   'kick808'  → createKick808       (@score/components)
//   'kick909'  → createKick909       (@score/components)
//
// PLANNED: kickHardstyle (pitch sweeps UP then drops), kickHardcore (waveshaper distortion)

import type { ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import type { PercussionComponent } from '@score/components'

// ── Props ─────────────────────────────────────────────────────────────────────

/** Configuration for {@link createGenericKick}. */
export type GenericKickProps = {
  /** Sine oscillator start frequency in Hz. Default `80`. */
  readonly frequency?: number
  /** Pitch drop time in seconds — how long the pitch fall takes. Default `0.1`. */
  readonly pitchDrop?: number
  /** Output gain 0–1. Default `0.85`. */
  readonly gain?: number
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a generic synthesized kick drum component.
 *
 * Signal path: sine oscillator (pitch envelope) → amp envelope gain → output.
 * Each `trigger()` spawns ephemeral nodes that auto-stop when the envelope ends.
 *
 * This is the engine-default kick (no `model` prop) — simpler than 808/909.
 * Use {@link createKick808} or {@link createKick909} from `@score/components`
 * for the named-model variants.
 *
 * @param context - Backend audio context.
 * @param props   - Optional kick configuration.
 * @returns A {@link PercussionComponent} with `type` set to `'kick'`.
 *
 * @example
 * ```ts
 * const kick = createGenericKick(context, { frequency: 80, gain: 0.9 })
 * kick.connect(context.destination)
 * kick.trigger(context.currentTime)
 * ```
 */
export const createGenericKick = (
  context: ScoreAudioContext,
  props: GenericKickProps = {},
): PercussionComponent => {
  const outputGain = context.createGain({ gain: props.gain ?? 0.85 })

  const trigger = (time?: number): void => {
    const t          = time ?? context.currentTime
    const freq       = props.frequency ?? 80
    const pitchDrop  = props.pitchDrop ?? 0.1
    const gain       = props.gain      ?? 0.85
    const dur        = pitchDrop + 0.15

    const osc = context.createOscillator({ type: 'sine', frequency: freq })
    const vol = context.createGain({ gain: 0 })
    osc.connect(vol)
    vol.connect(outputGain)

    // 3 ms attack ramp prevents hard-onset click; decay follows the pitch drop
    vol.scheduleEnvelope({
      peak:      gain,
      attack:    0.003,
      decay:     dur - 0.003,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  dur,
    })
    osc.start(t)
    osc.setFrequency(30, t + pitchDrop)
    osc.stop(t + dur)
    osc.onended = () => {
      try { osc.disconnect() } catch { /* already disconnected */ }
      try { vol.disconnect() } catch { /* already disconnected */ }
    }
  }

  const component: PercussionComponent = {
    id:      uid('kick'),
    type:    'kick' as const,
    trigger,

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },
    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },
    dispose: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
