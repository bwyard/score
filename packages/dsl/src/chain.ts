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
  // ── Props — for engine backwards compat during transition ────────────────
  readonly props: Record<string, unknown>
  // ── AudioComponent stubs — satisfied by createPart(), replaced by engine ─
  readonly connect: (destination: BackendNode) => AudioComponent
  readonly disconnect: () => AudioComponent
  readonly dispose: () => void
}

// ── ChainablePart — PartDescriptor + all chain methods ───────────────────────

/**
 * Immutable fluent builder for a single instrument part.
 *
 * Every chain method returns a **new** `ChainablePart` — the original is never mutated.
 * The `_` prefixed fields are data from {@link PartDescriptor}; the named methods
 * are fluent sugar that produce new instances via `createPart`.
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
export type ChainablePart = PartDescriptor & {
  // ── Pattern ──────────────────────────────────────────────────────────────
  /** Speed multiplier. `n > 1` = fast, `n < 1` = slow, `n < 0` = reverse. */
  readonly speed: (n: number) => ChainablePart
  /** Sugar: `speed(1/n)` — play n times slower. */
  readonly slow: (n: number) => ChainablePart
  /** Sugar: `speed(n)` — play n times faster. */
  readonly fast: (n: number) => ChainablePart
  /** Sugar: reverse the pattern. */
  readonly rev: () => ChainablePart
  /** Sugar: half-time feel. */
  readonly halfTime: () => ChainablePart
  /** Sugar: double-time feel. */
  readonly doubleTime: () => ChainablePart
  /** Sugar: triplet feel (3 against 2). */
  readonly tripletTime: () => ChainablePart
  /** Classical term: reverse. Alias for `.rev()`. */
  readonly retrograde: () => ChainablePart
  /** Classical: lengthen by factor n. Sugar for `slow(n)`. */
  readonly augment: (n?: number) => ChainablePart
  /** Classical: shorten by factor n. Sugar for `fast(n)`. */
  readonly diminish: (n?: number) => ChainablePart
  /** Replace pattern with euclidean(hits, steps). Default steps = 16. */
  readonly euclidean: (hits: number, steps?: number) => ChainablePart
  /** Rotate pattern n steps. Negative = shift left. */
  readonly shift: (n: number) => ChainablePart
  /** Flip 1s and 0s. */
  readonly invert: () => ChainablePart
  /** Mute steps where mask = 0. */
  readonly mask: (pattern: PatternInput) => ChainablePart
  /** Stutter — repeat last hit n times. n = 0 is a no-op. */
  readonly stutter: (n: number) => ChainablePart
  /** Palindrome — pattern + reversed pattern (exclusive center). */
  readonly palindrome: () => ChainablePart
  /** Drop hits at probability p (0 = never, 1 = always silence). */
  readonly degrade: (p: number) => ChainablePart
  /** Timing jitter in seconds. */
  readonly humanize: (amt: number) => ChainablePart
  /** Swing offset on off-beats (0–1). */
  readonly swing: (amount: number) => ChainablePart
  /** Apply fn every n cycles. fn receives current pattern. */
  readonly every: (n: number, fn: (p: number[]) => number[]) => ChainablePart
  /** Custom pattern transform: `(pattern, ctx) => pattern`. */
  readonly apply: (fn: (p: number[], ctx: PatternCtx) => number[]) => ChainablePart
  /** Play pattern n times per cycle. */
  readonly repeat: (n: number) => ChainablePart
  /** Hit on specific step indices. `.hits(0, 4, 8)` or `.hits(0, 4, { of: 14 })`. */
  readonly hits: (...args: (number | { of: number })[]) => ChainablePart
  /** Per-step fire probability array. Engine applies with seeded PRNG. */
  readonly stepProb: (probs: number[]) => ChainablePart
  /** Fit pattern into exactly n bars. */
  readonly stretch: (bars: number) => ChainablePart
  /** 0-1 offset through pattern (`.phase(0.5)` starts halfway). */
  readonly phase: (amount: number) => ChainablePart
  /** Start playing at bar n. */
  readonly fromBar: (n: number) => ChainablePart
  /** Stop playing at bar n. */
  readonly untilBar: (n: number) => ChainablePart
  /** Fade in over n bars. */
  readonly fadeIn: (bars: number) => ChainablePart
  /** Fade out over n bars. */
  readonly fadeOut: (bars: number) => ChainablePart
  // ── Pitch / notes ────────────────────────────────────────────────────────
  /** Set a single pitch, e.g. `'C3'`. */
  readonly note: (pitch: string) => ChainablePart
  /** Set a note/chord sequence. `'R'` = rest. */
  readonly notes: (arr: (string | number)[]) => ChainablePart
  /** Constrain notes to scale. */
  readonly scale: (name: string, root: string) => ChainablePart
  /** Transpose ±n semitones. */
  readonly pitch: (semitones: number) => ChainablePart
  /** Shift octave by n (n = 1 → one octave up). */
  readonly octave: (n: number) => ChainablePart
  /** Portamento / glide time in seconds. */
  readonly glide: (time: number) => ChainablePart
  /** Note duration in seconds. */
  readonly dur: (time: number) => ChainablePart
  /** Custom note sequence transform: `(notes, ctx) => notes`. */
  readonly mapNotes: (fn: (notes: (string | number)[], ctx: PatternCtx) => (string | number)[]) => ChainablePart
  // ── Amplitude ────────────────────────────────────────────────────────────
  /** Output gain 0–1. */
  readonly volume: (v: number) => ChainablePart
  /** ADSR attack in seconds. */
  readonly attack: (s: number) => ChainablePart
  /** ADSR decay in seconds. */
  readonly decay: (s: number) => ChainablePart
  /** ADSR sustain level 0–1. */
  readonly sustain: (v: number) => ChainablePart
  /** ADSR release in seconds. */
  readonly release: (s: number) => ChainablePart
  /** Duck gain when source part hits. */
  readonly duckWith: (source: string | ChainablePart, opts?: { amount?: number; attack?: number; release?: number }) => ChainablePart
  /** EDM pump effect — alias for `.duckWith()`. */
  readonly pumpWith: (source: string | ChainablePart, release?: number) => ChainablePart
  /** Rise on trigger — reverse sidechain. */
  readonly swellWith: (source: string | ChainablePart) => ChainablePart
  /** Full sidechain control — escape hatch. */
  readonly sidechain: (source: string | ChainablePart, opts?: Partial<Omit<SidechainDescriptor, 'source'>>) => ChainablePart
  // ── Tone ─────────────────────────────────────────────────────────────────
  /** Lowpass filter: cutoff freq (Hz) + optional resonance Q. */
  readonly filter: (freq: number, q?: number) => ChainablePart
  /** 3-band EQ: low, mid, high in dB. */
  readonly eq: (low: number, mid: number, high: number) => ChainablePart
  /** Bit crusher — reduce bit depth (4–16). */
  readonly bit: (bits: number) => ChainablePart
  /** Overdrive / saturation warmth (0–1). */
  readonly saturate: (amt: number) => ChainablePart
  // ── Space ────────────────────────────────────────────────────────────────
  /** Stereo position -1 (left) to 1 (right). */
  readonly pan: (v: number) => ChainablePart
  /** Stereo width via StereoWidener (0–2, 1 = unity). */
  readonly widen: (amt: number) => ChainablePart
  /** Add reverb. `wet` = 0–1. */
  readonly reverb: (wet: number, opts?: Record<string, unknown>) => ChainablePart
  /** Add delay. `time` in seconds or note value ('1/8d'). `feedback` = 0–1. */
  readonly delay: (time: number | string, feedback?: number) => ChainablePart
  /** Chorus / ensemble detune. `depth` = 0–1. */
  readonly chorus: (depth?: number) => ChainablePart
  /** Flanger sweep. `depth` = 0–1. */
  readonly flange: (depth?: number) => ChainablePart
  // ── Routing ──────────────────────────────────────────────────────────────
  /** Send to named effect bus at given amount (0–1). */
  readonly send: (bus: string, amount?: number) => ChainablePart
  /** Silence this part. */
  readonly mute: () => ChainablePart
  /** Solo this part (silence all others). */
  readonly solo: () => ChainablePart
  /** Assign to choke group — hits cut each other off. */
  readonly chokeGroup: (name: string) => ChainablePart
  /** Layer additional parts under this one. */
  readonly layer: (...parts: ChainablePart[]) => ChainablePart
  // ── Modulation (musical names) ────────────────────────────────────────────
  /** LFO on volume — rate Hz, depth 0–1. */
  readonly tremolo: (rate: number, depth?: number) => ChainablePart
  /** Sine on pitch (vibrato) — rate Hz, depth Hz. */
  readonly vibrato: (rate: number, depth?: number) => ChainablePart
  /** LFO on filter cutoff (wobble / acid / dubstep) — rate Hz. */
  readonly wobble: (rate: number, depth?: number) => ChainablePart
  /** LFO on pan (stereo movement). */
  readonly autopan: (rate: number, depth?: number) => ChainablePart
  /** Fast LFO on volume (flute flutter, organ tremolo). */
  readonly flutter: (rate?: number) => ChainablePart
  /** Slow LFO on volume (pad breathe). */
  readonly breathe: (rate?: number) => ChainablePart
  /** OU process on pitch (analog warmth drift). */
  readonly drift: (amt?: number) => ChainablePart
  /** Ramp on volume — swell build over n bars. */
  readonly swell: (bars: number) => ChainablePart
  /** Power escape hatch — modulate any param with any modulation source. */
  readonly modulate: (param: string, source: ModulationDescriptor) => ChainablePart
  // ── Meta ─────────────────────────────────────────────────────────────────
  /** Per-part stochastic seed — overrides song-level seed. */
  readonly seed: (n: number) => ChainablePart
  /** Human-readable label for GUI mixer and codePatcher. */
  readonly name: (label: string) => ChainablePart
  /** Model variant (percussion only): '808' | '909' | 'hard'. */
  readonly model: (variant: string) => ChainablePart
}

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
 */
