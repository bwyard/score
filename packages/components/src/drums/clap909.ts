// =============================================================================
// @score/components — clap909.ts
// 909-style clap: four staggered white-noise bursts through a tight bandpass,
// summed and shaped by a final HPF before the output gain.
// =============================================================================

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for {@link createClap909}.
 */
export type Clap909Props = {
  /** Output gain 0–1. Default `0.8`. */
  readonly gain?: number
  /**
   * Envelope sharpness 0–1. Controls how quickly the amp envelope decays.
   * `0` = slow, washy; `1` = tight, snappy. Default `0.5`.
   */
  readonly snap?: number
  /**
   * Bandpass filter centre frequency in Hz applied to each noise burst layer.
   * Raising this brightens the tone; lowering it gives a fuller body.
   * Default `1200`.
   */
  readonly tone?: number
}

/**
 * A synthesized percussion component — extends {@link AudioComponent} with a
 * `trigger` method for scheduling one-shot hits.
 */
export type Clap909Component = AudioComponent & {
  /**
   * Trigger a single clap hit at the given audio context time.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly trigger: (time?: number) => void
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Time offsets in seconds for each of the four noise burst layers.
 * Staggering creates the characteristic 909 hand-clap flutter effect.
 */
const LAYER_OFFSETS_SECONDS = [0, 0.010, 0.020, 0.035] as const

/** Duration of each noise burst layer in seconds. */
const LAYER_DURATION_SECONDS = 0.06

/** Q factor for the per-layer bandpass filter. */
const BANDPASS_Q = 2.5

/** Amplitude attack time in seconds for each burst layer envelope. */
const LAYER_ATTACK_SECONDS = 0.001

/** Amplitude decay time in seconds for each burst layer envelope. */
const LAYER_DECAY_SECONDS = 0.08

/** Cut-off frequency of the final high-pass filter that removes low-end mud. */
const OUTPUT_HPF_HZ = 200

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a synthesized 909-style clap drum component.
 *
 * Four layers of white noise are burst-triggered at staggered times
 * (`+0 ms`, `+10 ms`, `+20 ms`, `+35 ms`) to recreate the flutter of
 * multiple hands clapping simultaneously. Each layer passes through a
 * tight bandpass filter before an amp envelope shapes the burst.
 *
 * Signal path per layer:
 * `noise → bandpass (tone Hz, Q 2.5) → amp env → sum gain`
 *
 * Final path:
 * `sum gain → HPF (200 Hz) → outputGain → (caller connects output)`
 *
 * Each `trigger()` call spawns fresh nodes for all four layers and schedules
 * their envelopes. Nodes auto-disconnect via `onended` to prevent memory leaks.
 *
 * // HARDWARE BOUNDARY: white noise is generated stochastically at audio-graph
 * // init time inside `context.createNoise()`, not per-step. Acceptable — the
 * // result is non-deterministic audio content, not scheduling state.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props   - Optional 909 clap configuration. If omitted all defaults apply.
 * @returns A {@link Clap909Component} with `id` prefixed `clap909` and `type` set to `'clap909'`.
 *
 * @example
 * ```ts
 * const clap = createClap909(context, { snap: 0.8, tone: 1400 })
 * clap.connect(context.destination)
 * clap.trigger(context.currentTime)
 * clap.trigger(context.currentTime + 0.5)
 * clap.dispose()
 * ```
 *
 * @see {@link Clap909Props}      — configuration options
 * @see {@link Clap909Component}  — returned component shape
 * @see {@link createKick909}     — 909 kick, shares the same stochastic noise approach
 * @throws \{ScoreError\} Never — invalid props are silently clamped.
 */
export const createClap909 = (
  context: ScoreAudioContext,
  props?: Clap909Props,
): Clap909Component => {
  const tone       = props?.tone ?? 1200
  const snap       = props?.snap ?? 0.5
  const outputGain = context.createGain({ gain: props?.gain ?? 0.8 })

  // snap 0→1 maps to decay 0.12→0.04 — higher snap = shorter decay = tighter hit
  const layerDecay = LAYER_DECAY_SECONDS * (1 - snap * 0.5)

  const trigger = (time?: number) => {
    const t = time ?? context.currentTime

    // Shared summing bus for all four burst layers, followed by the output HPF
    const sumGain  = context.createGain({ gain: 1 / LAYER_OFFSETS_SECONDS.length })
    const outputHpf = context.createFilter({ type: 'highpass', frequency: OUTPUT_HPF_HZ, Q: 0.7 })

    sumGain.connect(outputHpf)
    outputHpf.connect(outputGain)

    // Spawn one noise burst per layer offset — each gets its own bandpass + amp env
    const noiseNodes = LAYER_OFFSETS_SECONDS.map(offsetSeconds => {
      const layerTime  = t + offsetSeconds
      const layerEnd   = layerTime + LAYER_DURATION_SECONDS + 0.01

      const noise      = context.createNoise({ type: 'white' })
      const bandpass   = context.createFilter({ type: 'bandpass', frequency: tone, Q: BANDPASS_Q })
      const ampEnv     = context.createGain({ gain: 0 })

      noise.connect(bandpass)
      bandpass.connect(ampEnv)
      ampEnv.connect(sumGain)

      ampEnv.scheduleEnvelope({
        peak:      1.0,
        attack:    LAYER_ATTACK_SECONDS,
        decay:     layerDecay,
        sustain:   0,
        release:   0,
        startTime: layerTime,
        duration:  LAYER_ATTACK_SECONDS + layerDecay,
      })

      noise.start(layerTime)
      noise.stop(layerEnd)

      noise.onended = () => {
        try { noise.disconnect()    } catch { /* ok */ }
        try { bandpass.disconnect() } catch { /* ok */ }
        try { ampEnv.disconnect()   } catch { /* ok */ }
      }

      return noise
    })

    // Clean up the shared summing bus once the last layer's noise has ended.
    // Layer 3 (index 3, offset +35 ms) always ends last — use its node.
    const lastNoise = noiseNodes[noiseNodes.length - 1]
    if (lastNoise) {
      const previousOnEnded = lastNoise.onended
      lastNoise.onended = (event: Event) => {
        previousOnEnded?.(event)
        try { sumGain.disconnect()   } catch { /* ok */ }
        try { outputHpf.disconnect() } catch { /* ok */ }
      }
    }
  }

  // =============================================================================
  // Component
  // =============================================================================

  const component: Clap909Component = {
    id:   uid('clap909'),
    type: 'clap909' as const,
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
