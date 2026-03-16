import type { ScoreAudioContext } from '@score/core'
import type { BackendBuffer } from '@score/core'
import { uid } from '@score/core'
import { Sample, type SampleComponent } from './sample.js'

export type KickProps = {
  readonly gain?: number
}

export const Kick = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: KickProps,
): SampleComponent => {
  const sample = Sample(context, buffer, {
    loop: false,
    playbackRate: 1.0,
    gain: props?.gain ?? 0.9,
  })
  const kick: SampleComponent = {
    ...sample,
    id: uid('kick'),
    type: 'kick',
    connect: (dest) => { sample.connect(dest); return kick },
    disconnect: () => { sample.disconnect(); return kick },
  }
  return kick
}
