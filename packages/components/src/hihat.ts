import type { ScoreAudioContext } from '@score/core'
import type { BackendBuffer } from '@score/core'
import { uid } from '@score/core'
import { Sample, type SampleComponent } from './sample.js'

export type HiHatProps = {
  readonly gain?: number
  readonly open?: boolean
}

export const HiHat = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: HiHatProps,
): SampleComponent => {
  // Open hi-hat has higher gain sustain (0.8 default vs 0.6 closed)
  const defaultGain = props?.open === true ? 0.8 : 0.6
  const gain = props?.gain ?? defaultGain

  const sample = Sample(context, buffer, {
    loop: false,
    playbackRate: 1.0,
    gain,
  })
  const hihat: SampleComponent = {
    ...sample,
    id: uid('hihat'),
    type: 'hihat',
    connect: (dest) => { sample.connect(dest); return hihat },
    disconnect: () => { sample.disconnect(); return hihat },
  }
  return hihat
}
