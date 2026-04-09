// =============================================================================
// @score/dsl — chain types
// PartDescriptor, ChainMethods, and ChainablePart type definitions.
//
// Kept separate from chain.ts (factory implementation) so consumers can import
// types without pulling in the full createPart() factory and all validators.
// =============================================================================

import type { AudioComponent, EffectDescriptor } from '@score/core'
import type { BackendNode }                       from '@score/core'
import type { PatternInput }                       from '@score/pattern'
import type { ModulationDescriptor }               from './modulation.js'

// ── Supporting types ──────────────────────────────────────────────────────────

/** Context passed to `.apply()` and `.mapNotes()` callbacks. Same inputs → same output. */
export type PatternCtx = {
  readonly bar:   number
  readonly bpm:   number
  readonly steps: number
  readonly seed:  number
}

/** A send routing entry — route to a named effect bus at a given amount. */
export type SendDescriptor = {
  readonly bus:    string
  readonly amount: number
}

/** Sidechain / ducking configuration. */
export type SidechainDescriptor = {
  readonly source:  string | ChainablePart
  readonly amount:  number
  readonly attack:  number
  readonly release: number
  readonly mode:    'duck' | 'reverse'
}

// ── PartDescriptor — pure data shape carrying all chain state ─────────────────

/**
 * Pure data record carrying all chain method state for a single instrument part.
 *
 * The engine reads these `_`-prefixed fields at play time and hydrates them into live audio.
 * Every field is optional except `_type`, `_version`, `instrumentType`, `type`, and `id`.
 *
 * Song authors never construct this directly — use the instrument factories
 * (`Kick`, `Synth`, `Arp`, etc.) which return a {@link ChainablePart} with all methods attached.
 *
 * @see {@link ChainablePart} — adds fluent chain methods on top of this descriptor
 * @see {@link createPart}    — factory that produces a `ChainablePart` from a partial descriptor
 */
export type PartDescriptor = {
  readonly _type:           'ChainablePart'
  readonly _version:        1
  readonly instrumentType:  string
  /** Alias for instrumentType — satisfies AudioComponent.type contract. */
  readonly type:            string
  readonly id:              string
  /** Human-readable label — GUI mixer name, codePatcher correlation. */
  readonly _name?:          string
  /** Per-part stochastic seed. Overrides song-level seed for this part only. */
  readonly _seed?:          number
  /** Model variant — percussion only: '808' | '909' | 'hard' | 'generic' etc. */
  readonly _model?:         string
  // ── Pattern ────────────────────────────────────────────────────────────────
  readonly _pattern?:       PatternInput
  readonly _speed?:         number
  readonly _degrade?:       number
  readonly _humanize?:      number
  readonly _swing?:         number
  readonly _stutter?:       number
  readonly _palindrome?:    boolean
  readonly _mask?:          PatternInput
  readonly _repeat?:        number
  readonly _stepProb?:      ReadonlyArray<number>
  readonly _applyFn?:       (p: number[], ctx: PatternCtx) => number[]
  readonly _mapNotesFn?:    (notes: (string | number)[], ctx: PatternCtx) => (string | number)[]
  readonly _every?:         { readonly n: number; readonly fn: (p: number[]) => number[] }
  readonly _stretch?:       number
  readonly _phase?:         number
  readonly _fromBar?:       number
  readonly _untilBar?:      number
  readonly _fadeInBars?:    number
  readonly _fadeOutBars?:   number
  // ── Pitch / notes ──────────────────────────────────────────────────────────
  readonly _notes?:         ReadonlyArray<string | number>
  readonly _scale?:         { readonly name: string; readonly root: string }
  readonly _pitchOffset?:   number
  readonly _octave?:        number
  readonly _glide?:         number
  readonly _dur?:           number
  // ── Amplitude ──────────────────────────────────────────────────────────────
  readonly _volume?:        number
  readonly _pan?:           number
  readonly _adsr?: {
    readonly attack?:   number
    readonly decay?:    number
    readonly sustain?:  number
    readonly release?:  number
  }
  readonly _sidechain?:     SidechainDescriptor
  // ── Timbre ─────────────────────────────────────────────────────────────────
  /** Bandpass filter centre frequency in Hz (Hz). Used by Snare, Snare909. */
  readonly _tone?:   number
  // ── Tone ───────────────────────────────────────────────────────────────────
  readonly _filter?: { readonly frequency: number; readonly Q?: number }
  readonly _eq?:     { readonly lo: number; readonly mid: number; readonly hi: number }
  // ── Effects chain ──────────────────────────────────────────────────────────
  readonly _effects?:       ReadonlyArray<EffectDescriptor>
  // ── Routing ────────────────────────────────────────────────────────────────
  readonly _sends?:         ReadonlyArray<SendDescriptor>
  readonly _mute?:          boolean
  readonly _solo?:          boolean
  readonly _chokeGroup?:    string
  readonly _layers?:        ReadonlyArray<PartDescriptor>
  // ── Modulations ────────────────────────────────────────────────────────────
  readonly _modulations?:   ReadonlyArray<{
    readonly param:  string
    readonly source: ModulationDescriptor
  }>
  // ── Visual — per-track visual override ─────────────────────────────────────
  // @score/visuals reads this from TrackVisualState and merges over InstrumentVisualMap defaults.
  readonly _visual?: {
    /** CSS hex color override for Monaco arcs, PunchcardGrid, and PerformanceCanvas. */
    readonly color?:   string
    /** Inline glyph kind for the Monaco editor. */
    readonly glyph?:   string
    /** Human-readable label override (defaults to track variable name). */
    readonly label?:   string
    /** Opacity override 0–1. */
    readonly opacity?: number
  }
  // ── Props — for engine backwards compat during transition ──────────────────
  readonly props: Record<string, unknown>
  // ── AudioComponent stubs — satisfied by createPart(), replaced by engine ───
  readonly connect:    (destination: BackendNode) => AudioComponent
  readonly disconnect: () => AudioComponent
  readonly dispose:    () => void
}

