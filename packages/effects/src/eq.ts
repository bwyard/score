// EQ effect — 3-band equalizer using three filter instances
// lowshelf (320 Hz), peaking (1000 Hz), highshelf (3200 Hz)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendFilterNode } from '@score/core'

export type EQProps = {
  readonly low?: number
  readonly mid?: number
  readonly high?: number
}

export const createEQ = (
  context: ScoreAudioContext,
  props?: EQProps,
) => {
  const lowFilter: BackendFilterNode = context.createFilter({
    type: 'lowshelf',
    frequency: 320,
    gain: props?.low ?? 0,
  })

  const midFilter: BackendFilterNode = context.createFilter({
    type: 'peaking',
    frequency: 1000,
    Q: 1,
    gain: props?.mid ?? 0,
  })

  const highFilter: BackendFilterNode = context.createFilter({
    type: 'highshelf',
    frequency: 3200,
    gain: props?.high ?? 0,
  })

  // Chain: input (low) -> mid -> high -> output
  lowFilter.connect(midFilter)
  midFilter.connect(highFilter)

  const component: AudioComponent & {
    readonly setLow: (value: number, time?: number) => void
    readonly setMid: (value: number, time?: number) => void
    readonly setHigh: (value: number, time?: number) => void
  } = {
    setLow: (value: number, time?: number) => { lowFilter.setFilterGain(value, time) },
    setMid: (value: number, time?: number) => { midFilter.setFilterGain(value, time) },
    setHigh: (value: number, time?: number) => { highFilter.setFilterGain(value, time) },

    connect: (destination: ScoreAudioNode) => {
      highFilter.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        highFilter.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try { lowFilter.disconnect() } catch { /* already disconnected */ }
      try { midFilter.disconnect() } catch { /* already disconnected */ }
      try { highFilter.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
