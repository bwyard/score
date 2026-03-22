import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'
import type { BackendGainNode } from './backend/types.js'
import { uid } from './uid.js'

/**
 * Create a gain backend node.
 * Wraps a volume-scaling node that can be adjusted in real time or scheduled ahead.
 *
 * @param context - The audio context.
 * @param props   - Node configuration: optional `gain` value (linear, default `1.0`).
 * @returns An `AudioComponent` with a `gain` getter and a `setGain` method.
 *
 * @example
 * ```ts
 * const vol = createGain(ctx, { gain: 0.8 })
 * osc.connect(vol)
 * vol.connect(ctx.destination)
 * vol.setGain(0.5, ctx.currentTime + 1)
 * ```
 */
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
