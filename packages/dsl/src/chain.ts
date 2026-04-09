// =============================================================================
// @score/dsl — createPart() factory + instrument helpers
//
// ChainablePart is a plain immutable object (zero classes, const + arrow functions only).
// Every method returns a NEW ChainablePart via object spread — never mutation.
//
// Layer 1 (this file): chain/builder — reads as music
// Layer 2 (engine):    pure data descriptors — read at play time
//
// The _ prefix on descriptor fields signals "data field, not chain method" — NOT private.
// All fields are public and accessible directly by song authors.
//
// Types live in chain.types.ts. Validators live in validators.ts.
// =============================================================================

import type { EffectDescriptor }                  from '@score/core'
import type { BackendNode }                       from '@score/core'
import { uid }                                    from '@score/core'
import { euclidean, fast, slow, rev, shift }      from '@score/pattern'
import type { PatternInput }                       from '@score/pattern'
import { lfo, sine, ou, ramp }                    from './modulation.js'
import type { ModulationDescriptor }               from './modulation.js'
import {
  validateSpeed,        validateSlow,         validateFast,
  validateEuclidean,    validateShift,        validateStutter,
  validateDegrade,      validateHumanize,     validateSwing,
  validateEvery,        validateRepeat,       validatePattern,
  validateStepProb,     validateStretch,      validatePhase,
  validateBarNumber,    validateFadeBars,
  validateNote,         validateNotes,        validateScale,
  validatePitch,        validateOctave,       validateGlide,
  validateDur,          validateVolume,       validateAdsrTime,  validateTone,
  validateSustain,      validatePan,          validateWiden,
  validateFilter,       validateEq,           validateBit,
  validateSaturate,     validateReverbWet,    validateDelay,
  validateModDepth,     validateLfoRate,      validateSwell,
  validateSend,         validateChokeGroup,   validateModulateParam,
  validateColor,        validateGlyph,        validateLabel,
  validateSeed,         validateModel,
} from './validators.js'

export type {
  PatternCtx,
  SendDescriptor,
  SidechainDescriptor,
  PartDescriptor,
  ChainMethods,
  ChainablePart,
} from './chain.types.js'

import type { PartDescriptor, ChainablePart, ChainMethods } from './chain.types.js'

// ── Simple effect chain methods — data-driven ─────────────────────────────────
//
// Each entry maps a chain method name to its effect type + argument → props transform.
// Adding a new simple effect: one line here + one declaration in chain.types.ts.
// The generated methods are spread into the `part` object inside createPart().

type SimpleFxEntry = {
  readonly effectType: string
  readonly toProps:    (...args: number[]) => Record<string, unknown>
}

const SIMPLE_FX: ReadonlyArray<SimpleFxEntry & { readonly method: string }> = [
  { method: 'distortion', effectType: 'distortion', toProps: (amount = 0.5)            => ({ drive: Math.max(0, Math.min(1, amount)) }) },
  { method: 'phaser',     effectType: 'phaser',     toProps: (depth = 0.5, rate = 1)   => ({ depth: Math.max(0, Math.min(1, depth)), rate: Math.max(0.1, rate) }) },
  { method: 'compressor', effectType: 'compressor', toProps: (threshold = -24, ratio = 4) => ({ threshold, ratio: Math.max(1, ratio) }) },
  { method: 'limiter',    effectType: 'limiter',    toProps: (ceiling = -1)             => ({ ceiling }) },
  { method: 'gate',       effectType: 'gate',       toProps: (threshold = -40, ratio = 10) => ({ threshold, ratio: Math.max(1, ratio) }) },
]

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

