export { Song } from './song.js'
export { Intro, Buildup, Drop, Breakdown, Outro } from './sections.js'
export { Track } from './track.js'
export { Sequence } from './sequence.js'
export { Synth, Sample, Theremin, Sax, Arp } from './instruments.js'
export { Kick, Snare, HiHat, Kick808, Kick909, Hihat808, Snare909 } from './percussion.js'
export { Bass303, SubSynth, FMSynth, Pad, Pluck, Stab, Rhodes, Wurlitzer, Hammond, Clavinet, DX7Lead, WavetableSynth, SuperSaw, KarplusSynth, Guitar, AcousticGuitar, BassGuitar, Trumpet, Trombone, FrenchHorn, Flugelhorn } from './melodic.js'
export type { Bass303Part, FMSynthPart, SubSynthPart } from './melodic.js'
export { chord, scale, progression, Scale, Progression } from './theory.js'
export type { ScaleObject, ProgressionObject } from './theory.js'
export { defineGenre, DEFAULT_REGISTRY, Techno, House, DeepHouse, DnB, Dubstep, Hardstyle, Trance, FutureBass, Trap, Psytrance, IDM, Ambient, Synthwave, LoFi, MinimalTechno, AcidHouse } from './genre.js'
export { defineGroove, GrooveStraight, GrooveShuffle, GrooveSwing16, GrooveHipHop, GrooveLatin, GrooveMPC } from './groove.js'
export type { PartDescriptor, ChainablePart, ChainMethods } from './chain.js'
export { createPart } from './chain.js'
export { noteHz, resolveFreq } from './notes.js'
export { drift, keepFor } from './modifiers.js'
export type {
  SongDefinition,
  SongProps,
  SectionDefinition,
  SectionType,
  TrackComponent,
  TrackProps,
  InstrumentDescriptor,
  KickProps,
  SnareProps,
  HiHatProps,
  SynthDSLProps,
  SampleProps,
  ThereminDSLProps,
  SaxDSLProps,
  ArpDSLProps,
  Kick808DSLProps,
  Kick909DSLProps,
  Hihat808DSLProps,
  Snare909DSLProps,
  SubSynthDSLProps,
  FMSynthDSLProps,
} from './types.js'
