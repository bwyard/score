// melodic.ts — Melodic instrument factories for @score/dsl
//
// All factories return ChainablePart via createPart().
// Instrument-specific chain extras (cutoff, ratio, etc.) are added via object
// spread on the base part — each returns a new ChainablePart.
//
// Stubs (createPart only) are marked — engine has a fallback for unknown types.
// Real @score/components implementations for stubs come in a follow-up PR.

import { createPart } from './chain.js'
import type { ChainablePart, ChainMethods, PartDescriptor } from './chain.js'

// ── Synth ─────────────────────────────────────────────────────────────────────

/**
 * General-purpose oscillator synth — oscillator + ADSR envelope + optional filter.
 *
 * @param wave - Oscillator wave type. Default `'sawtooth'`.
 * @param pitch - Optional starting pitch, e.g. `'C3'`.
 * @returns A `ChainablePart` for `'synth'`.
 *
 * @example
 * ```ts
 * // Pad chord with reverb
 * Synth('sine', 'C3').notes(['C3','E3','G3']).reverb(0.4).volume(0.5)
 * ```
 *
 * @see {@link SubSynth} — analogue subtractive voice
 * @see {@link FMSynth} — 2-operator FM voice
 */
export const Synth = (
  wave: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sawtooth',
  pitch?: string,
): ChainablePart =>
  createPart({
    instrumentType: 'synth',
    props: { wave },
    ...( pitch !== undefined ? { _notes: [pitch] } : {}),
  })

// ── SubSynth ──────────────────────────────────────────────────────────────────

/**
 * Extended ChainablePart with SubSynth-specific chain methods.
 * Declared as interface so TypeScript resolves the self-referential ChainMethods<SubSynthPart>.
 */
export interface SubSynthPart extends PartDescriptor, ChainMethods<SubSynthPart> {
  /** Number of detuned oscillators (unison stack). `1` = mono, `2` = dual, `4` = quad. Default `1`. */
  readonly unison: (n: 1 | 2 | 4) => SubSynthPart
  /** Detune spread in cents across unison oscillators. Default `8`. */
  readonly detune: (cents: number) => SubSynthPart
}

const makeSubSynth = (base: ChainablePart): SubSynthPart => ({
  ...(base as unknown as SubSynthPart),  // chain methods produce SubSynthPart via wrap threading
  unison: (n) => makeSubSynth(createPart({ ...base, props: { ...base.props, unison: n } }, makeSubSynth)),
  detune: (cents) => makeSubSynth(createPart({ ...base, props: { ...base.props, detune: cents } }, makeSubSynth)),
})

/**
 * Analogue subtractive synth voice — detuned oscillators → resonant LP filter → ADSR VCA.
 * Inspired by the Juno-60 and Minimoog. Excellent for bass lines, leads, and pads.
 *
 * @param pitch - Optional starting pitch, e.g. `'C2'`.
 * @returns A {@link SubSynthPart} with `.unison()` and `.detune()` extras.
 *
 * @example
 * ```ts
 * // Deep house bass — dual oscillator, filter sweep
 * SubSynth('C2').unison(2).detune(8).filter(600, 1.2).wobble(0.5)
 * ```
 *
 * @see {@link Synth} — simpler oscillator voice
 * @see {@link Bass303} — 303-style acid bass
 */
export const SubSynth = (pitch?: string): SubSynthPart =>
  makeSubSynth(
    createPart({
      instrumentType: 'sub-synth',
      props: {},
      ...( pitch !== undefined ? { _notes: [pitch] } : {}),
    }, makeSubSynth),
  )

// ── FMSynth ───────────────────────────────────────────────────────────────────

/**
 * Extended ChainablePart with FMSynth-specific chain methods.
 * Declared as interface so TypeScript resolves the self-referential ChainMethods<FMSynthPart>.
 */
export interface FMSynthPart extends PartDescriptor, ChainMethods<FMSynthPart> {
  /** Modulator-to-carrier frequency ratio. Non-integer = inharmonic/metallic. Default `1.273`. */
  readonly ratio: (n: number) => FMSynthPart
  /** Modulation index — peak deviation multiplier of carrier frequency. Default `3`. */
  readonly modIndex: (n: number) => FMSynthPart
  /** Feedback amount 0–1 (carrier feeds back to modulator). Default `0`. */
  readonly feedback: (n: number) => FMSynthPart
}

const makeFMSynth = (base: ChainablePart): FMSynthPart => ({
  ...(base as unknown as FMSynthPart),  // chain methods produce FMSynthPart via wrap threading
  ratio: (n) => makeFMSynth(createPart({ ...base, props: { ...base.props, modRatio: n } }, makeFMSynth)),
  modIndex: (n) => makeFMSynth(createPart({ ...base, props: { ...base.props, modIndex: n } }, makeFMSynth)),
  feedback: (n) => makeFMSynth(createPart({ ...base, props: { ...base.props, feedback: n } }, makeFMSynth)),
})

