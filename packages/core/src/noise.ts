import { ScoreError } from './errors/ScoreError.js'
import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'
import type { NoiseType } from './backend/types.js'

export type { NoiseType }

const VALID_TYPES: ReadonlyArray<NoiseType> = ['white', 'pink', 'brown']

export const createNoise = (
  context: ScoreAudioContext,
  props?: { type?: NoiseType },
): AudioComponent & {
  readonly start: (time?: number) => void
  readonly stop: (time?: number) => void
} => {
  const noiseType = props?.type ?? 'white'

  if (!VALID_TYPES.includes(noiseType)) {
    throw ScoreError(`Invalid noise type: ${noiseType}`, {
      received: noiseType,
      fix: `Use one of: ${VALID_TYPES.join(', ')}`,
    })
  }

  const noiseNode = context.createNoise(props)

  const component: AudioComponent & {
    readonly start: (time?: number) => void
    readonly stop: (time?: number) => void
  } = {
    start: (time?: number) => noiseNode.start(time),
    stop: (time?: number) => noiseNode.stop(time),

    connect: (destination: ScoreAudioNode) => {
      noiseNode.connect(destination)
      return component
    },

    disconnect: () => {
      noiseNode.disconnect()
      return component
    },

    dispose: () => {
      try {
        noiseNode.stop()
      } catch {
        // Already stopped
      }
      noiseNode.disconnect()
    },
  }

  return component
}
