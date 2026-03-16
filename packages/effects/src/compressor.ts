// Compressor effect — wraps a backend dynamics compressor node

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendCompressorNode } from '@score/core'
import { uid } from '@score/core'

export type CompressorProps = {
  readonly threshold?: number
  readonly ratio?: number
  readonly knee?: number
  readonly attack?: number
  readonly release?: number
}

export const createCompressor = (
  context: ScoreAudioContext,
  props?: CompressorProps,
) => {
  const compNode: BackendCompressorNode = context.createCompressor({
    threshold: props?.threshold ?? -24,
    ratio: props?.ratio ?? 12,
    knee: props?.knee ?? 30,
    attack: props?.attack ?? 0.003,
    release: props?.release ?? 0.25,
  })

  const component: AudioComponent & {
    readonly setThreshold: (value: number, time?: number) => void
    readonly setRatio: (value: number, time?: number) => void
  } = {
    id: uid('compressor'),
    type: 'compressor' as const,
    setThreshold: (value: number, time?: number) => { compNode.setThreshold(value, time) },
    setRatio: (value: number, time?: number) => { compNode.setRatio(value, time) },

    connect: (destination: ScoreAudioNode) => {
      compNode.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        compNode.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try {
        compNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
