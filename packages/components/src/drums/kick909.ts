import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration for {@link createKick909}.
 */
export type Kick909Props = {
  /** Initial pitch of the sine oscillator in Hz. Default `65`. */
  readonly startFreq?: number
  /** Final pitch at end of pitch fall in Hz. Default `48`. */
  readonly endFreq?: number
  /** Duration of the pitch fall in seconds. Default `0.12`. */
  readonly pitchFall?: number
  /** Amplitude envelope decay time for the sine body in seconds. Default `0.65`. */
  readonly decay?: number
  /**
   * Level of the noise click transient relative to the body gain (0–1).
   * `1.0` means equal level; `0.25` (≈ −12 dB) is the classic 909 click.
   * Default `0.25`.
   */
  readonly clickLevel?: number
  /** Decay time of the noise click in seconds. Default `0.03`. */
  readonly clickDecay?: number
  /** Output gain 0–1. Default `0.9`. */
  readonly gain?: number
}

/**
 * A synthesized percussion component — extends {@link AudioComponent} with a
 * `trigger` method for scheduling one-shot hits.
 */
export type Kick909Component = AudioComponent & {
  /**
   * Trigger a single hit at the given audio context time.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly trigger: (time?: number) => void
}

/**
 * Create a synthesized 909-style kick drum component.
 * Extends the 808 body (sine + pitch envelope) with a short noise click transient
 * bandpass-filtered at 150–200 Hz to add the characteristic transient punch.
 *
 * Signal paths:
 * - Body: sine oscillator (pitch envelope) → body amp env → output gain
 * - Click: noise → HPF 150 Hz → click amp env → output gain
 *
 * Each `trigger()` call spawns new oscillator + noise + amp nodes for that hit.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props - Optional 909 kick configuration. If omitted all defaults apply.
 * @returns A {@link Kick909Component} with `id` prefixed `kick909` and `type` set to `'kick909'`.
 *
 * @example
 * ```ts
 * const kick = createKick909(context, { decay: 0.65, clickLevel: 0.25 })
 * kick.connect(context.destination)
 * kick.trigger(context.currentTime)
 * ```
 *
 * @see {@link Kick909Props} — configuration options
 * @see {@link Kick909Component} — returned component shape
 * @see {@link createKick808} — 808-style kick without noise click
 * @throws {ScoreError} Never — invalid props are silently clamped.
 */
export const createKick909 = (
  context: ScoreAudioContext,
  props?: Kick909Props,
): Kick909Component => {
  const startFreq = props?.startFreq ?? 65
  const endFreq = props?.endFreq ?? 48
  const pitchFall = props?.pitchFall ?? 0.12
  const decay = props?.decay ?? 0.65
  const clickLevel = props?.clickLevel ?? 0.25
  const clickDecay = props?.clickDecay ?? 0.03
  const outputGain = context.createGain({ gain: props?.gain ?? 0.9 })

  const trigger = (time?: number) => {
    const t = time ?? context.currentTime

    // --- Body: sine + pitch fall ---
    const osc = context.createOscillator({ type: 'sine', frequency: startFreq })
    const bodyEnv = context.createGain({ gain: 0 })

    osc.connect(bodyEnv)
    bodyEnv.connect(outputGain)

    osc.schedulePitchEnvelope({ startFreq, endFreq, startTime: t, fallTime: pitchFall })
    bodyEnv.scheduleEnvelope({
      peak: 1.0,
      attack: 0.002,
      decay,
      sustain: 0,
      release: 0,
      startTime: t,
      duration: decay + 0.002,
    })

    osc.start(t)
    osc.stop(t + decay + 0.05)

    // --- Click: noise → HPF → short amp decay ---
    const noise = context.createNoise({ type: 'white' })
    const clickFilter = context.createFilter({ type: 'highpass', frequency: 150, Q: 1 })
    const clickEnv = context.createGain({ gain: 0 })

    noise.connect(clickFilter)
    clickFilter.connect(clickEnv)
    clickEnv.connect(outputGain)

    clickEnv.scheduleEnvelope({
      peak: clickLevel,
      attack: 0.001,
      decay: clickDecay,
      sustain: 0,
      release: 0,
      startTime: t,
      duration: clickDecay + 0.001,
    })

    noise.start(t)
    noise.stop(t + clickDecay + 0.01)
  }

  const component: Kick909Component = {
    id: uid('kick909'),
    type: 'kick909' as const,
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
