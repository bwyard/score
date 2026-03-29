// @score/instruments — instrument and effect registries
//
// INSTRUMENT_REGISTRY maps every instrumentType key to its component factory.
// EFFECTS_REGISTRY maps every effectType key to its effect factory.
//
// The engine uses these registries (post PR2) to replace the 14-case instrument switch
// and the hydrateEffect switch in engine.ts. For now they serve as the authoritative
// type source: InstrumentDescriptor.instrumentType is derived from
// keyof typeof INSTRUMENT_REGISTRY.
//
// Design rules:
//   - Object.freeze — registries are immutable after creation
//   - Zero let, zero classes, factory functions only
//   - Every future instrument drops into an existing category file with no structural change
//
// Planned instruments (not yet built) are marked with PLANNED comments.
// See docs/design/refactor-audit.md for the full file structure.

import {
  createKick808,
  createKick909,
  createHihat808,
  createSnare909,
  createSubtractiveSynth,
  createFMSynth,
  createPad,
  createRhodes,
  createPluck,
  createBass303,
  Theremin,
  Sax,
} from '@score/components'

import {
  createFilter,
  createDelay,
  createReverb,
  createCompressor,
  createEQ,
  createDistortion,
  createLimiter,
  createBitCrusher,
  createChorus,
  createPhaser,
  createFlanger,
  createStereoWidener,
  createGate,
  createSaturation,
  createAutoPan,
} from '@score/effects'

import { createGenericKick }  from './drums/kick.js'
import { createGenericSnare } from './drums/snare.js'
import { createGenericHihat } from './drums/cymbal.js'
import { createGenericSynth } from './synths/trigger.js'
import { createArp }          from './melodic/sequenced.js'

// ── Re-exports ────────────────────────────────────────────────────────────────

export type { GenericKickProps }  from './drums/kick.js'
export type { GenericSnareProps } from './drums/snare.js'
export type { GenericHihatProps } from './drums/cymbal.js'
export type {
  GenericSynthProps,
  GenericSynthEnvelope,
  GenericSynthFilterProps,
  GenericSynthComponent,
} from './synths/trigger.js'
export type { ArpProps, ArpEnvelope, ArpComponent } from './melodic/sequenced.js'

export { createGenericKick }  from './drums/kick.js'
export { createGenericSnare } from './drums/snare.js'
export { createGenericHihat } from './drums/cymbal.js'
export { createGenericSynth } from './synths/trigger.js'
export { createArp }          from './melodic/sequenced.js'

// ── INSTRUMENT_REGISTRY ───────────────────────────────────────────────────────
//
// Maps instrumentType → component factory. The engine (post PR2) calls:
//   INSTRUMENT_REGISTRY[comp.instrumentType]?.(ctx, normalizedProps)
//
// Factory signatures vary by instrument dispatch model:
//   A — Percussion (create-once, trigger-repeatedly): (ctx, props) → PercussionComponent
//   B — Melodic voice (create per note):              (ctx, props) → voice-like AudioComponent
//   C — Continuous (boot once, setFrequency per step): (ctx, props) → continuous AudioComponent
//   D — State machine:                                 (ctx, props) → ArpComponent
//   E — Special (sample):                              requires decoded buffer, engine-managed
//
// 'sample' is omitted from the registry — it requires a pre-decoded BackendBuffer passed
// at runtime by the engine; it cannot be constructed from props alone.
// The engine continues to handle 'sample' via its existing createSamplePlayer path.
//
// PLANNED entries are commented out — they will be added when the instruments are built.

export const INSTRUMENT_REGISTRY = Object.freeze({
  // ── Drums — Model A ─────────────────────────────────────────────
  'kick':      createGenericKick,       // generic sine sweep
  'snare':     createGenericSnare,      // generic noise + sine
  'hihat':     createGenericHihat,      // generic HPF noise
  'kick808':   createKick808,           // pure sine pitch envelope
  'kick909':   createKick909,           // kick808 + noise click
  'hihat808':  createHihat808,          // 6 detuned sq oscs
  'snare909':  createSnare909,          // 2 triangle oscs + noise HPF
  // PLANNED: 'clap909', 'cowbell808', 'rimshot', 'kickHardstyle', 'kickHardcore'

  // ── Synths — Model B ─────────────────────────────────────────────
  'synth':     createGenericSynth,      // basic oscillator + ADSR (trigger per note)
  'subsynth':  createSubtractiveSynth,  // osc → resonant filter → ADSR VCA, unison/detune
  'pad':       createPad,               // subsynth with slow-attack defaults
  'fmsynth':   createFMSynth,           // 2-op FM synthesis
  'rhodes':    createRhodes,            // fmsynth with DX7 defaults
  'pluck':     createPluck,             // Karplus-Strong, no noteOff
  'bass-303':  createBass303,           // TB-303: MEG/VEG, cutoff/resonance, glide
  // PLANNED: 'supersaw', 'reese', 'wobbleBass', 'granular', 'wavetable', 'organ'

  // ── Melodic — Model C + D ─────────────────────────────────────────
  'theremin':  Theremin,                // Model C — continuous, no steps
  'sax':       Sax,                     // Model C — persistent voice + per-step trigger
  'arp':       createArp,               // Model D — arpState cycling note machine
  // PLANNED: 'flute', 'strings', 'choir'
} as const)

/**
 * The set of all registered instrument type keys.
 * `InstrumentDescriptor.instrumentType` is derived from this type.
 *
 * @example
 * ```ts
 * const isKnownInstrument = (t: string): t is InstrumentType =>
 *   t in INSTRUMENT_REGISTRY
 * ```
 */
export type InstrumentType = keyof typeof INSTRUMENT_REGISTRY

// ── EFFECTS_REGISTRY ──────────────────────────────────────────────────────────
//
// Maps effectType → effect factory from @score/effects.
// The engine (post PR2) calls:
//   EFFECTS_REGISTRY[desc.effectType]?.(ctx, desc.props)
//
// Replaces the hydrateEffect switch in engine.ts.

export const EFFECTS_REGISTRY = Object.freeze({
  'delay':          createDelay,
  'reverb':         createReverb,
  'filter':         createFilter,
  'compressor':     createCompressor,
  'eq':             createEQ,
  'distortion':     createDistortion,
  'limiter':        createLimiter,
  'bitcrusher':     createBitCrusher,
  'chorus':         createChorus,
  'phaser':         createPhaser,
  'flanger':        createFlanger,
  'stereo-widener': createStereoWidener,
  'gate':           createGate,
  'saturation':     createSaturation,
  'autopan':        createAutoPan,
} as const)

/**
 * The set of all registered effect type keys.
 * Derived from `EFFECTS_REGISTRY` — no manual sync needed.
 */
export type EffectType = keyof typeof EFFECTS_REGISTRY
