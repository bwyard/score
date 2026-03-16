import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'

export const createGain = (
  context: ScoreAudioContext,
  props?: {
    gain?: number
  },
) => {
  const gainNode = context.createGain()
  gainNode.gain.value = props?.gain ?? 1.0

  const component: AudioComponent & {
    readonly setGain: (value: number, time?: number) => void
    readonly node: GainNode
  } = {
    node: gainNode,

    setGain: (value: number, time?: number) => {
      gainNode.gain.setValueAtTime(value, time ?? context.currentTime)
    },

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
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
