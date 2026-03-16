// Sidechain effect — sidechain compression that ducks audio when source signal is loud
// Uses a compressor internally, source is the key signal (e.g., kick drum)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode, BackendCompressorNode } from '@score/core'

export type SidechainProps = {
  readonly source: BackendNode
  readonly threshold?: number
  readonly ratio?: number
  readonly attack?: number
  readonly release?: number
}

export const createSidechain = (
  context: ScoreAudioContext,
  props: SidechainProps,
) => {
  const compNode: BackendCompressorNode = context.createCompressor({
    threshold: props.threshold ?? -30,
    ratio: props.ratio ?? 10,
    knee: 0,
    attack: props.attack ?? 0.005,
    release: props.release ?? 0.1,
  })

  // The source signal feeds into the compressor to trigger ducking
  // The audio to be ducked also passes through the compressor
  props.source.connect(compNode)

  const component: AudioComponent = {
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
      try { props.source.disconnect(compNode) } catch { /* already disconnected */ }
      try { compNode.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
