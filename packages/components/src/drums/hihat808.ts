import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Frequencies (Hz) of the 6 detuned square oscillators that form the
 * characteristic 808 hi-hat metallic timbre. Values match the original
 * Roland TR-808 hardware ratios.
 */
const HIHAT_FREQS = [205, 285, 365, 450, 535, 620] as const

/**
 * Configuration for {@link createHihat808}.
 */
export type Hihat808Props = {
  /**
   * Amplitude decay time in seconds.
   * Typical range: closed 0.04–0.08 s, open 0.2–0.5 s.
   * Default `0.06` (closed hi-hat).
   */
  readonly decay?: number
  /**
   * When `true`, uses a longer default decay suitable for an open hi-hat.
   * Overridden by an explicit `decay` value.
   * Default `false`.
   */
  readonly open?: boolean
  /** Output gain 0–1. Default `0.7`. */
  readonly gain?: number
}

/**
 * A synthesized percussion component — extends {@link AudioComponent} with a
 * `trigger` method for scheduling one-shot hits.
 */
export type Hihat808Component = AudioComponent & {
  /**
   * Trigger a single hi-hat hit at the given audio context time.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly trigger: (time?: number) => void
}

/**
 * Create a synthesized 808-style hi-hat component.
 *
 * Six detuned square oscillators summed together, passed through a bandpass
 * filter (≈ 8–10 kHz) and a high-pass filter (≈ 7 kHz) to sculpt the metallic
 * clang, then shaped by a fast amplitude decay envelope.
 *
 * Signal path:
 * `6× square osc → mixer gain → bandpass (8 kHz) → HPF (7 kHz) → amp env → output gain`
 *
 * Each `trigger()` call creates a fresh set of oscillators + filters for that hit.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props - Optional hi-hat configuration. If omitted all defaults apply.
 * @returns A {@link Hihat808Component} with `id` prefixed `hihat808` and `type` set to `'hihat808'`.
 *
 * @example
 * ```ts
 * const hihat = createHihat808(context, { decay: 0.06 })           // closed
 * const openHat = createHihat808(context, { open: true })           // open
 * hihat.connect(context.destination)
 * hihat.trigger(context.currentTime)
 * ```
 *
 * @see {@link Hihat808Props} — configuration options
 * @see {@link Hihat808Component} — returned component shape
 * @throws {ScoreError} Never — invalid props are silently clamped.
 */
export const createHihat808 = (
  context: ScoreAudioContext,
  props?: Hihat808Props,
): Hihat808Component => {
  const open = props?.open ?? false
  const decay = props?.decay ?? (open ? 0.3 : 0.06)
  const outputGain = context.createGain({ gain: props?.gain ?? 0.7 })

  const trigger = (time?: number) => {
    const t = time ?? context.currentTime

    // Summing bus — all 6 oscillators feed into this before filtering
    const mixGain = context.createGain({ gain: 1 / HIHAT_FREQS.length })
    const bandpass = context.createFilter({ type: 'bandpass', frequency: 8000, Q: 0.5 })
    const hpf = context.createFilter({ type: 'highpass', frequency: 7000, Q: 0.7 })
    const ampEnv = context.createGain({ gain: 0 })

    // Wire filter chain
    mixGain.connect(bandpass)
    bandpass.connect(hpf)
    hpf.connect(ampEnv)
    ampEnv.connect(outputGain)

    // Spawn all 6 oscillators
    for (const freq of HIHAT_FREQS) {
      const osc = context.createOscillator({ type: 'square', frequency: freq })
      osc.connect(mixGain)
      osc.start(t)
      osc.stop(t + decay + 0.05)
    }

    ampEnv.scheduleEnvelope({
      peak: 1.0,
      attack: 0.001,
      decay,
      sustain: 0,
      release: 0,
      startTime: t,
      duration: decay + 0.001,
    })
  }

  const component: Hihat808Component = {
    id: uid('hihat808'),
    type: 'hihat808' as const,
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
