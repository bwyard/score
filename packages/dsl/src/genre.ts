// genre.ts — EDM genre presets + name registry for @score/dsl
//
// GenreDescriptor carries BPM range, default meter, key, swing, and short-name
// registry. defineGenre() lets users define custom genre presets.
//
// The name registry maps short percussion aliases to instrument type strings.
// defineGenre() can override registry keys for genre context (e.g. hardstyle
// remaps 'bd' → 'kick-hard'). Used by the mini-notation parser (future).

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * BPM range descriptor — default, min, and max for a genre.
 */
export type GenreBpm = {
  readonly default: number
  readonly min: number
  readonly max: number
}

/**
 * Short-name registry — maps percussion/instrument aliases to instrument type strings.
 * Used by the mini-notation parser and instrument factories to resolve short names.
 */
export type NameRegistry = Record<string, string>

/**
 * Descriptor produced by {@link defineGenre} — carries all genre defaults.
 * Pass to `Song(128, [...]).genre(Techno)` to apply BPM range, meter, and swing.
 */
export type GenreDescriptor = {
  readonly _type: 'GenreDescriptor'
  /** Genre display name, e.g. `'Techno'`. */
  readonly name: string
  readonly bpm: GenreBpm
  /** Default time signature, e.g. `'4/4'`. */
  readonly meter: string
  /** Default key/mode, e.g. `'Am'`. `'any'` means no preferred key. */
  readonly key: string
  /** Swing amount 0–1. `0` = straight. */
  readonly swing: number
  /** Short-name registry overrides for this genre context. */
  readonly registry: NameRegistry
}

// ── Default name registry ─────────────────────────────────────────────────────
//
// Instrument aliases used by mini-notation and name-resolution helpers.
// All values are kebab-case instrument type strings (matches engine registry).

/**
 * Default short-name registry — global aliases covering all major percussion and
 * instrument types. `defineGenre()` overrides specific keys for genre context.
 */
