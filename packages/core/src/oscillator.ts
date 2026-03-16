import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'

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
    start: (time?: number) => oscNode.start(time),
    stop: (time?: number) => oscNode.stop(time),
    setFrequency: (value: number, time?: number) => oscNode.setFrequency(value, time),
    setDetune: (value: number, time?: number) => oscNode.setDetune(value, time),

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
