import { ScoreError } from './errors/ScoreError.js'
import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'
import type { NoiseType } from './backend/types.js'
import { uid } from './uid.js'

export type { NoiseType }

const VALID_TYPES: ReadonlyArray<NoiseType> = ['white', 'pink', 'brown']

/**
 * Create a noise generator backend node.
 * Produces continuous colored noise that can be started, stopped, and connected
 * into an audio graph like any other source node.
 *
 * @param context - The audio context.
 * @param props   - Node configuration: optional `type` — `'white'`, `'pink'`, or `'brown'`.
 *   Defaults to `'white'`.
 * @returns An `AudioComponent` with `start` and `stop` methods.
 *
 * @throws `ScoreError` If `props.type` is not one of the valid noise types.
 *
 * @example
 * ```ts
 * const noise = createNoise(ctx, { type: 'pink' })
 * noise.connect(filterNode)
 * noise.start(ctx.currentTime)
 * ```
 */
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
      docs: 'https://score.dev/docs/core#noise',
    })
  }

  const noiseNode = context.createNoise(props)

  const component: AudioComponent & {
    readonly start: (time?: number) => void
    readonly stop: (time?: number) => void
  } = {
    id: uid('noise'),
    type: 'noise' as const,
    start: (time?: number) => { noiseNode.start(time) },
    stop: (time?: number) => { noiseNode.stop(time) },

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