export const DEFAULT_REGISTRY: NameRegistry = {
  // Kick drums
  'bd':     'kick-808',
  'kick':   'kick-808',
  'bd2':    'kick-909',
  'hs':     'kick-hard',
  'gb':     'kick-hardcore',
  // Snares / claps
  'sd':     'snare-909',
  'snare':  'snare-909',
  'cp':     'clap',
  'clap':   'clap',
  // Hi-hats
  'hh':     'hi-hat-808',
  'hat':    'hi-hat-808',
  'oh':     'hi-hat-808',   // engine uses props.open to differentiate
  // Percussion
  'cb':     'cowbell808',
  'rim':    'rimshot',
  'cg':     'conga',
  'tom':    'tom',
  'sh':     'shaker',
  'tb2':    'tambourine',
  'wb':     'woodblock',
  'bn':     'bongo',
  'cr':     'crash',
  'rd':     'ride',
  // Bass / melodic
  'tb':     'bass-303',
  'acid':   'bass-303',
  'rb':     'reese-bass',
  'wob':    'wobble-bass',
  'sub':    'synth',
  'fm':     'fm-synth',
  'juno':   'sub-synth',
  'pad':    'pad',
  'ss':     'supersaw',
  'rh':     'rhodes',
  'org':    'hammond',
  'arp':    'arp',
  'sax':    'sax',
  'piano':  'wavetable',
  // Sample
  'smp':    'sample',
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Define a reusable genre preset.
 *
 * Returns a {@link GenreDescriptor} that carries BPM range, meter, key, swing,
 * and optional name registry overrides. Pass to `Song(...).genre(preset)` to
 * apply genre defaults to the composition.
 *
 * @param desc - Genre configuration. `name` and `bpm.default` are required.
 * @returns A frozen {@link GenreDescriptor}.
 *
 * @example
 * ```ts
 * // Define a custom genre preset
 * const MyGenre = defineGenre({
 *   name: 'My Genre',
 *   bpm: { default: 132, min: 128, max: 140 },
 *   meter: '4/4',
 *   key: 'Cm',
 *   swing: 0,
 * })
 *
 * export default Song(132, [...]).genre(MyGenre)
 * ```
 *
 * @see {@link Techno}, {@link House}, {@link DeepHouse} — built-in presets
 */
export const defineGenre = (desc: {
  readonly name: string
  readonly bpm: GenreBpm
  readonly meter?: string
  readonly key?: string
  readonly swing?: number
  readonly registry?: NameRegistry
}): GenreDescriptor => ({
  _type: 'GenreDescriptor',
  name: desc.name,
  bpm: desc.bpm,
  meter: desc.meter ?? '4/4',
  key: desc.key ?? 'any',
  swing: desc.swing ?? 0,
  registry: { ...DEFAULT_REGISTRY, ...(desc.registry ?? {}) },
})

// ── Built-in genre presets ────────────────────────────────────────────────────

/**
 * Techno — driving 4/4, dark, industrial. Kick909, Snare909, Hihat808.
 * BPM range: 130–150 bpm, default 138.
 */
export const Techno = defineGenre({
  name: 'Techno',
  bpm: { default: 138, min: 130, max: 150 },
  key: 'Am',
  swing: 0,
})

/**
 * House — 4/4 four-on-the-floor, Chicago roots. Kick808, clap on 2/4.
 * BPM range: 120–132, default 128.
 */
export const House = defineGenre({
  name: 'House',
  bpm: { default: 128, min: 120, max: 132 },
  key: 'Am',
  swing: 0,
})

/**
 * Deep House — slower, darker house with Rhodes and sub bass.
 * BPM range: 118–125, default 122.
 */
export const DeepHouse = defineGenre({
  name: 'Deep House',
  bpm: { default: 122, min: 118, max: 125 },
  key: 'Fm',
  swing: 0.02,
})

/**
 * Drum & Bass — fast breakbeat, Reese bass, heavy sub.
 * BPM range: 160–180, default 174.
 */
export const DnB = defineGenre({
  name: 'Drum & Bass',
  bpm: { default: 174, min: 160, max: 180 },
  key: 'Dm',
  swing: 0,
})

/**
 * Dubstep — half-time feel, wobble bass, heavy sub.
 * BPM range: 136–142, default 140.
 */
export const Dubstep = defineGenre({
  name: 'Dubstep',
  bpm: { default: 140, min: 136, max: 142 },
  key: 'Gm',
  swing: 0,
})

/**
 * Hardstyle — reverse-bass kick, distorted body, festival anthems.
 * BPM range: 145–160, default 150.
 * Registry: `bd` → `kick-hard`.
 */
export const Hardstyle = defineGenre({
  name: 'Hardstyle',
  bpm: { default: 150, min: 145, max: 160 },
  key: 'Am',
  swing: 0,
  registry: { bd: 'kick-hard', kick: 'kick-hard' },
})

/**
 * Trance / Progressive — supersaw leads, arpeggios, big builds.
 * BPM range: 130–145, default 138.
 */
export const Trance = defineGenre({
  name: 'Trance',
  bpm: { default: 138, min: 130, max: 145 },
  key: 'Am',
  swing: 0,
  registry: { ss: 'supersaw', pad: 'supersaw' },
})

/**
 * Future Bass — chords + supersaw stabs, wobble, half-time elements.
 * BPM range: 140–160, default 150.
 */
export const FutureBass = defineGenre({
  name: 'Future Bass',
  bpm: { default: 150, min: 140, max: 160 },
  key: 'Em',
  swing: 0,
  registry: { ss: 'supersaw' },
})

/**
 * Trap (EDM) — 808 sub bass, hi-hat rolls, half-time snare.
 * BPM range: 130–150, default 140.
 * Registry: `bd` → `kick-808` (808 sub doubles as kick).
 */
export const Trap = defineGenre({
  name: 'Trap',
  bpm: { default: 140, min: 130, max: 150 },
  key: 'Cm',
  swing: 0.02,
  registry: { bd: 'kick-808' },
})

/**
 * Psytrance — fast squelchy FM bass, driving 145 bpm.
 * BPM range: 142–148, default 145.
 */
export const Psytrance = defineGenre({
  name: 'Psytrance',
  bpm: { default: 145, min: 142, max: 148 },
  key: 'Am',
  swing: 0,
  registry: { fm: 'fm-synth', tb: 'bass-303' },
})

/**
 * IDM / Glitch — experimental, irregular rhythms, complex polyrhythm.
 * BPM range: 90–160, default 120.
 */
export const IDM = defineGenre({
  name: 'IDM',
  bpm: { default: 120, min: 90, max: 160 },
  key: 'any',
  swing: 0,
})

/**
 * Ambient / Dark Ambient — slow, drone, long pads, vast spaces.
 * BPM range: 60–100, default 90.
 */
export const Ambient = defineGenre({
  name: 'Ambient',
  bpm: { default: 90, min: 60, max: 100 },
  key: 'any',
  swing: 0,
  registry: { pad: 'pad', drone: 'pad' },
})

/**
 * Synthwave / Retrowave — supersaw leads, gated reverb drums, arpeggios.
 * BPM range: 95–115, default 100.
 */
export const Synthwave = defineGenre({
  name: 'Synthwave',
  bpm: { default: 100, min: 95, max: 115 },
  key: 'Am',
  swing: 0,
  registry: { ss: 'supersaw', arp: 'arp' },
})

/**
 * Lo-fi Hip Hop — dusty samples, vinyl noise, lazy swing.
 * BPM range: 70–90, default 80.
 */
export const LoFi = defineGenre({
  name: 'Lo-fi Hip Hop',
  bpm: { default: 80, min: 70, max: 90 },
  key: 'any',
  swing: 0.06,
  registry: { smp: 'sample' },
})

/**
 * Minimal Techno — sparse clicks, subtle acid, hypnotic repetition.
 * BPM range: 128–135, default 130.
 */
export const MinimalTechno = defineGenre({
  name: 'Minimal Techno',
  bpm: { default: 130, min: 128, max: 135 },
  key: 'Am',
  swing: 0,
  registry: { tb: 'bass-303' },
})

/**
 * Acid House — TB-303 squelch, four-on-the-floor, Chicago 1987.
 * BPM range: 120–130, default 125.
 */
export const AcidHouse = defineGenre({
  name: 'Acid House',
  bpm: { default: 125, min: 120, max: 130 },
  key: 'Am',
  swing: 0,
  registry: { tb: 'bass-303', acid: 'bass-303' },
})
