// ── @score/dsl — Hand-written type stub for Monaco TypeScript language service ──
//
// Purpose: Give Monaco enough type information to flag unknown Score symbols
// without full IntelliSense (autocomplete, hover docs). That is Phase 13v.
//
// This file is loaded via monaco.languages.typescript.typescriptDefaults.addExtraLib
// on editor mount. It declares the ambient shape of @score/dsl, @score/pattern,
// and the math/theory helpers injected into the song eval sandbox.
//
// HARDWARE BOUNDARY — renderer process: types only, no runtime imports.

// ── Shared descriptor types ────────────────────────────────────────────────────

/** Opaque part descriptor returned by all instrument factories. */
declare interface PartDescriptor {
  readonly _instrumentType: string
}

/** Chain methods available on every instrument (partial — IntelliSense phase adds full set). */
declare interface ChainMethods<T> {
  volume(v: number): T
  mute(): T
  reverb(wet?: number, decay?: number): T
  delay(wet?: number, time?: number, feedback?: number): T
  filter(cutoff?: number, resonance?: number): T
  distortion(amount?: number): T
  chorus(depth?: number, rate?: number): T
  flanger(depth?: number, rate?: number): T
  phaser(depth?: number, rate?: number): T
  compressor(threshold?: number, ratio?: number): T
  limiter(ceiling?: number): T
  eq(low?: number, mid?: number, high?: number): T
  bitcrusher(bits?: number, mix?: number): T
  stereoWidener(width?: number): T
  gate(threshold?: number, ratio?: number): T
  pan(value?: number): T
  pitch(semitones?: number): T
  octave(n?: number): T
  scale(name?: string): T
  glide(time?: number): T
  decay(time?: number): T
  attack(time?: number): T
  release(time?: number): T
  tune(semitones?: number): T
  swing(amount?: number): T
  humanize(amount?: number): T
  degrade(probability?: number): T
  stepProb(probability?: number): T
  pattern(p: readonly (number | string)[]): T
  notes(n: readonly string[]): T
  every(n: number, fn: (p: readonly number[]) => readonly number[]): T
  stretch(factor?: number): T
  mask(m: readonly number[]): T
  fromBar(bar?: number): T
  untilBar(bar?: number): T
  fadeInBars(bars?: number): T
  fadeOutBars(bars?: number): T
  chokeGroup(id?: string): T
  seed(n?: number): T
  dur(steps?: number): T
  visual(id?: string): T
  color(hex?: string): T
  glyph(char?: string): T
  label(text?: string): T
}

/** A ChainablePart is a PartDescriptor with chain methods. */
declare type ChainablePart = PartDescriptor & ChainMethods<ChainablePart>

// ── Song structure ─────────────────────────────────────────────────────────────

declare interface SongDefinition {
  readonly bpm:    number
  readonly tracks: readonly PartDescriptor[]
}

declare function Song(props: { bpm: number; tracks: readonly PartDescriptor[]; seed?: number }): SongDefinition
declare function Track(parts: readonly PartDescriptor[]): ChainablePart

// ── Percussion ─────────────────────────────────────────────────────────────────

declare function Kick(shorthand?: number): ChainablePart
declare function Snare(shorthand?: number): ChainablePart
declare function HiHat(shorthand?: number): ChainablePart
declare function Kick808(shorthand?: number): ChainablePart
declare function Kick909(shorthand?: number): ChainablePart
declare function Snare909(shorthand?: number): ChainablePart
declare function Hihat808(shorthand?: number): ChainablePart
declare function HihatOpen808(shorthand?: number): ChainablePart

// ── Melodic instruments ────────────────────────────────────────────────────────

declare function Synth(props?: { wave?: 'sine' | 'sawtooth' | 'square' | 'triangle'; volume?: number }): ChainablePart
declare function Sample(props?: { src?: string; volume?: number }): ChainablePart
declare function Theremin(props?: { volume?: number }): ChainablePart
declare function Sax(props?: { volume?: number }): ChainablePart
declare function Arp(props?: { notes?: readonly string[]; volume?: number }): ChainablePart

declare function Pad(note?: string): ChainablePart
declare function Pluck(note?: string): ChainablePart
declare function Rhodes(note?: string): ChainablePart
declare function Stab(note?: string): ChainablePart
declare function Wurlitzer(note?: string): ChainablePart
declare function Hammond(note?: string): ChainablePart
declare function Clavinet(note?: string): ChainablePart
declare function DX7Lead(note?: string): ChainablePart
declare function WavetableSynth(note?: string): ChainablePart
declare function SuperSaw(note?: string): ChainablePart
declare function KarplusSynth(note?: string): ChainablePart
declare function Guitar(note?: string): ChainablePart
declare function AcousticGuitar(note?: string): ChainablePart
declare function BassGuitar(note?: string): ChainablePart
declare function Trumpet(note?: string): ChainablePart
declare function Trombone(note?: string): ChainablePart
declare function FrenchHorn(note?: string): ChainablePart
declare function Flugelhorn(note?: string): ChainablePart

declare function Bass303(note?: string): ChainablePart & {
  cutoff(freq?: number): ChainablePart
  resonance(q?: number): ChainablePart
  accent(amount?: number): ChainablePart
  slide(time?: number): ChainablePart
  envDepth(depth?: number): ChainablePart
}

declare function SubSynth(note?: string): ChainablePart & {
  cutoff(freq?: number): ChainablePart
  resonance(q?: number): ChainablePart
  wave(type?: 'sawtooth' | 'square'): ChainablePart
}

declare function FMSynth(note?: string): ChainablePart & {
  modRatio(ratio?: number): ChainablePart
  modIndex(index?: number): ChainablePart
}

// ── Pattern functions (injected into sandbox from @score/pattern) ──────────────

declare function euclidean(steps: number, beats: number, offset?: number): readonly number[]
declare function fast(factor: number, pattern: readonly number[]): readonly number[]
declare function slow(factor: number, pattern: readonly number[]): readonly number[]
declare function rev(pattern: readonly number[]): readonly number[]
declare function every(n: number, fn: (p: readonly number[]) => readonly number[]): (p: readonly number[]) => readonly number[]
declare function degrade(probability?: number): (p: readonly number[]) => readonly number[]
declare function shift(offset: number, pattern: readonly number[]): readonly number[]
declare function stack(...patterns: readonly (readonly number[])[]): readonly number[]
declare function beat(n: number): readonly number[]
declare function humanize(amount?: number): (p: readonly number[]) => readonly number[]

// ── Theory functions (injected into sandbox from @score/dsl theory) ───────────

declare function chord(root: string, type?: string): readonly string[]
declare function scale(root: string, type?: string): readonly string[]
declare function progression(chords: readonly string[]): readonly (readonly string[])[]
declare const Scale: Record<string, string>
declare const Progression: Record<string, readonly string[]>

// ── Utility (injected into sandbox) ───────────────────────────────────────────

declare function resolveFreq(note: string): number
