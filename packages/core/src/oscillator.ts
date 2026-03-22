import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'
import { uid } from './uid.js'

/**
 * Create an oscillator backend node.
 * Wraps a periodic waveform generator with start/stop and real-time frequency/detune control.
 *
 * @param context - The audio context.
 * @param props   - Node configuration: waveform `type`, `frequency` in Hz, and `detune` in cents.
 * @returns An `AudioComponent` with `start`, `stop`, `setFrequency`, and `setDetune` methods.
 *
 * @example
 * ```ts
 * const osc = createOscillator(ctx, { type: 'sine', frequency: 440 })
 * osc.start(ctx.currentTime)
 * osc.connect(masterGain)
 * ```
 */
export const createOscillator = (
  context: ScoreAudioContext,
  props: {
    type?: 'sine' | 'square' | 'sawtooth' | 'triangle'
    frequency?: number
    detune?: number
  },
) => {
  const oscNode = context.createOscillator(props)

  const component: AudioComponent & {
    readonly start: (time?: number) => void
    readonly stop: (time?: number) => void
    readonly setFrequency: (value: number, time?: number) => void
    readonly setDetune: (value: number, time?: number) => void
  } = {
    id: uid('oscillator'),
    type: 'oscillator' as const,
    start: (time?: number) => { oscNode.start(time) },
    stop: (time?: number) => { oscNode.stop(time) },
    setFrequency: (value: number, time?: number) => { oscNode.setFrequency(value, time) },
    setDetune: (value: number, time?: number) => { oscNode.setDetune(value, time) },

    connect: (destination: ScoreAudioNode) => {
      oscNode.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        oscNode.disconnect()
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
    },
  }

  return component
}
