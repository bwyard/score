// DSL-level instrument factories — return pure data descriptors.
// No AudioContext is created here. The ScoreEngine hydrates these at play time.
//
// These satisfy the AudioComponent interface minimally so Track() accepts them.
// connect/disconnect/dispose are no-ops; the engine replaces them at hydration.

import type { BackendNode } from '@score/core'
import { uid } from '@score/core'
import type { InstrumentDescriptor, KickProps, SnareProps, HiHatProps, SynthDSLProps, SampleProps, ThereminDSLProps, SaxDSLProps, ArpDSLProps, Kick808DSLProps, Kick909DSLProps, Hihat808DSLProps, Snare909DSLProps, SubSynthDSLProps, FMSynthDSLProps } from './types.js'

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

/**
 * Create a Kick808 instrument descriptor — synthesized 808-style kick drum.
 * Pure sine oscillator with pitch envelope and amplitude decay. No samples needed.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - Kick808 configuration: pattern, volume, startFreq, endFreq, pitchFall, decay, effects.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'kick808'`.
 *
 * @example
 * ```ts
 * const kick = Kick808({ pattern: [1,0,0,0, 1,0,0,0], decay: 0.7 })
 * ```
 */
export const Kick808 = (props?: Kick808DSLProps): InstrumentDescriptor => makeDescriptor('kick808', props ?? {})

/**
 * Create a Kick909 instrument descriptor — synthesized 909-style kick drum.
 * Extends Kick808 with a short noise click transient for added punch.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - Kick909 configuration: all Kick808 props plus clickLevel, clickDecay.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'kick909'`.
 *
 * @example
 * ```ts
 * const kick = Kick909({ pattern: [1,0,0,0, 1,0,0,0], clickLevel: 0.25 })
 * ```
 */
export const Kick909 = (props?: Kick909DSLProps): InstrumentDescriptor => makeDescriptor('kick909', props ?? {})

/**
 * Create a Hihat808 instrument descriptor — synthesized 808-style hi-hat.
 * Six detuned square oscillators through bandpass + HPF filtering.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - Hihat808 configuration: pattern, volume, decay, open, effects.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'hihat808'`.
 *
 * @example
 * ```ts
 * const hat = Hihat808({ pattern: [1,0,1,0, 1,0,1,0], open: false })
 * const openHat = Hihat808({ pattern: [0,0,0,0, 0,0,0,1], open: true, decay: 0.4 })
 * ```
 */
export const Hihat808 = (props?: Hihat808DSLProps): InstrumentDescriptor => makeDescriptor('hihat808', props ?? {})

/**
 * Create a Snare909 instrument descriptor — synthesized 909-style snare.
 * Two triangle oscillators (tone body) mixed with filtered white noise (snap/sizzle).
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - Snare909 configuration: pattern, volume, toneDecay, noiseDecay, toneNoiseRatio, effects.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'snare909'`.
 *
 * @example
 * ```ts
 * const snare = Snare909({ pattern: [0,0,1,0, 0,0,1,0], toneDecay: 0.2 })
 * ```
 */
export const Snare909 = (props?: Snare909DSLProps): InstrumentDescriptor => makeDescriptor('snare909', props ?? {})

/**
 * Create a SubSynth instrument descriptor — subtractive synthesis voice.
 * Oscillator (saw/square) → resonant filter → ADSR VCA.
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - SubSynth configuration: wave, frequency, filter, adsr, pattern, volume, effects.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'subsynth'`.
 *
 * @example
 * ```ts
 * const bass = SubSynth({
 *   wave: 'sawtooth',
 *   frequency: 110,
 *   filter: { type: 'lowpass', frequency: 800, Q: 4 },
 *   adsr: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
 * })
 * ```
 */
export const SubSynth = (props?: SubSynthDSLProps): InstrumentDescriptor => makeDescriptor('subsynth', props ?? {})

/**
 * Create a FMSynth instrument descriptor — 2-operator FM synthesis voice.
 * Carrier: sine at `frequency`. Modulator: sine at `frequency × modRatio` (default 1.273, inharmonic/metallic).
 * Returns pure data — the engine hydrates it into audio at play time.
 *
 * @param props - FMSynth configuration: frequency, modRatio, modIndex, ampAdsr, modAdsr, gain, effects.
 * @returns An {@link InstrumentDescriptor} with `instrumentType: 'fmsynth'`.
 *
 * @example
 * ```ts
 * const rhodes = FMSynth({
 *   frequency: 220,
 *   modRatio: 1.273,
 *   modIndex: 3,
 *   ampAdsr: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.4 },
 * })
 * ```
 */
export const FMSynth = (props?: FMSynthDSLProps): InstrumentDescriptor => makeDescriptor('fmsynth', props ?? {})
