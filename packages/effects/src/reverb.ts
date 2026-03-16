// Reverb effect — simulated reverb using parallel delay taps with exponential decay
// Uses gain nodes for dry/wet mix control

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import type { BackendGainNode, BackendDelayNode } from '@score/core'

export type ReverbProps = {
  readonly decay?: number
  readonly mix?: number
}

export const createReverb = (
  context: ScoreAudioContext,
  props?: ReverbProps,
) => {
  const decay = props?.decay ?? 2.0
  const mixAmount = props?.mix ?? 0.3

  // Create dry/wet mix nodes
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })

  // Route: input -> dry -> output
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Create parallel delay taps to simulate reverb reflections
  const taps = 6
  const tapDelays: BackendDelayNode[] = []
  const tapGains: BackendGainNode[] = []

  for (let i = 0; i < taps; i++) {
    const tapDelay = context.createDelay({
      delayTime: (i + 1) * decay / taps,
      maxDelayTime: decay + 1,
    })
    const tapGain = context.createGain({ gain: Math.pow(0.6, i + 1) })
    inputGain.connect(tapDelay)
    tapDelay.connect(tapGain)
    tapGain.connect(wetGain)
    tapDelays.push(tapDelay)
    tapGains.push(tapGain)
  }

  // Wet -> output
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly setMix: (value: number, time?: number) => void
  } = {
    setMix: (value: number, time?: number) => {
      dryGain.setGain(1.0 - value, time)
      wetGain.setGain(value, time)
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        outputGain.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      for (const g of tapGains) {
        try { g.disconnect() } catch { /* already disconnected */ }
      }
      for (const d of tapDelays) {
        try { d.disconnect() } catch { /* already disconnected */ }
      }
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { dryGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
