// chain.ts — ChainablePart type + createPart() factory
//
// ChainablePart is a plain immutable object (zero classes, const + arrow functions only).
// Every method returns a NEW ChainablePart via object spread — never mutation.
// This is the authoring layer of Score's two-layer architecture.
//
// Layer 1 (this file): chain/builder — reads as music
// Layer 2 (engine):    pure data descriptors — read at play time
//
// The _ prefix on descriptor fields signals "data field, not chain method" — NOT private.
// All fields are public and accessible directly by song authors.

import type { AudioComponent, EffectDescriptor } from '@score/core'
import type { BackendNode } from '@score/core'
import { uid, ScoreError } from '@score/core'
import { euclidean, fast, slow, rev, shift } from '@score/pattern'
import type { PatternInput } from '@score/pattern'
import { lfo, sine, ou, ramp } from './modulation.js'
import type { ModulationDescriptor } from './modulation.js'

// ── Supporting types ──────────────────────────────────────────────────────────

/** Context passed to `.apply()` and `.mapNotes()` callbacks. Same inputs → same output. */
export type PatternCtx = {
  readonly bar: number
  readonly bpm: number
  readonly steps: number
  readonly seed: number
}

/** A send routing entry — route to a named effect bus at a given amount. */
export type SendDescriptor = {
  readonly bus: string
  readonly amount: number
}