export const createPart = (init: Partial<PartDescriptor> & { readonly instrumentType: string }): ChainablePart => {
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

  const part: ChainablePart = {
    ...desc,
    connect: (_dest: BackendNode) => part,
    disconnect: () => part,
    dispose: () => undefined,

    // ── Pattern ────────────────────────────────────────────────────────────
    speed: (n) => {
      if (n === 0) throw ScoreError('.speed(0) is not valid — use .mute() to silence', { received: n, fix: 'Use a non-zero speed value', docs: '' })
      const base = desc._pattern ?? DEFAULT_PATTERN
      if (n < 0) return createPart({ ...desc, _speed: n, _pattern: rev(fast(Math.abs(n), base)) })
      if (n === 1) return createPart({ ...desc, _speed: n })
      return createPart({ ...desc, _speed: n, _pattern: n > 1 ? fast(n, base) : slow(1 / n, base) })
    },
    slow: (n) => createPart({ ...desc, _speed: 1 / n, _pattern: slow(n, desc._pattern ?? DEFAULT_PATTERN) }),
    fast: (n) => createPart({ ...desc, _speed: n, _pattern: fast(n, desc._pattern ?? DEFAULT_PATTERN) }),
    rev: () => createPart({ ...desc, _speed: -1, _pattern: rev(desc._pattern ?? DEFAULT_PATTERN) }),
    halfTime: () => createPart({ ...desc, _speed: 0.5, _pattern: slow(2, desc._pattern ?? DEFAULT_PATTERN) }),
    doubleTime: () => createPart({ ...desc, _speed: 2, _pattern: fast(2, desc._pattern ?? DEFAULT_PATTERN) }),
    tripletTime: () => createPart({ ...desc, _speed: 2 / 3, _pattern: fast(2 / 3, desc._pattern ?? DEFAULT_PATTERN) }),
    retrograde: () => createPart({ ...desc, _speed: -1, _pattern: rev(desc._pattern ?? DEFAULT_PATTERN) }),
    augment: (n = 2) => createPart({ ...desc, _speed: 1 / n, _pattern: slow(n, desc._pattern ?? DEFAULT_PATTERN) }),
    diminish: (n = 2) => createPart({ ...desc, _speed: n, _pattern: fast(n, desc._pattern ?? DEFAULT_PATTERN) }),
    euclidean: (hits, steps = 16) => createPart({ ...desc, _pattern: euclidean(hits, steps) }),
    shift: (n) => createPart({ ...desc, _pattern: shift(n, desc._pattern ?? DEFAULT_PATTERN) }),
    invert: () => {
      const base = desc._pattern
      if (Array.isArray(base)) {
        return createPart({ ...desc, _pattern: (base as number[]).map((v) => (v ? 0 : 1)) })
      }
      return createPart({ ...desc }) // non-array pattern: no-op
    },
    mask: (pattern) => createPart({ ...desc, _mask: pattern }),
    stutter: (n) => {
      if (n < 0) throw ScoreError('.stutter(n) requires n >= 0', { received: n, fix: 'Use a non-negative stutter count', docs: '' })
      if (n === 0) return createPart({ ...desc })
      return createPart({ ...desc, _stutter: n })
    },
    palindrome: () => {
      const base = desc._pattern
      if (Array.isArray(base)) {
        const arr = base as number[]
        return createPart({ ...desc, _palindrome: true, _pattern: [...arr, ...[...arr].reverse().slice(1)] })
      }
      return createPart({ ...desc, _palindrome: true })
    },
    degrade: (p) => {
      if (p < 0) throw ScoreError('.degrade(p) requires p >= 0', { received: p, fix: 'Use 0 (keep all) to 1 (silence all)', docs: '' })
      return createPart({ ...desc, _degrade: p })
    },
    humanize: (amt) => createPart({ ...desc, _humanize: amt }),
    swing: (amount) => createPart({ ...desc, _swing: amount }),
    every: (n, fn) => createPart({ ...desc, _every: { n, fn } }),
    apply: (fn) => createPart({ ...desc, _applyFn: fn }),
    repeat: (n) => {
      if (n <= 0) throw ScoreError('.repeat(n) requires n > 0', { received: n, fix: 'Use a positive repeat count', docs: '' })
      return createPart({ ...desc, _repeat: n })
    },
    hits: (...args) => {
      const opts = args.find((a): a is { of: number } => typeof a === 'object' && 'of' in (a as object))
      const steps = args.filter((a): a is number => typeof a === 'number')
      const total = opts?.of ?? 16
      return createPart({ ...desc, _pattern: Array.from({ length: total }, (_, i) => steps.includes(i) ? 1 : 0) })
    },
    stepProb: (probs) => createPart({ ...desc, _stepProb: probs }),
    stretch: (bars) => createPart({ ...desc, _stretch: bars }),
    phase: (amount) => createPart({ ...desc, _phase: amount }),
    fromBar: (n) => createPart({ ...desc, _fromBar: n }),
    untilBar: (n) => createPart({ ...desc, _untilBar: n }),
    fadeIn: (bars) => createPart({ ...desc, _fadeInBars: bars }),
    fadeOut: (bars) => createPart({ ...desc, _fadeOutBars: bars }),

    // ── Pitch / notes ──────────────────────────────────────────────────────
    note: (pitch) => createPart({ ...desc, _notes: [pitch] }),
    notes: (arr) => createPart({ ...desc, _notes: arr }),
    scale: (name, root) => createPart({ ...desc, _scale: { name, root } }),
    pitch: (semitones) => createPart({ ...desc, _pitchOffset: semitones }),
    octave: (n) => createPart({ ...desc, _octave: n }),
    glide: (time) => createPart({ ...desc, _glide: time }),
    dur: (time) => createPart({ ...desc, _dur: time }),
    mapNotes: (fn) => createPart({ ...desc, _mapNotesFn: fn }),

    // ── Amplitude ──────────────────────────────────────────────────────────
    volume: (v) => createPart({ ...desc, _volume: v }),
    attack: (s) => createPart({ ...desc, _adsr: { ...desc._adsr, attack: s } }),
    decay: (s) => createPart({ ...desc, _adsr: { ...desc._adsr, decay: s } }),
    sustain: (v) => createPart({ ...desc, _adsr: { ...desc._adsr, sustain: v } }),
    release: (s) => createPart({ ...desc, _adsr: { ...desc._adsr, release: s } }),
    duckWith: (source, opts) => createPart({ ...desc, _sidechain: {
      source,
      amount: opts?.amount ?? 0.8,
      attack: opts?.attack ?? 0.001,
      release: opts?.release ?? 0.3,
      mode: 'duck',
    } }),
    pumpWith: (source, release = 0.3) => createPart({ ...desc, _sidechain: {
      source,
      amount: 0.8,
      attack: 0.001,
      release,
      mode: 'duck',
    } }),
    swellWith: (source) => createPart({ ...desc, _sidechain: {
      source,
      amount: 0.8,
      attack: 0.001,
      release: 0.3,
      mode: 'reverse',
    } }),
    sidechain: (source, opts) => createPart({ ...desc, _sidechain: {
      source,
      amount: opts?.amount ?? 0.8,
      attack: opts?.attack ?? 0.001,
      release: opts?.release ?? 0.3,
      mode: opts?.mode ?? 'duck',
    } }),

    // ── Tone ──────────────────────────────────────────────────────────────
    filter: (freq, q) => createPart({ ...desc, _filter: { frequency: freq, ...(q !== undefined ? { Q: q } : {}) } }),
    eq: (low, mid, high) => createPart({ ...desc, _eq: { lo: low, mid, hi: high } }),
    bit: (bits) => createPart({ ...desc, ...appendFx(desc, makeFx('bitcrusher', { bits })) }),
    saturate: (amt) => createPart({ ...desc, ...appendFx(desc, makeFx('saturation', { drive: amt })) }),

    // ── Space ──────────────────────────────────────────────────────────────
    pan: (v) => createPart({ ...desc, _pan: v }),
    widen: (amt) => createPart({ ...desc, ...appendFx(desc, makeFx('stereo-widener', { width: amt })) }),
    reverb: (wet, opts = {}) => createPart({ ...desc, ...appendFx(desc, makeFx('reverb', { wet, ...opts })) }),
    delay: (time, feedback) => createPart({ ...desc, ...appendFx(desc, makeFx('delay', feedback !== undefined ? { time, feedback } : { time })) }),
    chorus: (depth = 0.5) => createPart({ ...desc, ...appendFx(desc, makeFx('chorus', { depth })) }),
    flange: (depth = 0.5) => createPart({ ...desc, ...appendFx(desc, makeFx('flanger', { depth })) }),

    // ── Routing ────────────────────────────────────────────────────────────
    send: (bus, amount = 1) => createPart({ ...desc, _sends: [...(desc._sends ?? []), { bus, amount }] }),
    mute: () => createPart({ ...desc, _mute: true }),
    solo: () => createPart({ ...desc, _solo: true }),
    chokeGroup: (name) => createPart({ ...desc, _chokeGroup: name }),
    layer: (...parts) => createPart({ ...desc, _layers: [...(desc._layers ?? []), ...(parts as PartDescriptor[])] }),

    // ── Modulation (musical names) ─────────────────────────────────────────
    tremolo: (rate, depth = 0.8) => createPart({ ...desc, ...appendMod(desc, 'volume', lfo(rate, depth)) }),
    vibrato: (rate, depth = 8) => createPart({ ...desc, ...appendMod(desc, 'pitch', sine(rate, depth)) }),
    wobble: (rate, depth = 1) => createPart({ ...desc, ...appendMod(desc, 'filter', lfo(rate, depth)) }),
    autopan: (rate, depth = 0.8) => createPart({ ...desc, ...appendMod(desc, 'pan', lfo(rate, depth)) }),
    flutter: (rate = 12) => createPart({ ...desc, ...appendMod(desc, 'volume', lfo(rate, 0.5)) }),
    breathe: (rate = 0.3) => createPart({ ...desc, ...appendMod(desc, 'volume', lfo(rate, 0.4)) }),
    drift: (amt = 0.3) => createPart({ ...desc, ...appendMod(desc, 'pitch', ou(amt)) }),
    swell: (bars) => createPart({ ...desc, ...appendMod(desc, 'volume', ramp(bars)) }),
    modulate: (param, source) => createPart({ ...desc, ...appendMod(desc, param, source) }),

    // ── Meta ──────────────────────────────────────────────────────────────
    seed: (n) => createPart({ ...desc, _seed: n }),
    name: (label) => createPart({ ...desc, _name: label }),
    model: (variant) => createPart({ ...desc, _model: variant }),
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
export const defineInstrument = <Args extends unknown[]>(
  _typeName: string,
  factory: (...args: Args) => ChainablePart,
): ((...args: Args) => ChainablePart) => factory
