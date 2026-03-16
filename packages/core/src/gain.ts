import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'
import type { BackendGainNode } from './backend/types.js'
import { uid } from './uid.js'

export const createGain = (
  context: ScoreAudioContext,
  props?: {
    gain?: number
  },
) => {
  const gainNode: BackendGainNode = context.createGain(props)

  const component: AudioComponent & {
    readonly setGain: (value: number, time?: number) => void
    readonly gain: number
  } = {
    id: uid('gain'),
    type: 'gain' as const,
    get gain() {
      return gainNode.gain
    },

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
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
