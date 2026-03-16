import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import type { OscillatorType } from '@score/core'
import { uid } from '@score/core'

export type SynthProps = {
  readonly wave?: OscillatorType
  readonly frequency?: number
  readonly detune?: number
  readonly gain?: number
}

export type SynthComponent = AudioComponent & {
  readonly start: (time?: number) => void
  readonly stop: (time?: number) => void
  readonly setFrequency: (value: number, time?: number) => void
  readonly setDetune: (value: number, time?: number) => void
  readonly setGain: (value: number, time?: number) => void
}

export const Synth = (
  context: ScoreAudioContext,
  props?: SynthProps,
): SynthComponent => {
  const oscNode = context.createOscillator({
    type: props?.wave ?? 'sine',
    frequency: props?.frequency ?? 440,
    detune: props?.detune ?? 0,
  })

  const gainNode = context.createGain({ gain: props?.gain ?? 1.0 })

  // Wire: oscillator -> gain -> (user connects output)
  oscNode.connect(gainNode)

  const component: SynthComponent = {
    id: uid('synth'),
    type: 'synth' as const,
    start: (time?: number) => { oscNode.start(time) },
    stop: (time?: number) => { oscNode.stop(time) },
    setFrequency: (value: number, time?: number) => { oscNode.setFrequency(value, time) },
    setDetune: (value: number, time?: number) => { oscNode.setDetune(value, time) },
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
        oscNode.stop()
      } catch {
        // Already stopped or never started
      }
      try {
        oscNode.disconnect()
      } catch {
        // Already disconnected
      }
      try {
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
