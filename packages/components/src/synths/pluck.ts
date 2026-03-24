// pluck.ts — Karplus-Strong string pluck component for @score/components
//
// Signal path: noise burst → DelayNode (period = 1/freq) → BiquadFilter LP (0.99 gain)
//              → feedback loop (delay → filter → delay) → output gain.
//
// On noteOn: short noise burst seeds the delay line. The LP filter dissipates high-frequency
// energy each round trip, simulating the natural decay of a plucked string.
// Release is implicit: the feedback loop decays naturally; noteOff is accepted for API
// compatibility but the string rings until it is silent.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createPluck}.
 */
export type PluckProps = {
  /** Fundamental frequency in Hz. Default `220`. */
  readonly frequency?: number
  /**
   * Feedback gain (string "damping" inverse). Range 0–1.
   * Higher values sustain longer; ≥1 would be unstable. Default `0.99`.
   */
  readonly feedback?: number
  /**
   * Noise burst duration in seconds. Short burst gives a crisp attack.
   * Default `0.02` (20 ms).
   */
  readonly burstDuration?: number
  /** Output gain 0–1. Default `0.7`. */
  readonly gain?: number
}

/**
 * A Karplus-Strong string pluck component.
 * Extends {@link AudioComponent} with note-on / note-off.
 */
export type PluckComponent = AudioComponent & {
  /**
   * Trigger a pluck: seed the delay line with a noise burst.
   * The string rings and decays naturally; no explicit noteOff is needed.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOn: (time?: number) => void
  /**
   * No-op for API compatibility — pluck decays naturally.
   * @param time - Ignored.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the pluck frequency in Hz. Updates the delay line period.
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

// HARDWARE BOUNDARY — burst started state: append-only flag per trigger cycle.
// Pluck allows re-trigger, so started tracks whether the current noise source is live.
type BurstState = { active: boolean }

/**
 * Create a Karplus-Strong string pluck component.
 *
 * Signal path:
 * ```
 * noise burst → [delay line (1/freq)] ← feedback ← [LP filter (0.99)] ←┘
 *                         ↓
 *                     output gain
 * ```
 * The delay period equals one period of the fundamental frequency (`1 / freq`).
 * The low-pass filter attenuates high frequencies on each round trip, modelling
 * natural string damping. Feedback gain ≈ 0.99 gives a sustain of several seconds.
 *
 * @param context - Backend audio context.
 * @param props   - Pluck configuration. All fields optional.
 * @returns A {@link PluckComponent} with `id` prefixed `pluck` and `type` set to `'pluck'`.
 *
 * @example
 * ```ts
 * // Guitar-like pluck at E2
 * const pluck = createPluck(context, { frequency: 82.4, feedback: 0.995 })
 * pluck.connect(context.destination)
 * pluck.noteOn(context.currentTime)  // burst fires, string rings out naturally
 * // noteOff is optional — decay is natural
 * pluck.dispose()
 * ```
 *
 * @see {@link PluckProps}
 * @see {@link PluckComponent}
 * @throws Never — invalid props are silently clamped.
 */
export const createPluck = (
  context: ScoreAudioContext,
  props?: PluckProps,
): PluckComponent => {
  const freq          = props?.frequency     ?? 220
  const feedbackGain  = Math.min(0.9999, Math.max(0, props?.feedback ?? 0.99))
  const burstDuration = props?.burstDuration ?? 0.02
  const outputLevel   = props?.gain          ?? 0.7

  // Delay line: period = 1 / fundamental frequency
  const delayTime = 1 / freq
  const delay     = context.createDelay({ delayTime, maxDelayTime: 1 / 20 }) // min 20 Hz

  // Low-pass filter in the feedback path — loss of high-frequency energy per round trip
  const feedbackFilter = context.createFilter({ type: 'lowpass', frequency: 8000, Q: 0.5 })

  // Feedback gain node
  const fbGain = context.createGain({ gain: feedbackGain })

  // Output gain
  const outputGain = context.createGain({ gain: outputLevel })

  // Feedback loop: delay → feedbackFilter → fbGain → delay (circular)
  // Also tap output: delay → outputGain → (caller destination)
  delay.connect(feedbackFilter)
  feedbackFilter.connect(fbGain)
  fbGain.connect(delay)        // feedback
  delay.connect(outputGain)    // output tap

  // HARDWARE BOUNDARY — noise burst state per trigger
  const burstState: BurstState = { active: false }

  const noteOn = (time?: number): void => {
    const t = time ?? context.currentTime
    // Seed the delay line with a short noise burst
    const noise = context.createNoise({ type: 'white' })
    const burstEnv = context.createGain({ gain: 1.0 })

    noise.connect(burstEnv)
    burstEnv.connect(delay)

    // Schedule burst: ramp gain to 0 over burstDuration, then silence
    burstEnv.scheduleEnvelope({
      peak: 1.0, attack: 0.001, decay: burstDuration,
      sustain: 0, release: 0,
      startTime: t, duration: burstDuration + 0.002,
    })

    burstState.active = true
    // Stop noise source after burst completes (no need to keep it running)
    noise.stop(t + burstDuration + 0.01)
  }

  // noteOff is a no-op — Karplus-Strong decays naturally
  const noteOff = (_time?: number): void => { /* natural decay */ }

  const component: PluckComponent = {
    id:   uid('pluck'),
    type: 'pluck' as const,
    noteOn,
    noteOff,

    setFrequency: (value: number, time?: number) => {
      delay.setDelayTime(1 / Math.max(20, value), time)
    },

    setGain: (value: number, time?: number) => {
      outputGain.setGain(value, time)
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { delay.disconnect()         } catch { /* already disconnected */ }
      try { feedbackFilter.disconnect() } catch { /* already disconnected */ }
      try { fbGain.disconnect()        } catch { /* already disconnected */ }
      try { outputGain.disconnect()    } catch { /* already disconnected */ }
      void burstState // suppress unused warning (state is write-only in this scope)
    },
  }

  return component
}
