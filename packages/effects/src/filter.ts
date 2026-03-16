// Filter effect — wraps a backend biquad filter node
// Supports lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendFilterNode, FilterType } from '@score/core'

export type FilterProps = {
  readonly type?: FilterType
  readonly frequency?: number
  readonly Q?: number
  readonly gain?: number
}

export const createFilter = (
  context: ScoreAudioContext,
  props?: FilterProps,
) => {
  const filterNode: BackendFilterNode = context.createFilter({
    type: props?.type ?? 'lowpass',
    frequency: props?.frequency ?? 1000,
    Q: props?.Q ?? 1,
    gain: props?.gain ?? 0,
  })

  const component: AudioComponent & {
    readonly setFrequency: (value: number, time?: number) => void
    readonly setQ: (value: number, time?: number) => void
    readonly setGain: (value: number, time?: number) => void
  } = {
    setFrequency: (value: number, time?: number) => { filterNode.setFrequency(value, time) },
    setQ: (value: number, time?: number) => { filterNode.setQ(value, time) },
    setGain: (value: number, time?: number) => { filterNode.setFilterGain(value, time) },

    connect: (destination: ScoreAudioNode) => {
      filterNode.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        filterNode.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try {
        filterNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
