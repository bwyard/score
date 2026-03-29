// @score/instruments — drums/snare.ts
// Generic snare drum factory — sine transient body + bandpass-filtered noise rattle.
//
// Variants in INSTRUMENT_REGISTRY:
//   'snare'     → createGenericSnare  (this file)
//   'snare909'  → createSnare909      (@score/components)
//
// PLANNED: clap909 (burst-gated noise, 3–4 layers), rimshot (metallic click)

import type { ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import type { PercussionComponent } from '@score/components'

// ── Props ─────────────────────────────────────────────────────────────────────

/** Configuration for {@link createGenericSnare}. */
export type GenericSnareProps = {
  /** Noise burst decay in seconds. Default `0.12`. */
  readonly decay?: number
  /** Bandpass filter centre frequency in Hz — higher = brighter wire rattle. Default `5000`. */
  readonly tone?: number
  /** Output gain 0–1. Default `0.5`. */
  readonly gain?: number
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a generic synthesized snare drum component.
 *
 * Signal path: sine oscillator (body transient) + bandpass-filtered white noise (rattle)
 * → output. Each `trigger()` spawns ephemeral nodes that auto-stop when envelopes end.
 *
 * Use {@link createSnare909} from `@score/components` for the TR-909 model
 * (2 triangle oscillators + noise HPF).
 *
 * @param context - Backend audio context.
 * @param props   - Optional snare configuration.
 * @returns A {@link PercussionComponent} with `type` set to `'snare'`.
 *
 * @example
 * ```ts
 * const snare = createGenericSnare(context, { decay: 0.15, tone: 4000 })
 * snare.connect(context.destination)
 * snare.trigger(context.currentTime)
 * ```
 */
export const createGenericSnare = (
  context: ScoreAudioContext,
  props: GenericSnareProps = {},
): PercussionComponent => {
  const outputGain = context.createGain({ gain: 1.0 })

  const trigger = (time?: number): void => {
    const t     = time ?? context.currentTime
    const gain  = props.gain  ?? 0.5
    const decay = props.decay ?? 0.12
    const tone  = props.tone  ?? 5000

    // Body — short sine transient (the crack/attack)
    const body  = context.createOscillator({ type: 'sine', frequency: 185 })
    const bGain = context.createGain({ gain: 0 })
    body.connect(bGain)
    bGain.connect(outputGain)
    bGain.scheduleEnvelope({
      peak:      gain * 0.7,
      attack:    0.002,
      decay:     0.06,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  0.09,
    })
    body.start(t)
    body.setFrequency(100, t + 0.05)
    body.stop(t + 0.09)
    body.onended = () => {
      try { body.disconnect()  } catch { /* ok */ }
      try { bGain.disconnect() } catch { /* ok */ }
    }

    // Noise — filtered burst (the snare wire rattle)
    const noise  = context.createNoise({ type: 'white' })
    const filter = context.createFilter({ type: 'bandpass', frequency: tone, Q: 0.8 })
    const nGain  = context.createGain({ gain: 0 })
    noise.connect(filter)
    filter.connect(nGain)
    nGain.connect(outputGain)
    nGain.scheduleEnvelope({
      peak:      gain * 0.5,
      attack:    0.001,
      decay,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  decay + 0.02,
    })
    noise.start(t)
    noise.stop(t + decay + 0.02)
    noise.onended = () => {
      try { noise.disconnect()  } catch { /* ok */ }
      try { filter.disconnect() } catch { /* ok */ }
      try { nGain.disconnect()  } catch { /* ok */ }
    }
  }

  const component: PercussionComponent = {
    id:      uid('snare'),
    type:    'snare' as const,
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
