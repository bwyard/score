import type { ScoreAudioContext } from '@score/core'
import type { BackendBuffer } from '@score/core'
import { uid } from '@score/core'
import { Sample, type SampleComponent } from './sample.js'

export type SnareProps = {
  readonly gain?: number
}

export const Snare = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: SnareProps,
): SampleComponent => {
  const sample = Sample(context, buffer, {
    loop: false,
    playbackRate: 1.0,
    gain: props?.gain ?? 0.8,
  })
  const snare: SampleComponent = {
    ...sample,
    id: uid('snare'),
    type: 'snare',
    connect: (dest) => { sample.connect(dest); return snare },
    disconnect: () => { sample.disconnect(); return snare },
  }
  return snare
}
