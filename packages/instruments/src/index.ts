// @score/instruments — instrument and effect registries
//
// INSTRUMENT_REGISTRY maps every instrumentType key to its component factory,
// dispatch model, volume routing, and (for percussion) default step pattern.
//
// Adding a new instrument: add ONE entry here.
// The engine derives PERCUSSION_INSTRUMENT_TYPES, MELODIC_VOICE_INSTRUMENT_TYPES,
// and MELODIC_INSTRUMENT_TYPE_SET automatically — no separate Sets to maintain.
//
// Design rules:
//   - Object.freeze — registries are immutable after creation
//   - Zero let, zero classes, factory functions only
//   - Every future instrument drops into an existing category with no structural change
//
// Dispatch model reference:
//   A         — Percussion   (create-once, trigger per hit)
//   B         — Generic Synth (persistent component, triggerNote per step)
//   B-melodic — Melodic Voice (new voice per step: noteOn / noteOff)
//   C         — Continuous   (boot once, setFrequency per step)
//   D         — State machine (Arp: cycling note machine)
//
// Planned instruments (not yet built) are marked with PLANNED comments.
// See docs/design/refactor-audit.md for the full file structure.

import {
  createKick808,
  createKick909,
  createHihat808,
  createHihatOpen808,
  createSnare909,
  createSubtractiveSynth,
  createFMSynth,
  createPad,
  createRhodes,
  createPluck,
  createBass303,
  createClap909,
  createCowbell808,
  createKickHardstyle,
  createKickHardcore,
  createSupersaw,
  createWobbleBass,
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

// ── Dispatch model + volume routing tags ──────────────────────────────────────

/** Instrument dispatch model — determines how the engine triggers each type. */
export type DispatchModel = 'A' | 'B' | 'B-melodic' | 'C' | 'D'

/** Volume routing — determines whether chain `.volume()` maps to `gain` or `volume` in props. */
export type VolumeRouting = 'percussion' | 'melodic'

// ── Default percussion patterns ────────────────────────────────────────────────
// Exported for engine use. Grouped here so they stay in sync with registry entries.

export const DEFAULT_KICK_PATTERN  = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] as const
export const DEFAULT_SNARE_PATTERN = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] as const
export const DEFAULT_HIHAT_PATTERN = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0] as const

// ── INSTRUMENT_REGISTRY ───────────────────────────────────────────────────────
//
// One entry = one instrument. The engine derives all classification sets from this.
//
// Factory signatures vary by dispatch model — the engine casts at call time.
// 'sample' is omitted — it requires a pre-decoded buffer, engine-managed separately.

export const INSTRUMENT_REGISTRY = Object.freeze({

  // ── Drums — Model A ─────────────────────────────────────────────────────────
  'kick':         { factory: createGenericKick,      dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_KICK_PATTERN  },
  'snare':        { factory: createGenericSnare,     dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_SNARE_PATTERN },
  'hihat':        { factory: createGenericHihat,     dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_HIHAT_PATTERN },
  'kick808':      { factory: createKick808,           dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_KICK_PATTERN  },
  'kick909':      { factory: createKick909,           dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_KICK_PATTERN  },
  'hihat808':     { factory: createHihat808,          dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_HIHAT_PATTERN },
  'hihatopen808': { factory: createHihatOpen808,      dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_HIHAT_PATTERN },
  'snare909':      { factory: createSnare909,       dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_SNARE_PATTERN },
  'clap909':       { factory: createClap909,        dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_SNARE_PATTERN },
  'cowbell808':    { factory: createCowbell808,     dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_HIHAT_PATTERN },
  'kickHardstyle': { factory: createKickHardstyle,  dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_KICK_PATTERN  },
  'kickHardcore':  { factory: createKickHardcore,   dispatchModel: 'A' as DispatchModel, volumeRouting: 'percussion' as VolumeRouting, defaultPattern: DEFAULT_KICK_PATTERN  },

  // ── Synth — Model B ──────────────────────────────────────────────────────────
  'synth':        { factory: createGenericSynth,     dispatchModel: 'B'         as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },

  // ── Melodic voices — Model B-melodic ────────────────────────────────────────
  'subsynth':     { factory: createSubtractiveSynth, dispatchModel: 'B-melodic' as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'pad':          { factory: createPad,              dispatchModel: 'B-melodic' as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'fmsynth':      { factory: createFMSynth,          dispatchModel: 'B-melodic' as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'rhodes':       { factory: createRhodes,           dispatchModel: 'B-melodic' as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'pluck':        { factory: createPluck,            dispatchModel: 'B-melodic' as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'bass-303':     { factory: createBass303,          dispatchModel: 'B-melodic' as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'supersaw':     { factory: createSupersaw,         dispatchModel: 'B-melodic' as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'wobble':       { factory: createWobbleBass,       dispatchModel: 'B-melodic' as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  // PLANNED: 'reese', 'granular', 'wavetable', 'organ'

  // ── Continuous + state machine — Model C, D ─────────────────────────────────
  'theremin':     { factory: Theremin,               dispatchModel: 'C'         as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'sax':          { factory: Sax,                    dispatchModel: 'C'         as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  'arp':          { factory: createArp,              dispatchModel: 'D'         as DispatchModel, volumeRouting: 'melodic' as VolumeRouting },
  // PLANNED: 'flute', 'strings', 'choir'

})

// ── Derived classification sets ───────────────────────────────────────────────
//
// Engine imports these instead of maintaining manual Sets.
// Adding a new instrument to INSTRUMENT_REGISTRY updates these automatically.

/** All registered instrument type keys. */
export type InstrumentType = keyof typeof INSTRUMENT_REGISTRY

/** Model A percussion types — create-once, trigger per hit. */
export const PERCUSSION_INSTRUMENT_TYPES: ReadonlySet<InstrumentType> = new Set(
  (Object.entries(INSTRUMENT_REGISTRY) as [InstrumentType, { dispatchModel: DispatchModel }][])
    .filter(([, e]) => e.dispatchModel === 'A')
    .map(([k]) => k),
)

/** Model B-melodic types — new voice per step (noteOn / noteOff). */
export const MELODIC_VOICE_INSTRUMENT_TYPES: ReadonlySet<InstrumentType> = new Set(
  (Object.entries(INSTRUMENT_REGISTRY) as [InstrumentType, { dispatchModel: DispatchModel }][])
    .filter(([, e]) => e.dispatchModel === 'B-melodic')
    .map(([k]) => k),
)

/**
 * All melodic instrument type keys + 'sample'.
 * Used to route `_volume` to `gain` (melodic) rather than `volume` (percussion).
 * 'sample' is not in the registry (pre-decoded buffer path) but is melodic for volume routing.
 */
export const MELODIC_INSTRUMENT_TYPE_SET: ReadonlySet<string> = new Set([
  ...(Object.entries(INSTRUMENT_REGISTRY) as [string, { volumeRouting: VolumeRouting }][])
    .filter(([, e]) => e.volumeRouting === 'melodic')
    .map(([k]) => k),
  'sample',
])

// ── EFFECTS_REGISTRY ──────────────────────────────────────────────────────────
//
// Maps effectType → effect factory from @score/effects.
// The engine calls: EFFECTS_REGISTRY[desc.effectType]?.(ctx, desc.props)

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