/**
 * 2-operator FM synthesis voice — DX7 Rhodes / metallic leads / electric piano.
 * Carrier and modulator are both sine oscillators.
 *
 * @param pitch - Optional starting pitch, e.g. `'A3'`.
 * @returns An {@link FMSynthPart} with `.ratio()`, `.modIndex()`, `.feedback()` extras.
 *
 * @example
 * ```ts
 * // DX7 Rhodes voicing at A3 — classic deep house chord
 * FMSynth('A3').ratio(1.273).modIndex(3).reverb(0.3).volume(0.6)
 * ```
 *
 * @example
 * ```ts
 * // Metallic FM lead — inharmonic ratio, high modulation index
 * FMSynth('C4').ratio(3.5).modIndex(6).delay(0.375, 0.4)
 * ```
 *
 * @see {@link SubSynth} — analogue subtractive alternative
 * @see {@link Synth} — simpler wavetable voice
 */
export const FMSynth = (pitch?: string): FMSynthPart =>
  makeFMSynth(
    createPart({
      instrumentType: 'fm-synth',
      props: {},
      ...( pitch !== undefined ? { _notes: [pitch] } : {}),
    }, makeFMSynth),
  )

// ── Bass303 ───────────────────────────────────────────────────────────────────

/**
 * Extended ChainablePart with Bass303-specific chain methods.
 * Declared as interface so TypeScript resolves the self-referential ChainMethods<Bass303Part>.
 */
export interface Bass303Part extends PartDescriptor, ChainMethods<Bass303Part> {
  /** Filter cutoff frequency in Hz. Default `400`. */
  readonly cutoff: (freq: number) => Bass303Part
  /** Filter cutoff + optional resonance Q — overrides base filter() to map into props. */
  readonly filter: (freq: number, q?: number) => Bass303Part
  /** Filter resonance Q. Default `0.8`. Increases to self-oscillation at high values. */
  readonly resonance: (q: number) => Bass303Part
  /** Accent steps — step indices where velocity is boosted and filter opens fully. */
  readonly accent: (steps: number[]) => Bass303Part
  /** Slide steps — step indices with portamento (glide) to next note. */
  readonly slide: (steps: number[]) => Bass303Part
}

const makeBass303 = (base: ChainablePart): Bass303Part => ({
  ...(base as unknown as Bass303Part),  // chain methods produce Bass303Part via wrap threading
  // Override ChainablePart.filter() to map freq→cutoff and q→resonance in props
  // so it stays consistent with .cutoff()/.resonance() when authors use the generic method.
  filter: (freq, q) => makeBass303(createPart({ ...base, props: { ...base.props, cutoff: freq, ...(q !== undefined ? { resonance: q } : {}) } }, makeBass303)),
  cutoff: (freq) => makeBass303(createPart({ ...base, props: { ...base.props, cutoff: freq } }, makeBass303)),
  resonance: (q) => makeBass303(createPart({ ...base, props: { ...base.props, resonance: q } }, makeBass303)),
  accent: (steps) => makeBass303(createPart({ ...base, props: { ...base.props, accentSteps: steps } }, makeBass303)),
  slide: (steps) => makeBass303(createPart({ ...base, props: { ...base.props, slideSteps: steps } }, makeBass303)),
})

/**
 * Roland TB-303-style acid bass — sawtooth/square oscillator + resonant filter with envelope.
 * The defining voice of acid house, acid techno, and trance. Glide and accent are essential.
 *
 * @param pitch - Optional starting pitch, e.g. `'C2'`.
 * @returns A {@link Bass303Part} with `.cutoff()`, `.resonance()`, `.accent()`, `.slide()` extras.
 *
 * @example
 * ```ts
 * // Classic acid bassline — open filter + resonance + accent on downbeats
 * Bass303('C2').cutoff(600).resonance(2.0).accent([0, 4, 8]).wobble(0.5)
 * ```
 *
 * @example
 * ```ts
 * // Slide phrase across a scale
 * Bass303('C2').notes(['C2','D2','F2','G2']).slide([1,3]).cutoff(500).resonance(1.5)
 * ```
 *
 * @see {@link SubSynth} — broader analogue voice
 */
export const Bass303 = (pitch?: string): Bass303Part =>
  makeBass303(
    createPart({
      instrumentType: 'bass-303',
      props: {},
      ...( pitch !== undefined ? { _notes: [pitch] } : {}),
    }, makeBass303),
  )

// ── Arp ───────────────────────────────────────────────────────────────────────

/**
 * Arpeggiator — cycles through `notes` in sequence, up/down/pingpong/random.
 * Each step triggers a note from the sequence at the current synth voice.
 *
 * @param notes - Ordered note names or MIDI pitch numbers to arpeggiate, e.g. `['C3','E3','G3']`.
 * @returns A `ChainablePart` for `'arp'`.
 *
 * @example
 * ```ts
 * // Classic trance arp — up mode, triangle wave
 * Arp(['C4','E4','G4','B4']).euclidean(8, 16).volume(0.5).delay(0.375, 0.3)
 * ```
 *
 * @see {@link Synth} — underlying oscillator voice
 * @see {@link Bass303} — monophonic acid bassline alternative
 */
