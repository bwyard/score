// Delay effect — delay with feedback and dry/wet mix
// Uses backend delay node + gain nodes for feedback routing

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'

export type DelayProps = {
  readonly time?: number
  readonly feedback?: number
  readonly mix?: number
}

export const createDelay = (
  context: ScoreAudioContext,
  props?: DelayProps,
) => {
  const delayTime = props?.time ?? 0.25
  const feedbackAmount = props?.feedback ?? 0.3
  const mixAmount = props?.mix ?? 0.5

  // Create nodes
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const feedbackGain = context.createGain({ gain: feedbackAmount })
  const delayNode = context.createDelay({ delayTime, maxDelayTime: 5.0 })

  // Route: input -> dry -> output
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Route: input -> delay -> wet -> output
  inputGain.connect(delayNode)
  delayNode.connect(wetGain)
  wetGain.connect(outputGain)

  // Feedback: delay -> feedback -> delay
  delayNode.connect(feedbackGain)
  feedbackGain.connect(delayNode)

  const component: AudioComponent & {
    readonly setTime: (value: number, time?: number) => void
    readonly setFeedback: (value: number, time?: number) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    setTime: (value: number, time?: number) => { delayNode.setDelayTime(value, time) },
    setFeedback: (value: number, time?: number) => { feedbackGain.setGain(value, time) },
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
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { dryGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { feedbackGain.disconnect() } catch { /* already disconnected */ }
      try { delayNode.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
