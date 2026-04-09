// @score/instruments — drums/cymbal.ts
// Generic hi-hat factory — parallel bandpass filter bank + HPF over white noise.
//
// Signal path:
//   white noise → 3× bandpass (3.5 kHz / 6 kHz / 10 kHz, ±2% detune per hit)
//              → summing gain → HPF (4 kHz) → amp envelope → outputGain
//
// Three resonant peaks model the complex overtone structure of real cymbal metal.
// Per-hit frequency detune prevents the machine-gun effect on rapid patterns.
//
// Variants in INSTRUMENT_REGISTRY:
//   'hihat'      → createGenericHihat  (this file)
//   'hihat808'   → createHihat808      (@score/components)
//
// PLANNED: cowbell808 (metallic oscillators, TR-808 style)

import type { ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import type { PercussionComponent } from '@score/components'

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Three resonant bands that model hi-hat cymbal character.
 *
 * - 3500 Hz: body — the cymbal "crack" on attack
 * - 6000 Hz: presence — mid sizzle and wire rattle
 * - 10000 Hz: air — top-end shimmer and wash
 *
 * Each band is randomly detuned ±2% on every trigger to prevent the
 * machine-gun effect when the same hit fires rapidly in sequence.
 */
const BANDPASS_BANDS = [
  { frequency: 3500, Q: 1.5 },
  { frequency: 6000, Q: 2.0 },
  { frequency: 10000, Q: 1.5 },
] as const

/** HPF cutoff removes low-end mud that bleeds through the bandpass bank. */
const HPF_FREQUENCY = 4000

/** Maximum random detune per hit — ±2% of each band's centre frequency. */
const DETUNE_RANGE = 0.02

// ── Props ─────────────────────────────────────────────────────────────────────

/** Configuration for {@link createGenericHihat}. */
export type GenericHihatProps = {
  /** When `true`, uses longer open hi-hat decay. Overridden by an explicit `decay`. Default `false`. */
  readonly open?: boolean
  /**
   * Amplitude decay time in seconds.
   * Typical range: closed `0.04–0.08`, open `0.2–0.5`.
   * Defaults to `0.06` (closed) or `0.3` (open).
   */
  readonly decay?: number
  /** Output gain 0–1. Default `0.25`. */
  readonly gain?: number
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a generic synthesized hi-hat component.
 *
 * Signal path:
 * ```
 * white noise → 3× bandpass (3.5 / 6 / 10 kHz, ±2% detune per hit)
 *             → summing gain → HPF (4 kHz) → amp envelope → outputGain
 * ```
 *
 * Three resonant peaks model the complex overtone structure of real cymbal metal.
 * Per-hit frequency detune (±2%) prevents the machine-gun effect on rapid patterns.
 * Open hi-hat uses a longer default decay (`0.3 s`); closed defaults to `0.06 s`.
 *
 * Use {@link createHihat808} from `@score/components` for the TR-808 model
 * (6 detuned square oscillators matched to Roland hardware ratios).
 *
 * @param context - Backend audio context.
 * @param props   - Optional hi-hat configuration.
 * @returns A {@link PercussionComponent} with `type` set to `'hihat'`.
 *
 * @example
 * ```ts
 * const hat     = createGenericHihat(context, { gain: 0.3 })
 * const openHat = createGenericHihat(context, { open: true, gain: 0.25 })
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
    const gain = props.gain  ?? 0.25
    const dur  = props.decay ?? (props.open ? 0.3 : 0.06)

    // Noise source — all bandpass bands share one noise node
    const noise = context.createNoise({ type: 'white' })

    // Summing bus — normalises level across the parallel bank
    const sumGain = context.createGain({ gain: 1 / BANDPASS_BANDS.length })

    // Parallel bandpass bank — each band detuned ±2% per hit
    const bands = BANDPASS_BANDS.map(({ frequency, Q }) => {
      const detunedFreq = frequency * (1 + (Math.random() * DETUNE_RANGE * 2 - DETUNE_RANGE))
      const bp = context.createFilter({ type: 'bandpass', frequency: detunedFreq, Q })
      noise.connect(bp)
      bp.connect(sumGain)
      return bp
    })

    // HPF strips residual low-end mud after the bandpass bank
    const hpf = context.createFilter({ type: 'highpass', frequency: HPF_FREQUENCY })
    const vol = context.createGain({ gain: 0 })

    sumGain.connect(hpf)
    hpf.connect(vol)
    vol.connect(outputGain)

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

    // Clean up all nodes once noise stops — noise.onended fires after stop()
    noise.onended = () => {
      try { noise.disconnect()    } catch { /* ok */ }
      for (const bp of bands)  { try { bp.disconnect()      } catch { /* ok */ } }
      try { sumGain.disconnect()  } catch { /* ok */ }
      try { hpf.disconnect()      } catch { /* ok */ }
      try { vol.disconnect()      } catch { /* ok */ }
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
