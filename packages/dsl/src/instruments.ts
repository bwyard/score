// DSL-level instrument factories — return pure data descriptors.
// No AudioContext is created here. The ScoreEngine hydrates these at play time.
//
// These satisfy the AudioComponent interface minimally so Track() accepts them.
// connect/disconnect/dispose are no-ops; the engine replaces them at hydration.

import type { BackendNode } from '@score/core'
import { uid } from '@score/core'
import type { InstrumentDescriptor, KickProps, SnareProps, HiHatProps, SynthDSLProps, SampleProps, ThereminDSLProps, SaxDSLProps, ArpDSLProps } from './types.js'

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

/**
 * Create a Kick instrument descriptor.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - Kick configuration: pattern, volume, synth settings, effects chain.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'kick'`.
 *
 * @example
 * ```ts
 * const kick = Kick({
 *   pattern: [1, 0, 0, 0,  1, 0, 0, 0],
 *   volume: 0.85,
 * })
 * ```
 *
 * @see {@link Song} — add to tracks array
 * @see {@link Track} — wrap with mix settings (volume, pan, mute, solo)
 */
export const Kick   = (props?: KickProps):     InstrumentDescriptor => makeDescriptor('kick',  props ?? {})

/**
 * Create a Snare instrument descriptor.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - Snare configuration: pattern, volume, effects chain.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'snare'`.
 *
 * @example
 * ```ts
 * const snare = Snare({
 *   pattern: [0, 0, 1, 0,  0, 0, 1, 0],
 *   volume: 0.7,
 * })
 * ```
 *
 * @see {@link Song} — add to tracks array
 * @see {@link Track} — wrap with mix settings (volume, pan, mute, solo)
 */
export const Snare  = (props?: SnareProps):    InstrumentDescriptor => makeDescriptor('snare', props ?? {})

/**
 * Create a HiHat instrument descriptor.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - HiHat configuration: pattern, volume, open (open vs closed hat), effects chain.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'hihat'`.
 *
 * @example
 * ```ts
 * const hihat = HiHat({
 *   pattern: [1, 0, 1, 0,  1, 0, 1, 0],
 *   open: false,
 *   volume: 0.6,
 * })
 * ```
 *
 * @see {@link Song} — add to tracks array
 * @see {@link Track} — wrap with mix settings (volume, pan, mute, solo)
 */
export const HiHat  = (props?: HiHatProps):   InstrumentDescriptor => makeDescriptor('hihat', props ?? {})

/**
 * Create a Synth instrument descriptor.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - Synth configuration: wave shape, frequency, gain, pattern, envelope, filter,
 *   effects chain.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'synth'`.
 *
 * @example
 * ```ts
 * const bass = Synth({
 *   wave: 'sawtooth',
 *   frequency: 110,
 *   gain: 0.5,
 *   filter: { type: 'lowpass', frequency: 800 },
 *   envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.05 },
 * })
 * ```
 *
 * @see {@link Song} — add to tracks array
 * @see {@link Track} — wrap with mix settings (volume, pan, mute, solo)
 */
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
export const Sample   = (props: SampleProps):       InstrumentDescriptor => makeDescriptor('sample',   props)
/**
 * Create a Theremin instrument descriptor.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * Produces a smooth continuous tone with vibrato, modelled on the electromagnetic
 * theremin. The note drifts organically around a center pitch. No pattern is needed —
 * the theremin sustains indefinitely until the song ends.
 *
 * @param props - Theremin configuration: note, vibratoRate, vibratoDepth, gain, effects chain.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'theremin'`.
 *
 * @example
 * ```ts
 * const theremin = Theremin({
 *   note: 'A4',
 *   vibratoRate: 5,
 *   vibratoDepth: 8,
 *   gain: 0.4,
 * })
 * ```
 *
 * @see {@link Song} — add to tracks array
 * @see {@link Track} — wrap with mix settings (volume, pan, mute, solo)
 */
export const Theremin = (props?: ThereminDSLProps): InstrumentDescriptor => makeDescriptor('theremin', props ?? {})

/**
 * Create a Sax instrument descriptor.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * Produces a saxophone-style melodic voice driven by a note pattern. Each active
 * step plays the note at the corresponding pattern position.
 *
 * @param props - Sax configuration: note, gain, pattern (note names or 0 for rest),
 *   duration, effects chain.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'sax'`.
 *
 * @example
 * ```ts
 * const sax = Sax({
 *   pattern: ['A3', 'C4', 'E4', 0, 'A3', 'C4', 0, 0],
 *   gain: 0.4,
 *   duration: 0.35,
 * })
 * ```
 *
 * @see {@link Song} — add to tracks array
 * @see {@link Track} — wrap with mix settings (volume, pan, mute, solo)
 */
export const Sax      = (props?: SaxDSLProps):      InstrumentDescriptor => makeDescriptor('sax',      props ?? {})

/**
 * Arpeggiator instrument — cycles through a chord's notes in sequence on each trigger step.
 *
 * The engine advances through `notes` each time a step is active, cycling based on `mode`.
 * Each note is synthesised using an oscillator+ADSR, exactly like `Synth`.
 *
 * @param props - `notes` is required. All other props are optional.
 * @returns An `InstrumentDescriptor` of type `'arp'`.
 *
 * @example
 * ```js
 * import { Song, Arp } from '@score/dsl'
 * const arp = Arp({
 *   notes: ['C4', 'E4', 'G4', 'B4'],
 *   mode: 'up',
 *   wave: 'triangle',
 *   gain: 0.3,
 *   envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.05 },
 * })
 * export default Song({ bpm: 128, tracks: [arp] })
 * ```
 */
export const Arp = (props: ArpDSLProps): InstrumentDescriptor => makeDescriptor('arp', props)