// ── ChainMethods<T> — all fluent chain methods, generic over return type ──────

/**
 * All fluent chain methods for a part — generic over `T`, the return type of every method.
 *
 * `ChainablePart` uses `ChainMethods<ChainablePart>`.
 * Sub-types declare `PartDescriptor & ChainMethods<Self> & Extras`
 * so every chain method preserves the sub-type through composition.
 *
 * Thesis: functional composition preserves identity.
 * A `Bass303Part` through `.volume()` is still a `Bass303Part`.
 */
export type ChainMethods<T> = {
  // ── Pattern ──────────────────────────────────────────────────────────────
  /** Speed multiplier. `n > 1` = fast, `n < 1` = slow, `n < 0` = reverse. */
  readonly speed:       (n: number) => T
  /** Sugar: `speed(1/n)` — play n times slower. */
  readonly slow:        (n: number) => T
  /** Sugar: `speed(n)` — play n times faster. */
  readonly fast:        (n: number) => T
  /** Sugar: reverse the pattern. */
  readonly rev:         () => T
  /** Sugar: half-time feel. */
  readonly halfTime:    () => T
  /** Sugar: double-time feel. */
  readonly doubleTime:  () => T
  /** Sugar: triplet feel (3 against 2). */
  readonly tripletTime: () => T
  /** Classical term: reverse. Alias for `.rev()`. */
  readonly retrograde:  () => T
  /** Classical: lengthen by factor n. Sugar for `slow(n)`. */
  readonly augment:     (n?: number) => T
  /** Classical: shorten by factor n. Sugar for `fast(n)`. */
  readonly diminish:    (n?: number) => T
  /** Replace pattern with euclidean(hits, steps). Default steps = 16. */
  readonly euclidean:   (hits: number, steps?: number) => T
  /** Rotate pattern n steps. Negative = shift left. */
  readonly shift:       (n: number) => T
  /** Flip 1s and 0s. */
  readonly invert:      () => T
  /** Mute steps where mask = 0. */
  readonly mask:        (pattern: PatternInput) => T
  /** Stutter — repeat last hit n times. n = 0 is a no-op. */
  readonly stutter:     (n: number) => T
  /** Palindrome — pattern + reversed pattern (exclusive center). */
  readonly palindrome:  () => T
  /** Drop hits at probability p (0 = never, 1 = always silence). */
  readonly degrade:     (p: number) => T
  /** Timing jitter in seconds. */
  readonly humanize:    (amt: number) => T
  /** Swing offset on off-beats (0–1). */
  readonly swing:       (amount: number) => T
  /** Apply fn every n cycles. fn receives current pattern. */
  readonly every:       (n: number, fn: (p: number[]) => number[]) => T
  /** Custom pattern transform: `(pattern, ctx) => pattern`. */
  readonly apply:       (fn: (p: number[], ctx: PatternCtx) => number[]) => T
  /** Play pattern n times per cycle. */
  readonly repeat:      (n: number) => T
  /** Hit on specific step indices. `.hits(0, 4, 8)` or `.hits(0, 4, { of: 14 })`. */
  readonly hits:        (...args: (number | { of: number })[]) => T
  /**
   * Set a combined pitch+rhythm pattern directly.
   * String values are note names; `0` = rest. Equivalent to calling `.notes()` for
   * pitch and providing a matching hit pattern.
   *
   * @example
   * ```ts
   * Bass303('A2').cutoff(600).pattern(['A2', 0, 0, 0, 'D3', 0, 0, 0])
   * ```
   */
  readonly pattern:     (pat: (string | number)[]) => T
  /** Per-step fire probability array. Engine applies with seeded PRNG. */
  readonly stepProb:    (probs: number[]) => T
  /** Fit pattern into exactly n bars. */
  readonly stretch:     (bars: number) => T
  /** 0-1 offset through pattern (`.phase(0.5)` starts halfway). */
  readonly phase:       (amount: number) => T
  /** Start playing at bar n. */
  readonly fromBar:     (n: number) => T
  /** Stop playing at bar n. */
  readonly untilBar:    (n: number) => T
  /** Fade in over n bars. */
  readonly fadeIn:      (bars: number) => T
  /** Fade out over n bars. */
  readonly fadeOut:     (bars: number) => T
  // ── Pitch / notes ────────────────────────────────────────────────────────
  /** Set a single pitch, e.g. `'C3'`. */
  readonly note:        (pitch: string) => T
  /** Set a note/chord sequence. `'R'` = rest. */
  readonly notes:       (arr: (string | number)[]) => T
  /** Constrain notes to scale. */
  readonly scale:       (name: string, root: string) => T
  /** Transpose ±n semitones. */
  readonly pitch:       (semitones: number) => T
  /** Shift octave by n (n = 1 → one octave up). */
  readonly octave:      (n: number) => T
  /** Portamento / glide time in seconds. */
  readonly glide:       (time: number) => T
  /** Note duration in seconds. */
  readonly dur:         (time: number) => T
  /** Custom note sequence transform: `(notes, ctx) => notes`. */
  readonly mapNotes:    (fn: (notes: (string | number)[], ctx: PatternCtx) => (string | number)[]) => T
  // ── Timbre ───────────────────────────────────────────────────────────────
  /** Bandpass filter centre frequency in Hz (20–20000). Applies to Snare, Snare909. */
  readonly tone:        (hz: number) => T

  // ── Amplitude ────────────────────────────────────────────────────────────
  /** Output gain 0–2. */
  readonly volume:      (v: number) => T
  /** ADSR attack in seconds. */
  readonly attack:      (s: number) => T
  /** ADSR decay in seconds. */
  readonly decay:       (s: number) => T
  /** ADSR sustain level 0–1. */
  readonly sustain:     (v: number) => T
  /** ADSR release in seconds. */
  readonly release:     (s: number) => T
  /** Duck gain when source part hits. */
  readonly duckWith:    (source: string | ChainablePart, opts?: { amount?: number; attack?: number; release?: number }) => T
  /** EDM pump effect — alias for `.duckWith()`. */
  readonly pumpWith:    (source: string | ChainablePart, release?: number) => T
  /** Rise on trigger — reverse sidechain. */
  readonly swellWith:   (source: string | ChainablePart) => T
  /** Full sidechain control — escape hatch. */
  readonly sidechain:   (source: string | ChainablePart, opts?: Partial<Omit<SidechainDescriptor, 'source'>>) => T
  // ── Tone ─────────────────────────────────────────────────────────────────
  /** Lowpass filter: cutoff freq (Hz) + optional resonance Q. */
  readonly filter:      (freq: number, q?: number) => T
  /** 3-band EQ: low, mid, high in dB. */
  readonly eq:          (low: number, mid: number, high: number) => T
  /** Bit crusher — reduce bit depth (1–32). */
  readonly bit:         (bits: number) => T
  /** Overdrive / saturation warmth (0–1). */
  readonly saturate:    (amt: number) => T
  /** Waveshaper distortion (0–1 drive). */
  readonly distortion:  (amount?: number) => T
  /** Phaser sweep — depth 0–1, rate Hz. */
  readonly phaser:      (depth?: number, rate?: number) => T
  /** Dynamics compressor — threshold dBFS, ratio n:1. */
  readonly compressor:  (threshold?: number, ratio?: number) => T
  /** Hard limiter — ceiling dBFS. */
  readonly limiter:     (ceiling?: number) => T
  /** Noise gate — threshold dBFS, ratio n:1. */
  readonly gate:        (threshold?: number, ratio?: number) => T
  // ── Space ────────────────────────────────────────────────────────────────
  /** Stereo position -1 (left) to 1 (right). */
  readonly pan:         (v: number) => T
  /** Stereo width via StereoWidener (0–1). */
  readonly widen:       (amt: number) => T
  /** Add reverb. `wet` = 0–1. */
  readonly reverb:      (wet: number, opts?: Record<string, unknown>) => T
  /** Add delay. `time` in seconds or note value ('8n'). `feedback` = 0–0.99. */
  readonly delay:       (time: number | string, feedback?: number) => T
  /** Chorus / ensemble detune. `depth` = 0–1. */
  readonly chorus:      (depth?: number) => T
  /** Flanger sweep. `depth` = 0–1. */
  readonly flange:      (depth?: number) => T
  // ── Routing ──────────────────────────────────────────────────────────────
  /** Send to named effect bus at given amount (0–1). */
  readonly send:        (bus: string, amount?: number) => T
  /** Silence this part. */
  readonly mute:        () => T
  /** Solo this part (silence all others). */
  readonly solo:        () => T
  /** Assign to choke group — hits cut each other off. */
  readonly chokeGroup:  (name: string) => T
  /** Layer additional parts under this one. */
  readonly layer:       (...parts: ChainablePart[]) => T
  // ── Modulation (musical names) ────────────────────────────────────────────
  /** LFO on volume — rate Hz, depth 0–1. */
  readonly tremolo:     (rate: number, depth?: number) => T
  /** Sine on pitch (vibrato) — rate Hz, depth Hz. */
  readonly vibrato:     (rate: number, depth?: number) => T
  /** LFO on filter cutoff (wobble / acid / dubstep) — rate Hz. */
  readonly wobble:      (rate: number, depth?: number) => T
  /** LFO on pan (stereo movement). */
  readonly autopan:     (rate: number, depth?: number) => T
  /** Fast LFO on volume (flute flutter, organ tremolo). */
  readonly flutter:     (rate?: number) => T
  /** Slow LFO on volume (pad breathe). */
  readonly breathe:     (rate?: number) => T
  /** OU process on pitch (analog warmth drift). */
  readonly drift:       (amt?: number) => T
  /** Ramp on volume — swell build over n bars. */
  readonly swell:       (bars: number) => T
  /** Power escape hatch — modulate any param with any modulation source. */
  readonly modulate:    (param: string, source: ModulationDescriptor) => T
  // ── Meta ─────────────────────────────────────────────────────────────────
  /** Per-part stochastic seed — overrides song-level seed. */
  readonly seed:        (n: number) => T
  /** Human-readable label for GUI mixer and codePatcher. */
  readonly name:        (label: string) => T
  /**
   * Model variant — changes `instrumentType` to `${baseType}${variant}`.
   * e.g. `Kick().model('808')` → `instrumentType: 'kick808'` (routes to `createKick808`).
   */
  readonly model:       (variant: string) => T
  /**
   * Open variant — converts a closed hi-hat to its open counterpart.
   * e.g. `HiHat().model('808').open()` → `instrumentType: 'hihatopen808'`.
   * Only valid after `.model()` sets a model that has an open variant registered.
   */
  readonly open:        () => T
  // ── Visual chain methods ──────────────────────────────────────────────────
  /**
   * Set all visual override fields at once.
   * Merges with any existing `_visual` — fields not provided are preserved.
   */
  readonly visual:      (override: NonNullable<PartDescriptor['_visual']>) => T
  /** Shorthand: set the track color (CSS hex). Fast to type mid-set. */
  readonly color:       (hex: string) => T
  /** Shorthand: set the inline glyph kind. Fast to type mid-set. */
  readonly glyph:       (kind: string) => T
  /** Shorthand: set the display label. Fast to type mid-set. */
  readonly label:       (text: string) => T
}

// ── ChainablePart — PartDescriptor + all chain methods ───────────────────────

/**
 * Immutable fluent builder for a single instrument part.
 *
 * Every chain method returns a **new** `ChainablePart` — the original is never mutated.
 * The `_` prefixed fields are data from {@link PartDescriptor}; the named methods
 * are fluent sugar that produce new instances via `createPart`.
 *
 * Declared as an interface (not a type alias) so that TypeScript can resolve the
 * self-referential generic `ChainMethods<ChainablePart>` without a circular type error.
 *
 * @example
 * ```ts
 * const kick = Kick().volume(0.9).reverb(0.15).swing(0.1)
 * const bass = Bass303('C2').cutoff(600).resonance(0.8).pattern([1,0,1,0])
 * export default Song({ bpm: 128, tracks: [kick, bass] })
 * ```
 *
 * @see {@link PartDescriptor} — the underlying data shape read by the engine
 * @see {@link createPart}    — factory used internally by all chain methods
 */
export interface ChainablePart extends PartDescriptor, ChainMethods<ChainablePart> {}