const appendMod = (
  desc:   PartDescriptor,
  param:  string,
  source: ModulationDescriptor,
): Partial<PartDescriptor> => ({
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
 * @param init           - Descriptor object. Only `instrumentType` is required.
 * @param buildExtensions - Optional: sub-type re-attachment hook (used by extendPart).
 * @returns A `ChainablePart` with all chain methods attached.
 *
 * @example
 * ```ts
 * const myKick = createPart({ instrumentType: 'my-synth' })
 * myKick.volume(0.8).reverb(0.1)
 *
 * const kick = Kick(4).volume(0.9)
 * kick._volume  // → 0.9
 * kick._pattern // → euclidean(4, 16) result
 * ```
 *
 * @throws ScoreError when any chain method receives an out-of-range or invalid argument.
 *
 * @see {@link defineInstrument} — define a reusable custom instrument factory
 * @see {@link extendPart}       — add custom chain methods that survive through all chain calls
 */
export const createPart = (
  init: Partial<PartDescriptor> & { readonly instrumentType: string },
  // Sub-type makers (makeBass303, makeFMSynth, makeSubSynth) and extendPart() pass themselves
  // here so their extra methods survive any base chain call. Default: identity.
  buildExtensions: (p: ChainablePart) => ChainablePart = (p) => p,
): ChainablePart => {
  const desc: PartDescriptor = {
    _type:    'ChainablePart',
    _version: 1,
    id:       init.id ?? uid(init.instrumentType),
    type:     init.instrumentType,
    props:    init.props ?? {},
    ...init,
    // Stubs are always re-bound to `part` via closure below
    connect:    undefined as unknown as PartDescriptor['connect'],
    disconnect: undefined as unknown as PartDescriptor['disconnect'],
    dispose:    undefined as unknown as PartDescriptor['dispose'],
  }

  // Shorthand: build a new part from updated descriptor and re-apply buildExtensions.
  const cp = (next: Partial<PartDescriptor> & { readonly instrumentType: string }): ChainablePart =>
    buildExtensions(createPart(next, buildExtensions))

  const part: ChainablePart = {
    ...desc,
    connect:    (_dest: BackendNode) => part,
    disconnect: () => part,
    dispose:    () => undefined,

    // ── Pattern ──────────────────────────────────────────────────────────────
    speed: (n) => {
      const validated = validateSpeed(n)
      const base = desc._pattern ?? DEFAULT_PATTERN
      if (validated < 0) return cp({ ...desc, _speed: validated, _pattern: rev(fast(Math.abs(validated), base)) })
      if (validated === 1) return cp({ ...desc, _speed: validated })
      return cp({ ...desc, _speed: validated, _pattern: validated > 1 ? fast(validated, base) : slow(1 / validated, base) })
    },
    slow: (n) => {
      const validated = validateSlow(n)
      return cp({ ...desc, _speed: 1 / validated, _pattern: slow(validated, desc._pattern ?? DEFAULT_PATTERN) })
    },
    fast: (n) => {
      const validated = validateFast(n)
      return cp({ ...desc, _speed: validated, _pattern: fast(validated, desc._pattern ?? DEFAULT_PATTERN) })
    },
    rev:         () => cp({ ...desc, _speed: -1, _pattern: rev(desc._pattern ?? DEFAULT_PATTERN) }),
    halfTime:    () => cp({ ...desc, _speed: 0.5,     _pattern: slow(2,     desc._pattern ?? DEFAULT_PATTERN) }),
    doubleTime:  () => cp({ ...desc, _speed: 2,       _pattern: fast(2,     desc._pattern ?? DEFAULT_PATTERN) }),
    tripletTime: () => cp({ ...desc, _speed: 2 / 3,   _pattern: fast(2 / 3, desc._pattern ?? DEFAULT_PATTERN) }),
    retrograde:  () => cp({ ...desc, _speed: -1,      _pattern: rev(desc._pattern ?? DEFAULT_PATTERN) }),
    augment:     (n = 2) => cp({ ...desc, _speed: 1 / n, _pattern: slow(n, desc._pattern ?? DEFAULT_PATTERN) }),
    diminish:    (n = 2) => cp({ ...desc, _speed: n,     _pattern: fast(n, desc._pattern ?? DEFAULT_PATTERN) }),
    euclidean: (hits, steps = 16) => {
      const validated = validateEuclidean(hits, steps)
      return cp({ ...desc, _pattern: euclidean(validated.hits, validated.steps) })
    },
    shift: (n) => {
      const validated = validateShift(n)
      return cp({ ...desc, _pattern: shift(validated, desc._pattern ?? DEFAULT_PATTERN) })
    },
    invert: () => {
      const base = desc._pattern
      if (Array.isArray(base)) {
        return cp({ ...desc, _pattern: (base as number[]).map((v) => (v ? 0 : 1)) })
      }
      return cp({ ...desc })
    },
    mask:       (pattern) => cp({ ...desc, _mask: pattern }),
    stutter: (n) => {
      const validated = validateStutter(n)
      if (validated === 0) return cp({ ...desc })
      return cp({ ...desc, _stutter: validated })
    },
    palindrome: () => {
      const base = desc._pattern
      if (Array.isArray(base)) {
        const arr = base as number[]
        return cp({ ...desc, _palindrome: true, _pattern: [...arr, ...[...arr].reverse().slice(1)] })
      }
      return cp({ ...desc, _palindrome: true })
    },
    degrade:    (p) => cp({ ...desc, _degrade:   validateDegrade(p) }),
    humanize:   (amt) => cp({ ...desc, _humanize: validateHumanize(amt) }),
    swing:      (amount) => cp({ ...desc, _swing:   validateSwing(amount) }),
    every: (n, fn) => {
      const validated = validateEvery(n)
      return cp({ ...desc, _every: { n: validated, fn } })
    },
    apply:      (fn) => cp({ ...desc, _applyFn: fn }),
    repeat: (n) => {
      const validated = validateRepeat(n)
      return cp({ ...desc, _repeat: validated })
    },
    hits: (...args) => {
      const opts  = args.find((a): a is { of: number } => typeof a === 'object' && 'of' in (a as object))
      const steps = args.filter((a): a is number => typeof a === 'number')
      const total = opts?.of ?? 16
      return cp({ ...desc, _pattern: Array.from({ length: total }, (_, i) => steps.includes(i) ? 1 : 0) })
    },
    pattern: (pat) => {
      const validated = validatePattern(pat)
      const notePat   = validated.map((v) => (v === 0 ? 0 : 1))
      const noteSeq   = validated.filter((v): v is string | number => v !== 0)
      return cp({ ...desc, _pattern: notePat, _notes: noteSeq })
    },
    stepProb:   (probs)  => cp({ ...desc, _stepProb: validateStepProb(probs) }),
    stretch:    (bars)   => cp({ ...desc, _stretch:  validateStretch(bars) }),
    phase:      (amount) => cp({ ...desc, _phase:    validatePhase(amount) }),
    fromBar:    (n)      => cp({ ...desc, _fromBar:  validateBarNumber(n, 'fromBar') }),
    untilBar:   (n)      => cp({ ...desc, _untilBar: validateBarNumber(n, 'untilBar') }),
    fadeIn:     (bars)   => cp({ ...desc, _fadeInBars:  validateFadeBars(bars, 'fadeIn') }),
    fadeOut:    (bars)   => cp({ ...desc, _fadeOutBars: validateFadeBars(bars, 'fadeOut') }),

    // ── Pitch / notes ─────────────────────────────────────────────────────────
    note:       (pitch)      => cp({ ...desc, _notes:       [validateNote(pitch)] }),
    notes:      (arr)        => cp({ ...desc, _notes:       validateNotes(arr) }),
    scale:      (name, root) => cp({ ...desc, _scale:       validateScale(name, root) }),
    pitch:      (semitones)  => cp({ ...desc, _pitchOffset: validatePitch(semitones) }),
    octave:     (n)          => cp({ ...desc, _octave:      validateOctave(n) }),
    glide:      (time)       => cp({ ...desc, _glide:       validateGlide(time) }),
    dur:        (time)       => cp({ ...desc, _dur:         validateDur(time) }),
    mapNotes:   (fn)         => cp({ ...desc, _mapNotesFn:  fn }),

    // ── Timbre ────────────────────────────────────────────────────────────────
    // tone: set the bandpass filter centre frequency (Hz) on instruments that
    // support it (Snare, Snare909). Silently ignored on other instruments.
    tone:    (hz) => cp({ ...desc, _tone: validateTone(hz) }),

    // ── Amplitude ─────────────────────────────────────────────────────────────
    volume:  (v) => cp({ ...desc, _volume: validateVolume(v) }),
    attack:  (s) => cp({ ...desc, _adsr: { ...desc._adsr, attack:  validateAdsrTime(s, 'attack') } }),
    decay:   (s) => cp({ ...desc, _adsr: { ...desc._adsr, decay:   validateAdsrTime(s, 'decay') } }),
    sustain: (v) => cp({ ...desc, _adsr: { ...desc._adsr, sustain: validateSustain(v) } }),
    release: (s) => cp({ ...desc, _adsr: { ...desc._adsr, release: validateAdsrTime(s, 'release') } }),
    duckWith: (source, opts) => cp({ ...desc, _sidechain: {
      source,
      amount:  opts?.amount  ?? 0.8,
      attack:  opts?.attack  ?? 0.001,
      release: opts?.release ?? 0.3,
      mode:    'duck',
    } }),
    pumpWith: (source, release = 0.3) => cp({ ...desc, _sidechain: {
      source,
      amount:  0.8,
      attack:  0.001,
      release,
      mode:    'duck',
    } }),
    swellWith: (source) => cp({ ...desc, _sidechain: {
      source,
      amount:  0.8,
      attack:  0.001,
      release: 0.3,
      mode:    'reverse',
    } }),
    sidechain: (source, opts) => cp({ ...desc, _sidechain: {
      source,
      amount:  opts?.amount  ?? 0.8,
      attack:  opts?.attack  ?? 0.001,
      release: opts?.release ?? 0.3,
      mode:    opts?.mode    ?? 'duck',
    } }),

    // ── Tone ──────────────────────────────────────────────────────────────────
    filter:   (freq, q)          => cp({ ...desc, _filter: validateFilter(freq, q) }),
    eq:       (low, mid, high)   => cp({ ...desc, _eq:     validateEq(low, mid, high) }),
    bit:      (bits)             => cp({ ...desc, ...appendFx(desc, makeFx('bitcrusher',  { bits:  validateBit(bits) })) }),
    saturate: (amt)              => cp({ ...desc, ...appendFx(desc, makeFx('saturation',  { drive: validateSaturate(amt) })) }),

    // ── Space ─────────────────────────────────────────────────────────────────
    pan:    (v)          => cp({ ...desc, _pan: validatePan(v) }),
    widen:  (amt)        => cp({ ...desc, ...appendFx(desc, makeFx('stereo-widener', { width: validateWiden(amt) })) }),
    reverb: (wet, opts = {}) => cp({ ...desc, ...appendFx(desc, makeFx('reverb', { wet: validateReverbWet(wet), ...opts })) }),
    delay:  (time, feedback) => {
      const validated = validateDelay(time, feedback)
      return cp({ ...desc, ...appendFx(desc, makeFx('delay', validated.feedback !== undefined
        ? { time: validated.time, feedback: validated.feedback }
        : { time: validated.time })) })
    },
    chorus: (depth = 0.5) => cp({ ...desc, ...appendFx(desc, makeFx('chorus',  { depth: validateModDepth(depth,  'chorus') })) }),
    flange: (depth = 0.5) => cp({ ...desc, ...appendFx(desc, makeFx('flanger', { depth: validateModDepth(depth,  'flange') })) }),

    // Generated from SIMPLE_FX table — distortion, phaser, compressor, limiter, gate.
    // Type-asserted because TypeScript cannot infer individual signatures from the table.
    ...Object.fromEntries(SIMPLE_FX.map(({ method, effectType, toProps }) => [
      method,
      (...args: number[]) => cp({ ...desc, ...appendFx(desc, makeFx(effectType, toProps(...args))) }),
    ])) as Pick<ChainMethods<ChainablePart>, 'distortion' | 'phaser' | 'compressor' | 'limiter' | 'gate'>,

    // ── Routing ───────────────────────────────────────────────────────────────
    send: (bus, amount = 1) => {
      const validated = validateSend(bus, amount)
      return cp({ ...desc, _sends: [...(desc._sends ?? []), validated] })
    },
    mute:       () => cp({ ...desc, _mute:       true }),
    solo:       () => cp({ ...desc, _solo:       true }),
    chokeGroup: (name)       => cp({ ...desc, _chokeGroup: validateChokeGroup(name) }),
    layer:      (...parts)   => cp({ ...desc, _layers:     [...(desc._layers ?? []), ...(parts as PartDescriptor[])] }),

    // ── Modulation ────────────────────────────────────────────────────────────
    tremolo: (rate, depth = 0.8) => cp({ ...desc, ...appendMod(desc, 'volume', lfo(validateLfoRate(rate, 'tremolo'), validateModDepth(depth, 'tremolo'))) }),
    vibrato: (rate, depth = 8)   => cp({ ...desc, ...appendMod(desc, 'pitch',  sine(validateLfoRate(rate, 'vibrato'), depth)) }),
    wobble:  (rate, depth = 1)   => cp({ ...desc, ...appendMod(desc, 'filter', lfo(validateLfoRate(rate, 'wobble'),  validateModDepth(depth, 'wobble'))) }),
    autopan: (rate, depth = 0.8) => cp({ ...desc, ...appendMod(desc, 'pan',    lfo(validateLfoRate(rate, 'autopan'), validateModDepth(depth, 'autopan'))) }),
    flutter: (rate = 12)         => cp({ ...desc, ...appendMod(desc, 'volume', lfo(validateLfoRate(rate, 'flutter'), 0.5)) }),
    breathe: (rate = 0.3)        => cp({ ...desc, ...appendMod(desc, 'volume', lfo(validateLfoRate(rate, 'breathe'), 0.4)) }),
    drift:   (amt = 0.3)         => cp({ ...desc, ...appendMod(desc, 'pitch',  ou(amt)) }),
    swell:   (bars)              => cp({ ...desc, ...appendMod(desc, 'volume', ramp(validateSwell(bars))) }),
    modulate: (param, source) => {
      const validatedParam = validateModulateParam(param)
      return cp({ ...desc, ...appendMod(desc, validatedParam, source) })
    },

    // ── Meta ──────────────────────────────────────────────────────────────────
    seed:  (n)       => cp({ ...desc, _seed:  validateSeed(n) }),
    name:  (label)   => cp({ ...desc, _name:  validateLabel(label, 'name') }),
    model: (variant) => {
      const v = validateModel(variant)
      const newType = `${desc.instrumentType}${v}`
      return cp({ ...desc, instrumentType: newType, type: newType, _model: v })
    },
    open: () => {
      // Maps base instrument types to their open counterparts.
      // Add new open variants here as they are registered in INSTRUMENT_REGISTRY.
      const OPEN_INSTRUMENT_MAP: Readonly<Partial<Record<string, string>>> = {
        'hihat808': 'hihatopen808',
      }
      const openType = OPEN_INSTRUMENT_MAP[desc.instrumentType] ?? desc.instrumentType
      return cp({ ...desc, instrumentType: openType, type: openType })
    },

    // ── Visual ────────────────────────────────────────────────────────────────
    visual: (override) => cp({ ...desc, _visual: { ...desc._visual, ...override } }),
    color:  (hex)  => cp({ ...desc, _visual: { ...desc._visual, color: validateColor(hex) } }),
    glyph:  (kind) => cp({ ...desc, _visual: { ...desc._visual, glyph: validateGlyph(kind) } }),
    label:  (text) => cp({ ...desc, _visual: { ...desc._visual, label: validateLabel(text, 'label') } }),
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
 * @param factory   - Function that creates the initial `ChainablePart`.
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
  factory:   (...args: Args) => T,
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
 * @param instrumentType  - The instrument type identifier (e.g. `'kick'`, `'reese-bass'`)
 * @param buildExtensions - Called with the current part; returns extra methods to spread
 * @returns A no-arg factory function returning `ChainablePart & Ext`
 *
 * @example
 * ```ts
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
 * @see {@link createPart}       — low-level factory used internally
 */
export const extendPart = <Ext extends Record<string, unknown>>(
  instrumentType:  string,
  buildExtensions: (part: ChainablePart) => Ext,
): (() => ChainablePart & Ext) => {
  const attachExtensions = (base: ChainablePart): ChainablePart & Ext => ({
    ...base,
    ...buildExtensions(base),
  })
  return () => attachExtensions(createPart({ instrumentType }, attachExtensions))
}