export const Arp = (notes: (string | number)[]): ChainablePart =>
  createPart({
    instrumentType: 'arp',
    props: { notes },
    _notes: notes,
  })

// ── Sample ────────────────────────────────────────────────────────────────────

/**
 * Sample playback — load and trigger an audio file on each pattern hit.
 *
 * @param path - Absolute or relative path to the audio file (`.wav`, `.mp3`, `.ogg`).
 * @returns A `ChainablePart` for `'sample'`.
 *
 * @example
 * ```ts
 * // One-shot clap on beats 2 and 4
 * Sample('./samples/clap.wav').hits(4, 12).volume(0.7)
 * ```
 *
 * @see {@link Arp} — pitched sequence without sample files
 */
export const Sample = (path: string): ChainablePart =>
  createPart({
    instrumentType: 'sample',
    props: { path },
  })

// ── Theremin ──────────────────────────────────────────────────────────────────

/**
 * Theremin — continuous pitch/volume control, sine oscillator with LFO vibrato.
 * Plays continuously; use `.note()` to set pitch and `.volume()` for amplitude.
 *
 * @param pitch - Optional starting pitch, e.g. `'A4'`.
 * @returns A `ChainablePart` for `'theremin'`.
 *
 * @example
 * ```ts
 * Theremin('A4').vibrato(5, 8).volume(0.4)
 * ```
 */
export const Theremin = (pitch?: string): ChainablePart =>
  createPart({
    instrumentType: 'theremin',
    props: {},
    ...( pitch !== undefined ? { _notes: [pitch] } : {}),
  })

// ── Sax ───────────────────────────────────────────────────────────────────────

/**
 * Saxophone — sawtooth oscillator through bandpass filter with ADSR envelope.
 * Breathy, reedy character. Use for jazz, house, or melodic leads.
 *
 * @param pitch - Optional starting pitch, e.g. `'A4'`.
 * @returns A `ChainablePart` for `'sax'`.
 *
 * @example
 * ```ts
 * Sax('A4').notes(['A4','B4','C5','D5']).dur(0.35).reverb(0.2)
 * ```
 */
export const Sax = (pitch?: string): ChainablePart =>
  createPart({
    instrumentType: 'sax',
    props: {},
    ...( pitch !== undefined ? { _notes: [pitch] } : {}),
  })

// ── Stubs — real @score/components implementations pending ────────────────────
// Engine falls back to Synth('sine') for all unknown instrumentType values.
// These stubs are named anchors for the engine registry and future components.

/**
 * Soft pad voice — long attack, sustained, gentle filter. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'pad'`.
 */
export const Pad = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'pad', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Plucked string envelope — fast attack, fast decay. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'pluck'`.
 */
export const Pluck = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'pluck', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Short stab voice — percussive attack, no sustain. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'stab'`.
 */
export const Stab = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'stab', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Fender Rhodes electric piano — FM voice with tine character. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'rhodes'`.
 */
export const Rhodes = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'rhodes', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Wurlitzer electric piano — reedy, slightly overdriven. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'wurlitzer'`.
 */
export const Wurlitzer = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'wurlitzer', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Hammond B3-style tonewheel organ. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'hammond'`.
 */
export const Hammond = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'hammond', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Hohner Clavinet — percussive clavichord, used in funk. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'clavinet'`.
 */
export const Clavinet = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'clavinet', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * DX7-style FM lead — bright, cutting, metallic. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'dx7-lead'`.
 */
export const DX7Lead = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'dx7-lead', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Wavetable synth — cycles through waveform tables. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'wavetable'`.
 */
export const WavetableSynth = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'wavetable', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Supersaw — N detuned sawtooth oscillators (trance, big room, synthwave). @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'supersaw'`.
 */
export const SuperSaw = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'supersaw', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Karplus-Strong plucked string synthesis. @stub
 * @param pitch - Optional starting pitch, e.g. `'C4'`.
 * @returns A `ChainablePart` for `'karplus'`.
 */
export const KarplusSynth = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'karplus', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/**
 * Electric guitar — Karplus-Strong with pick model. @stub
 * @param pitch - Optional starting pitch, e.g. `'E2'`.
 * @returns A `ChainablePart` for `'guitar'`.
 */
export const Guitar = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'guitar', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/** Acoustic guitar — Karplus with body resonance. @stub */
export const AcousticGuitar = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'acoustic-guitar', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/** Bass guitar — Karplus with low-frequency body. @stub */
export const BassGuitar = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'bass-guitar', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/** Trumpet — bright brass with mute options. @stub */
export const Trumpet = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'trumpet', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/** Trombone — warm, sliding brass. @stub */
export const Trombone = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'trombone', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/** French horn — rich, mellow brass. @stub */
export const FrenchHorn = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'french-horn', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })

/** Flugelhorn — darker, softer trumpet variant. @stub */
export const Flugelhorn = (pitch?: string): ChainablePart =>
  createPart({ instrumentType: 'flugelhorn', props: {}, ...( pitch !== undefined ? { _notes: [pitch] } : {}) })
