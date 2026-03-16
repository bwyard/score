import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'

export const createOscillator = (
  context: ScoreAudioContext,
  props: {
    type?: 'sine' | 'square' | 'sawtooth' | 'triangle'
    frequency?: number
    detune?: number
  },
) => {
  const oscNode = context.createOscillator()
  oscNode.type = props.type ?? 'sine'
  oscNode.frequency.value = props.frequency ?? 440
  oscNode.detune.value = props.detune ?? 0

  const component: AudioComponent & {
    readonly start: (time?: number) => void
    readonly stop: (time?: number) => void
    readonly setFrequency: (value: number, time?: number) => void
    readonly setDetune: (value: number, time?: number) => void
  } = {
    start: (time?: number) => {
      oscNode.start(time ?? context.currentTime)
    },

    stop: (time?: number) => {
      oscNode.stop(time ?? context.currentTime)
    },

    setFrequency: (value: number, time?: number) => {
      oscNode.frequency.setValueAtTime(value, time ?? context.currentTime)
    },

    setDetune: (value: number, time?: number) => {
      oscNode.detune.setValueAtTime(value, time ?? context.currentTime)
    },

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
