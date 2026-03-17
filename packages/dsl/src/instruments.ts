// DSL-level instrument factories — return pure data descriptors.
// No AudioContext is created here. The ScoreEngine hydrates these at play time.
//
// These satisfy the AudioComponent interface minimally so Track() accepts them.
// connect/disconnect/dispose are no-ops; the engine replaces them at hydration.

import type { BackendNode } from '@score/core'
import { uid } from '@score/core'
import type { InstrumentDescriptor, KickProps, SnareProps, HiHatProps, SynthDSLProps } from './types.js'

const makeDescriptor = (
  instrumentType: InstrumentDescriptor['instrumentType'],
  props: InstrumentDescriptor['props'],
): InstrumentDescriptor => {
  const desc: InstrumentDescriptor = {
    _type: 'InstrumentDescriptor',
    instrumentType,
    props,
    id: uid(instrumentType),
    type: instrumentType,
    connect: (_dest: BackendNode) => desc,
    disconnect: () => desc,
    dispose: () => {},
  }
  return desc
}

export const Kick  = (props?: KickProps):     InstrumentDescriptor => makeDescriptor('kick',  props ?? {})
export const Snare = (props?: SnareProps):    InstrumentDescriptor => makeDescriptor('snare', props ?? {})
export const HiHat = (props?: HiHatProps):   InstrumentDescriptor => makeDescriptor('hihat', props ?? {})
export const Synth = (props?: SynthDSLProps): InstrumentDescriptor => makeDescriptor('synth', props ?? {})
