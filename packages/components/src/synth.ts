import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import type { OscillatorType } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration for {@link Synth}.
 */
export type SynthProps = {
  /**
   * Oscillator waveform. One of `'sine'`, `'square'`, `'sawtooth'`, or `'triangle'`.
   * Default `'sine'`.
   */
  readonly wave?: OscillatorType
  /** Initial oscillator frequency in Hz. Default `440`. */
  readonly frequency?: number
  /** Initial detune offset in cents. Default `0`. */
  readonly detune?: number
  /** Output gain 0–1. Default `1.0`. */
  readonly gain?: number
}

/**
 * Synth component — extends {@link AudioComponent} with oscillator start/stop and
 * real-time parameter controls for frequency, detune, and gain.
 */
export type SynthComponent = AudioComponent & {
  /** Start the oscillator. Call at most once; use `setFrequency` for pitch changes. */
  readonly start: (time?: number) => void
  /** Stop the oscillator. After stopping, the component should be disposed. */
  readonly stop: (time?: number) => void
  /**
   * Set the oscillator frequency in Hz at runtime.
   * @param value - Target frequency in Hz.
   * @param time - Optional schedule time. Defaults to `context.currentTime`.
   */
  readonly setFrequency: (value: number, time?: number) => void
  /**
   * Set the oscillator detune offset in cents at runtime.
   * @param value - Detune amount in cents.
   * @param time - Optional schedule time. Defaults to `context.currentTime`.
   */
  readonly setDetune: (value: number, time?: number) => void
  /**
   * Set the output gain at runtime.
   * @param value - Gain 0–1.
   * @param time - Optional schedule time. Defaults to `context.currentTime`.
   */
  readonly setGain: (value: number, time?: number) => void
}

/**
 * Create a Synth instrument — a single oscillator routed through a gain node.
 * Signal path: oscillator → gain → (caller connects output).
 * Supports real-time frequency, detune, and gain automation via the component methods.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props - Optional synth configuration. If omitted all defaults apply.
 * @returns A {@link SynthComponent} with `id` prefixed `synth` and `type` set to `'synth'`.
 *
 * @example
 * ```ts
 * const synth = Synth(context, { wave: 'sawtooth', frequency: 220, gain: 0.7 })
 * synth.connect(context.destination)
 * synth.start(context.currentTime)
 * // Automate pitch
 * synth.setFrequency(440, context.currentTime + 1)
 * // Clean up
 * synth.stop(context.currentTime + 2)
 * synth.dispose()
 * ```
 *
 * @see {@link SynthProps} — configuration options
 * @see {@link SynthComponent} — returned component shape
 * @see {@link Theremin} — sine oscillator with LFO vibrato
 */
export const Synth = (
  context: ScoreAudioContext,
  props?: SynthProps,
): SynthComponent => {
  const oscNode = context.createOscillator({
    type: props?.wave ?? 'sine',
    frequency: props?.frequency ?? 440,
    detune: props?.detune ?? 0,
  })

  const gainNode = context.createGain({ gain: props?.gain ?? 1.0 })

  // Wire: oscillator -> gain -> (user connects output)
  oscNode.connect(gainNode)

  const component: SynthComponent = {
    id: uid('synth'),
    type: 'synth' as const,
    start: (time?: number) => { oscNode.start(time) },
    stop: (time?: number) => { oscNode.stop(time) },
    setFrequency: (value: number, time?: number) => { oscNode.setFrequency(value, time) },
    setDetune: (value: number, time?: number) => { oscNode.setDetune(value, time) },
    setGain: (value: number, time?: number) => { gainNode.setGain(value, time) },

    connect: (destination: ScoreAudioNode) => {
      gainNode.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try {
        oscNode.stop()
      } catch {
        // Already stopped or never started
      }
      try {
        oscNode.disconnect()
      } catch {
        // Already disconnected
      }
      try {
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
