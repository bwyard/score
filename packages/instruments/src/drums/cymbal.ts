// @score/instruments — drums/cymbal.ts
// Generic hi-hat factory — highpass-filtered white noise with short amplitude decay.
//
// Variants in INSTRUMENT_REGISTRY:
//   'hihat'      → createGenericHihat  (this file)
//   'hihat808'   → createHihat808      (@score/components)
//
// PLANNED: cowbell808 (metallic oscillators, TR-808 style)

import type { ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import type { PercussionComponent } from '@score/components'

// ── Props ─────────────────────────────────────────────────────────────────────

/** Configuration for {@link createGenericHihat}. */
export type GenericHihatProps = {
  /** When `true`, uses longer open hi-hat decay. Default `false`. */
  readonly open?: boolean
  /** Output gain 0–1. Default `0.25`. */
  readonly gain?: number
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a generic synthesized hi-hat component.
 *
 * Signal path: white noise → highpass filter (8 kHz) → amp envelope → output.
 * Each `trigger()` spawns ephemeral nodes. Open hi-hat decay = `0.3 s`; closed = `0.06 s`.
 *
 * Use {@link createHihat808} from `@score/components` for the TR-808 model
 * (6 detuned square oscillators).
 *
 * @param context - Backend audio context.
 * @param props   - Optional hi-hat configuration.
 * @returns A {@link PercussionComponent} with `type` set to `'hihat'`.
 *
 * @example
 * ```ts
 * const hat = createGenericHihat(context, { open: true, gain: 0.3 })
 * hat.connect(context.destination)
 * hat.trigger(context.currentTime)
 * ```
 */
export const createGenericHihat = (
  context: ScoreAudioContext,
  props: GenericHihatProps = {},
): PercussionComponent => {
  const outputGain = context.createGain({ gain: 1.0 })

  const trigger = (time?: number): void => {
    const t    = time ?? context.currentTime
    const gain = props.gain ?? 0.25
    const dur  = props.open ? 0.3 : 0.06

    const noise  = context.createNoise({ type: 'white' })
    const filter = context.createFilter({ type: 'highpass', frequency: 8000 })
    const vol    = context.createGain({ gain: 0 })
    noise.connect(filter)
    filter.connect(vol)
    vol.connect(outputGain)

    // 1 ms attack preserves crisp transient; decay by open/closed mode
    vol.scheduleEnvelope({
      peak:      gain,
      attack:    0.001,
      decay:     dur - 0.001,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  dur,
    })
    noise.start(t)
    noise.stop(t + dur)
    noise.onended = () => {
      try { noise.disconnect()  } catch { /* ok */ }
      try { filter.disconnect() } catch { /* ok */ }
      try { vol.disconnect()    } catch { /* ok */ }
    }
  }

  const component: PercussionComponent = {
    id:      uid('hihat'),
    type:    'hihat' as const,
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
