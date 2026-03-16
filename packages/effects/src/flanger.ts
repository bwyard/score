// Flanger effect — short delay with feedback for comb filtering
// Uses short DelayNode + feedback GainNode
// NOTE: Initial implementation uses fixed delay time.
// Phase 8b (LFO core primitive) will upgrade to true modulated flanger.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

export type FlangerProps = {
  readonly rate?: number
  readonly depth?: number
  readonly feedback?: number
  readonly mix?: number
}

export const createFlanger = (
  context: ScoreAudioContext,
  props?: FlangerProps,
) => {
  const depth = Math.max(0, Math.min(props?.depth ?? 0.002, 0.01))
  const feedbackAmount = Math.min(props?.feedback ?? 0.5, 0.95)
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1.0))

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const flangeDelay = context.createDelay({ delayTime: depth, maxDelayTime: 0.02 })
  const feedbackGain = context.createGain({ gain: feedbackAmount })

  // Dry path
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Wet path: input -> delay -> wet -> output
  inputGain.connect(flangeDelay)
  flangeDelay.connect(wetGain)
  wetGain.connect(outputGain)

  // Feedback: delay -> feedback -> delay
  flangeDelay.connect(feedbackGain)
  feedbackGain.connect(flangeDelay)

  const component: AudioComponent & {
    readonly setDepth: (value: number, time?: number) => void
    readonly setFeedback: (value: number, time?: number) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('flanger'),
    type: 'flanger' as const,
    setDepth: (value: number, time?: number) => {
      flangeDelay.setDelayTime(Math.max(0, Math.min(value, 0.01)), time)
    },
    setFeedback: (value: number, time?: number) => {
      feedbackGain.setGain(Math.min(value, 0.95), time)
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
      try { flangeDelay.disconnect() } catch { /* already disconnected */ }
      try { feedbackGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
