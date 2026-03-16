// Chorus effect — multiple delayed voices with slight detuning
// Uses multiple DelayNodes + GainNodes for voice spread
// NOTE: Initial implementation uses static delay offsets per voice.
// Phase 8b (LFO core primitive) will upgrade to true modulated chorus.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

export type ChorusProps = {
  readonly rate?: number
  readonly depth?: number
  readonly mix?: number
  readonly voices?: number
}

export const createChorus = (
  context: ScoreAudioContext,
  props?: ChorusProps,
) => {
  const voiceCount = Math.max(2, Math.min(props?.voices ?? 3, 4))
  const depth = Math.max(0, Math.min(props?.depth ?? 0.002, 0.02))
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1.0))

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })

  // Dry path
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Create voice delay lines with spread offsets
  const voiceDelays: Array<ReturnType<ScoreAudioContext['createDelay']>> = []
  const voiceGains: Array<ReturnType<ScoreAudioContext['createGain']>> = []
  const mixNode = context.createGain({ gain: 1.0 / voiceCount })

  for (let i = 0; i < voiceCount; i++) {
    const offset = depth * ((i + 1) / voiceCount)
    const voiceDelay = context.createDelay({ delayTime: 0.01 + offset, maxDelayTime: 0.05 })
    const voiceGain = context.createGain({ gain: 1.0 })
    inputGain.connect(voiceDelay)
    voiceDelay.connect(voiceGain)
    voiceGain.connect(mixNode)
    voiceDelays.push(voiceDelay)
    voiceGains.push(voiceGain)
  }

  mixNode.connect(wetGain)
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly setDepth: (value: number, time?: number) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('chorus'),
    type: 'chorus' as const,
    setDepth: (value: number, time?: number) => {
      const clamped = Math.max(0, Math.min(value, 0.02))
      for (let i = 0; i < voiceDelays.length; i++) {
        const d = voiceDelays[i]
        if (d) {
          const offset = clamped * ((i + 1) / voiceDelays.length)
          d.setDelayTime(0.01 + offset, time)
        }
      }
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
      try { mixNode.disconnect() } catch { /* already disconnected */ }
      for (const d of voiceDelays) {
        try { d.disconnect() } catch { /* already disconnected */ }
      }
      for (const g of voiceGains) {
        try { g.disconnect() } catch { /* already disconnected */ }
      }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
