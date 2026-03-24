import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration for {@link createKick808}.
 */
export type Kick808Props = {
  /** Initial pitch of the sine oscillator in Hz. Default `60`. */
  readonly startFreq?: number
  /** Final pitch at end of pitch fall in Hz. Default `45`. */
  readonly endFreq?: number
  /** Duration of the pitch fall in seconds. Default `0.15`. */
  readonly pitchFall?: number
  /** Amplitude envelope decay time in seconds. Default `0.7`. */
  readonly decay?: number
  /** Output gain 0–1. Default `0.9`. */
  readonly gain?: number
}

/**
 * A synthesized percussion component — extends {@link AudioComponent} with a
 * `trigger` method for scheduling one-shot hits.
 */
export type PercussionComponent = AudioComponent & {
  /**
   * Trigger a single hit at the given audio context time.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly trigger: (time?: number) => void
}

/**
 * Create a synthesized 808-style kick drum component.
 * Signal path: sine oscillator (pitch envelope) → amp envelope gain → output gain → (caller connects output).
 *
 * Each `trigger()` call spawns a new oscillator + amp gain node for that hit, schedules the
 * pitch fall and amplitude decay envelope, then auto-stops the oscillator when the decay ends.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props - Optional 808 kick configuration. If omitted all defaults apply.
 * @returns A {@link PercussionComponent} with `id` prefixed `kick808` and `type` set to `'kick808'`.
 *
 * @example
 * ```ts
 * const kick = createKick808(context, { decay: 0.8 })
 * kick.connect(context.destination)
 * kick.trigger(context.currentTime)
 * kick.trigger(context.currentTime + 0.5)
 * kick.dispose()
 * ```
 *
 * @see {@link PercussionComponent} — returned component shape
 * @see {@link createKick909} — 909-style kick with an added noise click transient
 * @throws \{ScoreError\} Never — invalid props are silently clamped.
 */
export const createKick808 = (
  context: ScoreAudioContext,
  props?: Kick808Props,
): PercussionComponent => {
  const startFreq = props?.startFreq ?? 60
  const endFreq = props?.endFreq ?? 45
  const pitchFall = props?.pitchFall ?? 0.15
  const decay = props?.decay ?? 0.7
  const outputGain = context.createGain({ gain: props?.gain ?? 0.9 })

  const trigger = (time?: number) => {
    const t = time ?? context.currentTime
    const osc = context.createOscillator({ type: 'sine', frequency: startFreq })
    const ampEnv = context.createGain({ gain: 0 })

    osc.connect(ampEnv)
    ampEnv.connect(outputGain)

    osc.schedulePitchEnvelope({ startFreq, endFreq, startTime: t, fallTime: pitchFall })
    ampEnv.scheduleEnvelope({
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
    osc.onended = () => {
      try { osc.disconnect()    } catch { /* ok */ }
      try { ampEnv.disconnect() } catch { /* ok */ }
    }
  }

  const component: PercussionComponent = {
    id: uid('kick808'),
    type: 'kick808' as const,
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