/** Sidechain / ducking configuration. */
export type SidechainDescriptor = {
  readonly source: string | ChainablePart
  readonly amount: number
  readonly attack: number
  readonly release: number
  readonly mode: 'duck' | 'reverse'
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
 * @see {@link createPart} — factory that produces a `ChainablePart` from a partial descriptor
 */
export type PartDescriptor = {
  readonly _type: 'ChainablePart'
  readonly _version: 1
  readonly instrumentType: string
  /** Alias for instrumentType — satisfies AudioComponent.type contract. */
  readonly type: string
  readonly id: string
  /** Human-readable label — GUI mixer name, codePatcher correlation. */
  readonly _name?: string
  /** Per-part stochastic seed. Overrides song-level seed for this part only. */
  readonly _seed?: number
  /** Model variant — percussion only: '808' | '909' | 'hard' | 'generic' etc. */
  readonly _model?: string
  // ── Pattern ──────────────────────────────────────────────────────────────
  readonly _pattern?: PatternInput
  readonly _speed?: number
  readonly _degrade?: number
  readonly _humanize?: number
  readonly _swing?: number
  readonly _stutter?: number
  readonly _palindrome?: boolean
  readonly _mask?: PatternInput
  readonly _repeat?: number
  readonly _stepProb?: ReadonlyArray<number>
  readonly _applyFn?: (p: number[], ctx: PatternCtx) => number[]
  readonly _mapNotesFn?: (notes: (string | number)[], ctx: PatternCtx) => (string | number)[]
  readonly _every?: { readonly n: number; readonly fn: (p: number[]) => number[] }
  readonly _stretch?: number
  readonly _phase?: number
  readonly _fromBar?: number
  readonly _untilBar?: number
  readonly _fadeInBars?: number
  readonly _fadeOutBars?: number
  // ── Pitch / notes ────────────────────────────────────────────────────────
  readonly _notes?: ReadonlyArray<string | number>
  readonly _scale?: { readonly name: string; readonly root: string }
  readonly _pitchOffset?: number
  readonly _octave?: number
  readonly _glide?: number
  readonly _dur?: number
  // ── Amplitude ────────────────────────────────────────────────────────────
  readonly _volume?: number
  readonly _pan?: number
  readonly _adsr?: {
    readonly attack?: number
    readonly decay?: number
    readonly sustain?: number
    readonly release?: number
  }
  readonly _sidechain?: SidechainDescriptor
  // ── Tone ─────────────────────────────────────────────────────────────────
  readonly _filter?: { readonly frequency: number; readonly Q?: number }
  readonly _eq?: { readonly lo: number; readonly mid: number; readonly hi: number }
  // ── Effects chain ────────────────────────────────────────────────────────
  readonly _effects?: ReadonlyArray<EffectDescriptor>
  // ── Routing ──────────────────────────────────────────────────────────────
  readonly _sends?: ReadonlyArray<SendDescriptor>
  readonly _mute?: boolean
  readonly _solo?: boolean
  readonly _chokeGroup?: string
  readonly _layers?: ReadonlyArray<PartDescriptor>
  // ── Modulations ──────────────────────────────────────────────────────────
  readonly _modulations?: ReadonlyArray<{
    readonly param: string
    readonly source: ModulationDescriptor
  }>
  // ── Visual — per-track visual override (no @score/visuals dep — plain object) ──
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
  // ── Props — for engine backwards compat during transition ────────────────
  readonly props: Record<string, unknown>
  // ── AudioComponent stubs — satisfied by createPart(), replaced by engine ─
  readonly connect: (destination: BackendNode) => AudioComponent
  readonly disconnect: () => AudioComponent
  readonly dispose: () => void
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
  readonly speed: (n: number) => T
  /** Sugar: `speed(1/n)` — play n times slower. */
  readonly slow: (n: number) => T
  /** Sugar: `speed(n)` — play n times faster. */
  readonly fast: (n: number) => T
  /** Sugar: reverse the pattern. */
  readonly rev: () => T
  /** Sugar: half-time feel. */
  readonly halfTime: () => T
  /** Sugar: double-time feel. */
  readonly doubleTime: () => T
  /** Sugar: triplet feel (3 against 2). */
  readonly tripletTime: () => T
  /** Classical term: reverse. Alias for `.rev()`. */
  readonly retrograde: () => T
  /** Classical: lengthen by factor n. Sugar for `slow(n)`. */
  readonly augment: (n?: number) => T
  /** Classical: shorten by factor n. Sugar for `fast(n)`. */
  readonly diminish: (n?: number) => T
  /** Replace pattern with euclidean(hits, steps). Default steps = 16. */
  readonly euclidean: (hits: number, steps?: number) => T
  /** Rotate pattern n steps. Negative = shift left. */
  readonly shift: (n: number) => T
  /** Flip 1s and 0s. */
  readonly invert: () => T
  /** Mute steps where mask = 0. */
  readonly mask: (pattern: PatternInput) => T
  /** Stutter — repeat last hit n times. n = 0 is a no-op. */
  readonly stutter: (n: number) => T
  /** Palindrome — pattern + reversed pattern (exclusive center). */
  readonly palindrome: () => T
  /** Drop hits at probability p (0 = never, 1 = always silence). */
  readonly degrade: (p: number) => T
  /** Timing jitter in seconds. */
  readonly humanize: (amt: number) => T
  /** Swing offset on off-beats (0–1). */
  readonly swing: (amount: number) => T
  /** Apply fn every n cycles. fn receives current pattern. */
  readonly every: (n: number, fn: (p: number[]) => number[]) => T
  /** Custom pattern transform: `(pattern, ctx) => pattern`. */
  readonly apply: (fn: (p: number[], ctx: PatternCtx) => number[]) => T
  /** Play pattern n times per cycle. */
  readonly repeat: (n: number) => T
  /** Hit on specific step indices. `.hits(0, 4, 8)` or `.hits(0, 4, { of: 14 })`. */
  readonly hits: (...args: (number | { of: number })[]) => T
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
  readonly pattern: (pat: (string | number)[]) => T
  /** Per-step fire probability array. Engine applies with seeded PRNG. */
  readonly stepProb: (probs: number[]) => T
  /** Fit pattern into exactly n bars. */
  readonly stretch: (bars: number) => T
  /** 0-1 offset through pattern (`.phase(0.5)` starts halfway). */
  readonly phase: (amount: number) => T
  /** Start playing at bar n. */
  readonly fromBar: (n: number) => T
  /** Stop playing at bar n. */
  readonly untilBar: (n: number) => T
  /** Fade in over n bars. */
  readonly fadeIn: (bars: number) => T
  /** Fade out over n bars. */
  readonly fadeOut: (bars: number) => T
  // ── Pitch / notes ────────────────────────────────────────────────────────
  /** Set a single pitch, e.g. `'C3'`. */
  readonly note: (pitch: string) => T
  /** Set a note/chord sequence. `'R'` = rest. */
  readonly notes: (arr: (string | number)[]) => T
  /** Constrain notes to scale. */
  readonly scale: (name: string, root: string) => T
  /** Transpose ±n semitones. */
  readonly pitch: (semitones: number) => T
  /** Shift octave by n (n = 1 → one octave up). */
  readonly octave: (n: number) => T
  /** Portamento / glide time in seconds. */
  readonly glide: (time: number) => T
  /** Note duration in seconds. */
  readonly dur: (time: number) => T
  /** Custom note sequence transform: `(notes, ctx) => notes`. */
  readonly mapNotes: (fn: (notes: (string | number)[], ctx: PatternCtx) => (string | number)[]) => T
  // ── Amplitude ────────────────────────────────────────────────────────────
  /** Output gain 0–1. */
  readonly volume: (v: number) => T
  /** ADSR attack in seconds. */
  readonly attack: (s: number) => T
  /** ADSR decay in seconds. */
  readonly decay: (s: number) => T
  /** ADSR sustain level 0–1. */
  readonly sustain: (v: number) => T
  /** ADSR release in seconds. */
  readonly release: (s: number) => T
  /** Duck gain when source part hits. */
  readonly duckWith: (source: string | ChainablePart, opts?: { amount?: number; attack?: number; release?: number }) => T
  /** EDM pump effect — alias for `.duckWith()`. */
  readonly pumpWith: (source: string | ChainablePart, release?: number) => T
  /** Rise on trigger — reverse sidechain. */
  readonly swellWith: (source: string | ChainablePart) => T
  /** Full sidechain control — escape hatch. */
  readonly sidechain: (source: string | ChainablePart, opts?: Partial<Omit<SidechainDescriptor, 'source'>>) => T
  // ── Tone ─────────────────────────────────────────────────────────────────
  /** Lowpass filter: cutoff freq (Hz) + optional resonance Q. */
  readonly filter: (freq: number, q?: number) => T
  /** 3-band EQ: low, mid, high in dB. */
  readonly eq: (low: number, mid: number, high: number) => T
  /** Bit crusher — reduce bit depth (4–16). */
  readonly bit: (bits: number) => T
  /** Overdrive / saturation warmth (0–1). */
  readonly saturate: (amt: number) => T
  // ── Space ────────────────────────────────────────────────────────────────
  /** Stereo position -1 (left) to 1 (right). */
  readonly pan: (v: number) => T
  /** Stereo width via StereoWidener (0–2, 1 = unity). */
  readonly widen: (amt: number) => T
  /** Add reverb. `wet` = 0–1. */
  readonly reverb: (wet: number, opts?: Record<string, unknown>) => T
  /** Add delay. `time` in seconds or note value ('1/8d'). `feedback` = 0–1. */
  readonly delay: (time: number | string, feedback?: number) => T
  /** Chorus / ensemble detune. `depth` = 0–1. */
  readonly chorus: (depth?: number) => T
  /** Flanger sweep. `depth` = 0–1. */
  readonly flange: (depth?: number) => T
  // ── Routing ──────────────────────────────────────────────────────────────
  /** Send to named effect bus at given amount (0–1). */
  readonly send: (bus: string, amount?: number) => T
  /** Silence this part. */
  readonly mute: () => T
  /** Solo this part (silence all others). */
  readonly solo: () => T
  /** Assign to choke group — hits cut each other off. */
  readonly chokeGroup: (name: string) => T
  /** Layer additional parts under this one. */
  readonly layer: (...parts: ChainablePart[]) => T
  // ── Modulation (musical names) ────────────────────────────────────────────
  /** LFO on volume — rate Hz, depth 0–1. */
  readonly tremolo: (rate: number, depth?: number) => T
  /** Sine on pitch (vibrato) — rate Hz, depth Hz. */
  readonly vibrato: (rate: number, depth?: number) => T
  /** LFO on filter cutoff (wobble / acid / dubstep) — rate Hz. */
  readonly wobble: (rate: number, depth?: number) => T
  /** LFO on pan (stereo movement). */
  readonly autopan: (rate: number, depth?: number) => T
  /** Fast LFO on volume (flute flutter, organ tremolo). */
  readonly flutter: (rate?: number) => T
  /** Slow LFO on volume (pad breathe). */
  readonly breathe: (rate?: number) => T
  /** OU process on pitch (analog warmth drift). */
  readonly drift: (amt?: number) => T
  /** Ramp on volume — swell build over n bars. */
  readonly swell: (bars: number) => T
  /** Power escape hatch — modulate any param with any modulation source. */
  readonly modulate: (param: string, source: ModulationDescriptor) => T
  // ── Meta ─────────────────────────────────────────────────────────────────
  /** Per-part stochastic seed — overrides song-level seed. */
  readonly seed: (n: number) => T
  /** Human-readable label for GUI mixer and codePatcher. */
  readonly name: (label: string) => T
  /** Model variant (percussion only): '808' | '909' | 'hard'. */
  readonly model: (variant: string) => T
  // ── Visual chain methods ──────────────────────────────────────────────────
  /**
   * Set all visual override fields at once.
   * Merges with any existing `_visual` — fields not provided are preserved.
   */
  readonly visual: (override: NonNullable<PartDescriptor['_visual']>) => T
  /** Shorthand: set the track color (CSS hex). Fast to type mid-set. */
  readonly color:  (hex: string) => T
  /** Shorthand: set the inline glyph kind. Fast to type mid-set. */
  readonly glyph:  (kind: string) => T
  /** Shorthand: set the display label. Fast to type mid-set. */
  readonly label:  (text: string) => T
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
 * @see {@link createPart} — factory used internally by all chain methods
 */
 
export interface ChainablePart extends PartDescriptor, ChainMethods<ChainablePart> {}

// ── Internal helpers ──────────────────────────────────────────────────────────

const DEFAULT_PATTERN: PatternInput = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]

const makeFx = (effectType: string, props: Record<string, unknown>): EffectDescriptor => ({
  _type: 'EffectDescriptor',
  effectType,
  props,
})

const appendFx = (desc: PartDescriptor, effect: EffectDescriptor): Partial<PartDescriptor> => ({
  _effects: [...(desc._effects ?? []), effect],
})

const appendMod = (desc: PartDescriptor, param: string, source: ModulationDescriptor): Partial<PartDescriptor> => ({
  _modulations: [...(desc._modulations ?? []), { param, source }],
})

// ── createPart ────────────────────────────────────────────────────────────────

/**
 * Create a `ChainablePart` from an initial descriptor.
 *
 * Only `instrumentType` is required. The engine fills in all missing fields with defaults.
 * Every chain method returns `createPart()` with a new spread descriptor — never mutation.
 *
 * Song authors can call `createPart()` directly to build custom instruments or compose parts
 * with plain functions. The chain is sugar; the descriptor is always accessible.
 *
 * @param init - Descriptor object. Only `instrumentType` is required.
 * @returns A `ChainablePart` with all chain methods attached.
 *
 * @example
 * ```ts
 * // Custom instrument — works identically to built-ins
 * const myKick = createPart({ instrumentType: 'my-synth' })
 * myKick.volume(0.8).reverb(0.1)
 *
 * // Descriptor fields are directly accessible
 * const kick = Kick(4).volume(0.9)
 * kick._volume  // → 0.9
 * kick._pattern // → euclidean(4, 16) result
 * ```
 *
 * @see {@link defineInstrument} — define a reusable custom instrument factory
 * @see {@link extendPart} — add custom chain methods that survive through all chain calls
 */
export const createPart = (
  init: Partial<PartDescriptor> & { readonly instrumentType: string },
  // Sub-type makers (makeBass303, makeFMSynth, makeSubSynth) and extendPart() pass themselves
  // here so their extra methods survive any base chain call. Default: identity.
  buildExtensions: (p: ChainablePart) => ChainablePart = (p) => p,
): ChainablePart => {
  const desc: PartDescriptor = {
    _type: 'ChainablePart',
    _version: 1,
    id: init.id ?? uid(init.instrumentType),
    type: init.instrumentType,
    props: init.props ?? {},
    ...init,
    // Stubs are always re-bound to `part` via closure below
    connect: undefined as unknown as PartDescriptor['connect'],
    disconnect: undefined as unknown as PartDescriptor['disconnect'],
    dispose: undefined as unknown as PartDescriptor['dispose'],
  }

  // Shorthand: build a new part from updated descriptor and re-apply buildExtensions.
  const cp = (next: Partial<PartDescriptor> & { readonly instrumentType: string }): ChainablePart =>
    buildExtensions(createPart(next, buildExtensions))

  const part: ChainablePart = {
    ...desc,
    connect: (_dest: BackendNode) => part,
    disconnect: () => part,
    dispose: () => undefined,

    // ── Pattern ────────────────────────────────────────────────────────────
    speed: (n) => {
      if (n === 0) throw ScoreError('.speed(0) is not valid — use .mute() to silence', { received: n, fix: 'Use a non-zero speed value', docs: '' })
      const base = desc._pattern ?? DEFAULT_PATTERN
      if (n < 0) return cp({ ...desc, _speed: n, _pattern: rev(fast(Math.abs(n), base)) })
      if (n === 1) return cp({ ...desc, _speed: n })
      return cp({ ...desc, _speed: n, _pattern: n > 1 ? fast(n, base) : slow(1 / n, base) })
    },
    slow: (n) => cp({ ...desc, _speed: 1 / n, _pattern: slow(n, desc._pattern ?? DEFAULT_PATTERN) }),
    fast: (n) => cp({ ...desc, _speed: n, _pattern: fast(n, desc._pattern ?? DEFAULT_PATTERN) }),
    rev: () => cp({ ...desc, _speed: -1, _pattern: rev(desc._pattern ?? DEFAULT_PATTERN) }),
    halfTime: () => cp({ ...desc, _speed: 0.5, _pattern: slow(2, desc._pattern ?? DEFAULT_PATTERN) }),
    doubleTime: () => cp({ ...desc, _speed: 2, _pattern: fast(2, desc._pattern ?? DEFAULT_PATTERN) }),
    tripletTime: () => cp({ ...desc, _speed: 2 / 3, _pattern: fast(2 / 3, desc._pattern ?? DEFAULT_PATTERN) }),
    retrograde: () => cp({ ...desc, _speed: -1, _pattern: rev(desc._pattern ?? DEFAULT_PATTERN) }),
    augment: (n = 2) => cp({ ...desc, _speed: 1 / n, _pattern: slow(n, desc._pattern ?? DEFAULT_PATTERN) }),
    diminish: (n = 2) => cp({ ...desc, _speed: n, _pattern: fast(n, desc._pattern ?? DEFAULT_PATTERN) }),
    euclidean: (hits, steps = 16) => cp({ ...desc, _pattern: euclidean(hits, steps) }),
    shift: (n) => cp({ ...desc, _pattern: shift(n, desc._pattern ?? DEFAULT_PATTERN) }),
    invert: () => {
      const base = desc._pattern
      if (Array.isArray(base)) {
        return cp({ ...desc, _pattern: (base as number[]).map((v) => (v ? 0 : 1)) })
      }
      return cp({ ...desc }) // non-array pattern: no-op
    },
    mask: (pattern) => cp({ ...desc, _mask: pattern }),
    stutter: (n) => {
      if (n < 0) throw ScoreError('.stutter(n) requires n >= 0', { received: n, fix: 'Use a non-negative stutter count', docs: '' })
      if (n === 0) return cp({ ...desc })
      return cp({ ...desc, _stutter: n })
    },
    palindrome: () => {
      const base = desc._pattern
      if (Array.isArray(base)) {
        const arr = base as number[]
        return cp({ ...desc, _palindrome: true, _pattern: [...arr, ...[...arr].reverse().slice(1)] })
      }
      return cp({ ...desc, _palindrome: true })
    },
    degrade: (p) => {
      if (p < 0) throw ScoreError('.degrade(p) requires p >= 0', { received: p, fix: 'Use 0 (keep all) to 1 (silence all)', docs: '' })
      return cp({ ...desc, _degrade: p })
    },
    humanize: (amt) => cp({ ...desc, _humanize: amt }),
    swing: (amount) => cp({ ...desc, _swing: amount }),
    every: (n, fn) => cp({ ...desc, _every: { n, fn } }),
    apply: (fn) => cp({ ...desc, _applyFn: fn }),
    repeat: (n) => {
      if (n <= 0) throw ScoreError('.repeat(n) requires n > 0', { received: n, fix: 'Use a positive repeat count', docs: '' })
      return cp({ ...desc, _repeat: n })
    },
    hits: (...args) => {
      const opts = args.find((a): a is { of: number } => typeof a === 'object' && 'of' in (a as object))
      const steps = args.filter((a): a is number => typeof a === 'number')
      const total = opts?.of ?? 16
      return cp({ ...desc, _pattern: Array.from({ length: total }, (_, i) => steps.includes(i) ? 1 : 0) })
    },
    pattern: (pat) => {
      // Split combined pitch+rhythm pattern: strings/non-zero numbers are notes, 0 = rest.
      const notePat = pat.map((v) => (v === 0 ? 0 : 1))
      const noteSeq = pat.filter((v): v is string | number => v !== 0)
      return cp({ ...desc, _pattern: notePat, _notes: noteSeq })
    },
    stepProb: (probs) => cp({ ...desc, _stepProb: probs }),
    stretch: (bars) => cp({ ...desc, _stretch: bars }),
    phase: (amount) => cp({ ...desc, _phase: amount }),
    fromBar: (n) => cp({ ...desc, _fromBar: n }),
    untilBar: (n) => cp({ ...desc, _untilBar: n }),
    fadeIn: (bars) => cp({ ...desc, _fadeInBars: bars }),
    fadeOut: (bars) => cp({ ...desc, _fadeOutBars: bars }),

    // ── Pitch / notes ──────────────────────────────────────────────────────
    note: (pitch) => cp({ ...desc, _notes: [pitch] }),
    notes: (arr) => cp({ ...desc, _notes: arr }),
    scale: (name, root) => cp({ ...desc, _scale: { name, root } }),
    pitch: (semitones) => cp({ ...desc, _pitchOffset: semitones }),
    octave: (n) => cp({ ...desc, _octave: n }),
    glide: (time) => cp({ ...desc, _glide: time }),
    dur: (time) => cp({ ...desc, _dur: time }),
    mapNotes: (fn) => cp({ ...desc, _mapNotesFn: fn }),

    // ── Amplitude ──────────────────────────────────────────────────────────
    volume: (v) => cp({ ...desc, _volume: v }),
    attack: (s) => cp({ ...desc, _adsr: { ...desc._adsr, attack: s } }),
    decay: (s) => cp({ ...desc, _adsr: { ...desc._adsr, decay: s } }),
    sustain: (v) => cp({ ...desc, _adsr: { ...desc._adsr, sustain: v } }),
    release: (s) => cp({ ...desc, _adsr: { ...desc._adsr, release: s } }),
    duckWith: (source, opts) => cp({ ...desc, _sidechain: {
      source,
      amount: opts?.amount ?? 0.8,
      attack: opts?.attack ?? 0.001,
      release: opts?.release ?? 0.3,
      mode: 'duck',
    } }),
    pumpWith: (source, release = 0.3) => cp({ ...desc, _sidechain: {
      source,
      amount: 0.8,
      attack: 0.001,
      release,
      mode: 'duck',
    } }),
    swellWith: (source) => cp({ ...desc, _sidechain: {
      source,
      amount: 0.8,
      attack: 0.001,
      release: 0.3,
      mode: 'reverse',
    } }),
    sidechain: (source, opts) => cp({ ...desc, _sidechain: {
      source,
      amount: opts?.amount ?? 0.8,
      attack: opts?.attack ?? 0.001,
      release: opts?.release ?? 0.3,
      mode: opts?.mode ?? 'duck',
    } }),

    // ── Tone ──────────────────────────────────────────────────────────────
    filter: (freq, q) => cp({ ...desc, _filter: { frequency: freq, ...(q !== undefined ? { Q: q } : {}) } }),
    eq: (low, mid, high) => cp({ ...desc, _eq: { lo: low, mid, hi: high } }),
    bit: (bits) => cp({ ...desc, ...appendFx(desc, makeFx('bitcrusher', { bits })) }),
    saturate: (amt) => cp({ ...desc, ...appendFx(desc, makeFx('saturation', { drive: amt })) }),

    // ── Space ──────────────────────────────────────────────────────────────
    pan: (v) => cp({ ...desc, _pan: v }),
    widen: (amt) => cp({ ...desc, ...appendFx(desc, makeFx('stereo-widener', { width: amt })) }),
    reverb: (wet, opts = {}) => cp({ ...desc, ...appendFx(desc, makeFx('reverb', { wet, ...opts })) }),
    delay: (time, feedback) => cp({ ...desc, ...appendFx(desc, makeFx('delay', feedback !== undefined ? { time, feedback } : { time })) }),
    chorus: (depth = 0.5) => cp({ ...desc, ...appendFx(desc, makeFx('chorus', { depth })) }),
    flange: (depth = 0.5) => cp({ ...desc, ...appendFx(desc, makeFx('flanger', { depth })) }),

    // ── Routing ────────────────────────────────────────────────────────────
    send: (bus, amount = 1) => cp({ ...desc, _sends: [...(desc._sends ?? []), { bus, amount }] }),
    mute: () => cp({ ...desc, _mute: true }),
    solo: () => cp({ ...desc, _solo: true }),
    chokeGroup: (name) => cp({ ...desc, _chokeGroup: name }),
    layer: (...parts) => cp({ ...desc, _layers: [...(desc._layers ?? []), ...(parts as PartDescriptor[])] }),

    // ── Modulation (musical names) ─────────────────────────────────────────
    tremolo: (rate, depth = 0.8) => cp({ ...desc, ...appendMod(desc, 'volume', lfo(rate, depth)) }),
    vibrato: (rate, depth = 8) => cp({ ...desc, ...appendMod(desc, 'pitch', sine(rate, depth)) }),
    wobble: (rate, depth = 1) => cp({ ...desc, ...appendMod(desc, 'filter', lfo(rate, depth)) }),
    autopan: (rate, depth = 0.8) => cp({ ...desc, ...appendMod(desc, 'pan', lfo(rate, depth)) }),
    flutter: (rate = 12) => cp({ ...desc, ...appendMod(desc, 'volume', lfo(rate, 0.5)) }),
    breathe: (rate = 0.3) => cp({ ...desc, ...appendMod(desc, 'volume', lfo(rate, 0.4)) }),
    drift: (amt = 0.3) => cp({ ...desc, ...appendMod(desc, 'pitch', ou(amt)) }),
    swell: (bars) => cp({ ...desc, ...appendMod(desc, 'volume', ramp(bars)) }),
    modulate: (param, source) => cp({ ...desc, ...appendMod(desc, param, source) }),

    // ── Meta ──────────────────────────────────────────────────────────────
    seed: (n) => cp({ ...desc, _seed: n }),
    name: (label) => cp({ ...desc, _name: label }),
    model: (variant) => cp({ ...desc, _model: variant }),

    // ── Visual ────────────────────────────────────────────────────────────
    visual: (override) => cp({ ...desc, _visual: { ...desc._visual, ...override } }),
    color:  (hex)  => cp({ ...desc, _visual: { ...desc._visual, color: hex } }),
    glyph:  (kind) => cp({ ...desc, _visual: { ...desc._visual, glyph: kind } }),
    label:  (text) => cp({ ...desc, _visual: { ...desc._visual, label: text } }),
  }

  return part
}

// ── defineInstrument ──────────────────────────────────────────────────────────

/**
 * Define a reusable custom instrument factory.
 *
 * Returns a factory function whose output is a `ChainablePart` — fully compatible
 * with `Song`, `Group`, and all chain methods. This is the extensibility contract:
 * third-party packages publish custom instruments that work identically to built-ins.
 *
 * @param _typeName - Stable kebab-case instrument type identifier, e.g. `'reese-bass'`.
 * @param factory - Function that creates the initial `ChainablePart`.
 * @returns A factory function producing `ChainablePart`.
 *
 * @example
 * ```ts
 * const ReeseBass = defineInstrument('reese-bass', (pitch?: string) =>
 *   createPart({ instrumentType: 'reese-bass', _notes: pitch ? [pitch] : [] })
 *     .volume(0.7)
 * )
 * Song(128, [ReeseBass('C2').wobble(0.5)])
 * ```
 */
export const defineInstrument = <Args extends unknown[], T extends ChainablePart = ChainablePart>(
  _typeName: string,
  factory: (...args: Args) => T,
): ((...args: Args) => T) => factory

// ── extendPart ────────────────────────────────────────────────────────────────

/**
 * Create a part factory with custom chain methods that survive through all base chain calls.
 *
 * `extendPart` is the public API for the extension pattern used internally by sub-type
 * factories (`SubSynthPart`, `FMSynthPart`, `Bass303Part`). After every base chain method
 * call (`.volume()`, `.reverb()`, etc.) the extensions are re-attached via spread — the
 * custom methods are always present on the result.
 *
 * **Extension contract:**
 * - `buildExtensions` receives the *current* `ChainablePart` and returns plain methods.
 * - Each call to a base chain method produces a new part and re-calls `buildExtensions`.
 * - Extensions compose via spread — no `Object.assign`, no mutation.
 *
 * @param instrumentType - The instrument type identifier (e.g. `'kick'`, `'reese-bass'`)
 * @param buildExtensions - Called with the current part; returns extra methods to spread
 * @returns A no-arg factory function returning `ChainablePart & Ext`
 *
 * @example
 * ```ts
 * // Add convenience aliases to Kick
 * const MyKick = extendPart('kick', (part) => ({
 *   quiet: () => part.volume(0.2),
 *   loud:  () => part.volume(0.95),
 * }))
 *
 * const k = MyKick().quiet().swing(0.1)
 * k.loud   // still present after .swing() ✓
 * ```
 *
 * @see {@link defineInstrument} — define a reusable custom instrument factory
 * @see {@link createPart} — low-level factory used internally
 */
export const extendPart = <Ext extends Record<string, unknown>>(
  instrumentType: string,
  buildExtensions: (part: ChainablePart) => Ext,
): (() => ChainablePart & Ext) => {
  const attachExtensions = (base: ChainablePart): ChainablePart & Ext => ({
    ...base,
    ...buildExtensions(base),
  })
  return () => attachExtensions(createPart({ instrumentType }, attachExtensions))
}
