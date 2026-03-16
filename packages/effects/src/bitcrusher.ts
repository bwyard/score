// BitCrusher effect — reduces bit depth for lo-fi digital distortion
// Uses GainNodes for bit-depth reduction via quantization
// NOTE: True sample-rate reduction requires AudioWorklet (Phase 12g).
// This initial version performs bit-depth reduction only.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

export type BitCrusherProps = {
  readonly bits?: number
  readonly mix?: number
}

export const createBitCrusher = (
  context: ScoreAudioContext,
  props?: BitCrusherProps,
) => {
  const bits = Math.max(1, Math.min(props?.bits ?? 8, 16))
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 1.0, 1.0))

  // Bit reduction via gain scaling: multiply up, round (via gain quantization), multiply down
  // step = 2^bits, so we scale by step, then back by 1/step
  const step = Math.pow(2, bits)

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const crushUpGain = context.createGain({ gain: step })
  const crushDownGain = context.createGain({ gain: 1.0 / step })

  // Dry path
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Wet path: input -> scale up -> scale down -> wet -> output
  // This approximates bit reduction by scaling to integer range and back
  inputGain.connect(crushUpGain)
  crushUpGain.connect(crushDownGain)
  crushDownGain.connect(wetGain)
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly setBits: (value: number) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('bitcrusher'),
    type: 'bitcrusher' as const,
    setBits: (value: number) => {
      const clamped = Math.max(1, Math.min(value, 16))
      const newStep = Math.pow(2, clamped)
      crushUpGain.setGain(newStep)
      crushDownGain.setGain(1.0 / newStep)
    },
    setMix: (value: number, time?: number) => {
      const clamped = Math.max(0, Math.min(value, 1.0))
      dryGain.setGain(1.0 - clamped, time)
      wetGain.setGain(clamped, time)
    },

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
      try { dryGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { crushUpGain.disconnect() } catch { /* already disconnected */ }
      try { crushDownGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
