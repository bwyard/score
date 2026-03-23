export { Song } from './song.js'
export { Intro, Buildup, Drop, Breakdown, Outro } from './sections.js'
export { Track } from './track.js'
export { Sequence } from './sequence.js'
export { Kick, Snare, HiHat, Synth, Sample, Theremin, Sax, Arp, Kick808, Kick909, Hihat808, Snare909, SubSynth, FMSynth } from './instruments.js'
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
