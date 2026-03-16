// Noise Gate effect — gates audio below threshold using extreme compression
// Uses CompressorNode with extreme ratio as a gate + GainNode for output level

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

export type GateProps = {
  readonly threshold?: number
  readonly attack?: number
  readonly release?: number
}

export const createGate = (
  context: ScoreAudioContext,
  props?: GateProps,
) => {
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })

  // Use extreme compression ratio to simulate a gate
  const gateComp = context.createCompressor({
    threshold: props?.threshold ?? -40,
    ratio: 20,
    knee: 0,
    attack: props?.attack ?? 0.001,
    release: props?.release ?? 0.05,
  })

  // Route: input -> compressor (gate) -> output
  inputGain.connect(gateComp)
  gateComp.connect(outputGain)

  const component: AudioComponent & {
    readonly setThreshold: (value: number, time?: number) => void
    readonly setAttack: (value: number, time?: number) => void
    readonly setRelease: (value: number, time?: number) => void
  } = {
    id: uid('gate'),
    type: 'gate' as const,
    setThreshold: (value: number, _time?: number) => { gateComp.setThreshold(value) },
    setAttack: (value: number, _time?: number) => { gateComp.setAttack(value) },
    setRelease: (value: number, _time?: number) => { gateComp.setRelease(value) },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { gateComp.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
