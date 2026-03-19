// DSL-level instrument factories — return pure data descriptors.
// No AudioContext is created here. The ScoreEngine hydrates these at play time.
//
// These satisfy the AudioComponent interface minimally so Track() accepts them.
// connect/disconnect/dispose are no-ops; the engine replaces them at hydration.

import type { BackendNode } from '@score/core'
import { uid } from '@score/core'
import type { InstrumentDescriptor, KickProps, SnareProps, HiHatProps, SynthDSLProps, SampleProps } from './types.js'

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

export const Kick   = (props?: KickProps):     InstrumentDescriptor => makeDescriptor('kick',  props ?? {})
export const Snare  = (props?: SnareProps):    InstrumentDescriptor => makeDescriptor('snare', props ?? {})
export const HiHat  = (props?: HiHatProps):   InstrumentDescriptor => makeDescriptor('hihat', props ?? {})
export const Synth  = (props?: SynthDSLProps): InstrumentDescriptor => makeDescriptor('synth', props ?? {})
/**
 * Sample instrument — plays an audio file triggered by a step pattern.
 *
 * The engine reads the file at play time using the path provided.
 * File I/O stays in the CLI layer; this factory is pure data.
 *
 * @param props - `path` is required. `pattern`, `volume`, `rate`, `loop`, `effects` are optional.
 * @returns An `InstrumentDescriptor` of type `'sample'`.
 *
 * @example
 * ```js
 * import { Song, Sample } from '@score/dsl'
 * const kick = Sample({ path: './sounds/kick.wav', pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], volume: 0.9 })
 * export default Song({ bpm: 128, tracks: [kick] })
 * ```
 */
export const Sample = (props: SampleProps):    InstrumentDescriptor => makeDescriptor('sample', props)
