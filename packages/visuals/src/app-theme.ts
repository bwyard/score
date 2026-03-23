// app-theme.ts — UI palette token system + per-mode / per-component / per-instrument theming
// @score/visuals is the single source of truth for all visual identity in Score Studio.

import type { TrackVisualDescriptor, VisualTheme, VisualDslScene } from './types.js'

// ── AppTheme — UI palette tokens ──────────────────────────────────────────────

/**
 * UI palette token set consumed by all @score/gui components.
 * Replace hardcoded hex strings by reading from the active AppTheme.
 *
 * @example
 * ```ts
 * const { accent, background } = resolveTheme(config, 'performance').appTheme
 * ```
 */
export type AppTheme = {
  readonly name:        string
  /** Main application background. */
  readonly background:  string
  /** Panel / card / surface background. */
  readonly surface:     string
  /** Dividers, borders, and input outlines. */
  readonly border:      string
  /** Primary text color. */
  readonly text:        string
  /** Secondary / label / caption text. */
  readonly textMuted:   string
  /** Accent color for buttons, active states, and highlights. */
  readonly accent:      string
  /** Soft accent for hover backgrounds and subtle highlights. */
  readonly accentMuted: string
  /** Error and warning color. */
  readonly error:       string
  /** Per-track color palette — must have ≥ 8 entries. */
  readonly tracks:      ReadonlyArray<string>
}

// ── Built-in AppTheme palettes (one per VisualThemeBundle) ───────────────────

/** Score's default dark palette — familiar dark blue UI. */
export const darkPulseAppTheme: AppTheme = {
  name:        'dark-pulse',
  background:  '#0e0e11',
  surface:     '#111318',
  border:      '#1e1e22',
  text:        '#c8d8f8',
  textMuted:   '#556688',
  accent:      '#4a8fff',
  accentMuted: '#1a2035',
  error:       '#ff4a4a',
  tracks: ['#4a8fff', '#ff6b35', '#44cc88', '#cc44aa', '#ffcc00', '#44cccc', '#ff4a4a', '#88cc44'],
}

/** Lorenz chaos palette — deep purple with neon violet accents. */
export const lorenzAppTheme: AppTheme = {
  name:        'lorenz',
  background:  '#050008',
  surface:     '#0d0012',
  border:      '#1a0025',
  text:        '#e8d8ff',
  textMuted:   '#664488',
  accent:      '#cc44ff',
  accentMuted: '#220033',
  error:       '#ff4466',
  tracks: ['#cc44ff', '#ff44cc', '#8844ff', '#ff6688', '#aa66ff', '#ff88aa', '#6688ff', '#ffaa66'],
}

/** Neon grid palette — deep navy with phosphor green accents. */
export const neonGridAppTheme: AppTheme = {
  name:        'neon-grid',
  background:  '#000510',
  surface:     '#000c1a',
  border:      '#001830',
  text:        '#ccffee',
  textMuted:   '#224466',
  accent:      '#00ff88',
  accentMuted: '#002211',
  error:       '#ff4466',
  tracks: ['#00ff88', '#00ccff', '#88ff00', '#ffcc00', '#ff8800', '#ff0088', '#8800ff', '#00ffcc'],
}

/** Logistic map palette — amber and red bifurcation colors. */
export const logisticAppTheme: AppTheme = {
  name:        'logistic',
  background:  '#0a0800',
  surface:     '#150f00',
  border:      '#2a1e00',
  text:        '#ffe8cc',
  textMuted:   '#886633',
  accent:      '#ffaa00',
  accentMuted: '#332200',
  error:       '#ff4444',
  tracks: ['#ffaa00', '#ff6600', '#ffcc44', '#ff3300', '#ffee88', '#ff8800', '#ffdd00', '#ff4400'],
}

/** Euclidean mandala palette — teal and cyan geometry colors. */
export const euclideanAppTheme: AppTheme = {
  name:        'euclidean-mandala',
  background:  '#00080a',
  surface:     '#001015',
  border:      '#001820',
  text:        '#ccffff',
  textMuted:   '#226688',
  accent:      '#00ccff',
  accentMuted: '#001122',
  error:       '#ff4455',
  tracks: ['#00ccff', '#00ffcc', '#0088ff', '#00ffaa', '#44aaff', '#00ddaa', '#22aaff', '#00cc88'],
}

/** Probability storm palette — dark green with static noise greens. */
export const probabilityAppTheme: AppTheme = {
  name:        'probability-storm',
  background:  '#020a02',
  surface:     '#051005',
  border:      '#0a1a0a',
  text:        '#ccffcc',
  textMuted:   '#336633',
  accent:      '#44ff44',
  accentMuted: '#0a1a0a',
  error:       '#ff4444',
  tracks: ['#44ff44', '#88ff44', '#44ff88', '#aaff22', '#66ff66', '#ccff44', '#33ff33', '#99ff55'],
}

/** Minimal palette — monochrome, for hybrid DJ/set mode. */
export const minimalAppTheme: AppTheme = {
  name:        'minimal',
  background:  '#080808',
  surface:     '#101010',
  border:      '#1c1c1c',
  text:        '#e0e0e0',
  textMuted:   '#505050',
  accent:      '#a0a0a0',
  accentMuted: '#1c1c1c',
  error:       '#ff4444',
  tracks: ['#ffffff', '#cccccc', '#aaaaaa', '#888888', '#dddddd', '#bbbbbb', '#999999', '#eeeeee'],
}

/** Cycle rings palette — warm analog colors. */
export const cycleRingsAppTheme: AppTheme = {
  name:        'cycle-rings',
  background:  '#0a0805',
  surface:     '#130f08',
  border:      '#221a0e',
  text:        '#fff0cc',
  textMuted:   '#776644',
  accent:      '#ffaa44',
  accentMuted: '#221505',
  error:       '#ff4455',
  tracks: ['#ffaa44', '#ff6688', '#88ffaa', '#ffcc22', '#44ccff', '#ff88cc', '#aaff44', '#ff4488'],
}

/** Event cascade palette — vibrant multicolor on near-black. */
export const eventCascadeAppTheme: AppTheme = {
  name:        'event-cascade',
  background:  '#060606',
  surface:     '#0e0e0e',
  border:      '#1a1a1a',
  text:        '#f0f0f0',
  textMuted:   '#606060',
  accent:      '#ff6644',
  accentMuted: '#1a0a08',
  error:       '#ff3333',
  tracks: ['#ff6644', '#44aaff', '#44ff88', '#ffcc00', '#ff44aa', '#88ff44', '#ff8800', '#44ffcc'],
}

/** Tidal stream palette — ocean blues and aqua. */
export const tidalStreamAppTheme: AppTheme = {
  name:        'tidal-stream',
  background:  '#00060a',
  surface:     '#000c14',
  border:      '#001520',
  text:        '#cceeff',
  textMuted:   '#336688',
  accent:      '#44aaff',
  accentMuted: '#001122',
  error:       '#ff4466',
  tracks: ['#44aaff', '#00ccdd', '#6688ff', '#00eebb', '#4488ff', '#22ccff', '#8866ff', '#00ffdd'],
}

// ── VisualThemeBundle ─────────────────────────────────────────────────────────

/**
 * A complete visual theme bundle — ties an AppTheme (UI palette) to a canvas VisualTheme.
 * Selecting a theme changes both the UI palette tokens and the canvas animation.
 */
export type VisualThemeBundle = {
  /** Unique theme name — used as the key in ThemeConfig. */
  readonly name:        string
  /** UI palette tokens for @score/gui components. */
  readonly appTheme:    AppTheme
  /** Canvas theme function for the PerformanceMode renderer. */
  readonly canvasTheme: VisualTheme
}

// ── Per-mode theming ──────────────────────────────────────────────────────────
// StudioMode is duplicated here (not imported from @score/gui) to keep @score/visuals
// free of circular dependencies. @score/gui imports from @score/visuals, not vice versa.

/**
 * The five Studio modes — duplicated from @score/gui ipc-types to avoid circular dep.
 * Must stay in sync with StudioMode in packages/gui/src/main/ipc-types.ts.
 */
export type StudioMode = 'live-code' | 'produce' | 'dj-set' | 'jam-session' | 'performance'

/**
 * Per-mode theme name overrides. All keys are optional — missing modes fall back to global.
 */
export type ModeThemeMap = {
  readonly [mode in StudioMode]?: string
}

/**
 * The single settable object that controls all theming for the Score Studio app.
 * One global fallback + optional per-mode overrides.
 *
 * @example
 * ```ts
 * const config: ThemeConfig = {
 *   global: 'dark-pulse',
 *   modes: { performance: 'lorenz', 'dj-set': 'neon-grid' },
 * }
 * ```
 */
export type ThemeConfig = {
  /** Default theme name — used when no per-mode override is set. */
  readonly global: string
  /** Per-mode overrides. Missing modes fall back to `global`. */
  readonly modes?: ModeThemeMap
}

/**
 * Built-in default theme config — sensible per-mode defaults.
 * Consumers can spread-override to customise:
 * `{ ...defaultThemeConfig, modes: { ...defaultThemeConfig.modes, performance: 'neon-grid' } }`
 */
export const defaultThemeConfig: ThemeConfig = {
  global: 'dark-pulse',
  modes: {
    'live-code':   'cycle-rings',
    'produce':     'dark-pulse',
    'dj-set':      'neon-grid',
    'jam-session': 'euclidean-mandala',
    'performance': 'lorenz',
  },
}

// ── Per-component GUI token overrides ─────────────────────────────────────────

/**
 * Named @score/gui component IDs — must stay in sync with component display names.
 * Used as keys in ComponentThemeMap.
 */
export type GuiComponentId =
  | 'SplashScreen'
  | 'TransportBar'    | 'BugReportModal'  | 'CodeEditorPanel' | 'CodeHighlight'
  | 'CodeWaveform'    | 'ConsoleLog'       | 'DraggablePanel'  | 'MasterLevel'
  | 'MixerStrip'      | 'ReferencePanel'
  | 'BarCounter'      | 'EvalStatus'       | 'PendingSwapBadge'
  | 'PianoRoll'       | 'PunchcardGrid'    | 'Scope'            | 'SpectrumAnalyser' | 'VUMeter'
  | 'LiveCode'        | 'Produce'          | 'DJSet'            | 'JamSession'       | 'PerformanceMode'

/** Partial AppTheme override for a single GUI component. Unset keys inherit from active AppTheme. */
export type ComponentThemeOverride = Partial<AppTheme>

/**
 * Map of per-component token overrides. Each component can override any subset of AppTheme tokens
 * without replacing the whole theme.
 *
 * @example
 * ```ts
 * const map: ComponentThemeMap = {
 *   TransportBar: { border: '#2a2a44' },
 *   MixerStrip:   { surface: '#0d0d18' },
 * }
 * ```
 */
export type ComponentThemeMap = {
  readonly [id in GuiComponentId]?: ComponentThemeOverride
}

// ── Per-instrument default visual descriptors ─────────────────────────────────

/**
 * All 14 @score/dsl instrument type strings.
 * Duplicated here (not imported from @score/dsl) to keep @score/visuals dep-free of DSL.
 */
export type InstrumentType =
  | 'kick'    | 'snare'   | 'hihat'    | 'synth'  | 'sample'
  | 'theremin'| 'sax'     | 'arp'
  | 'kick808' | 'kick909' | 'hihat808' | 'snare909'
  | 'subsynth'| 'fmsynth'

/**
 * Default TrackVisualDescriptor per instrument type.
 * Used as the fallback in the resolver chain when no song-level or chain-level override is set.
 */
export type InstrumentVisualMap = {
  readonly [type in InstrumentType]?: TrackVisualDescriptor
}

/**
 * Built-in instrument visual defaults — sensible starting points per instrument family.
 * Percussion defaults to euclidean-ring or step-dots; pitched instruments to waveform-mini.
 */
export const defaultInstrumentVisuals: InstrumentVisualMap = {
  kick808:  { glyph: 'euclidean-ring' },
  kick909:  { glyph: 'euclidean-ring' },
  kick:     { glyph: 'euclidean-ring' },
  snare:    { glyph: 'step-dots' },
  snare909: { glyph: 'step-dots' },
  hihat:    { glyph: 'step-dots' },
  hihat808: { glyph: 'step-dots' },
  synth:    { glyph: 'waveform-mini' },
  subsynth: { glyph: 'waveform-mini' },
  fmsynth:  { glyph: 'waveform-mini' },
  sax:      { glyph: 'probability-arc' },
  arp:      { glyph: 'probability-arc' },
  theremin: { glyph: 'waveform-mini' },
  sample:   { glyph: 'step-dots' },
}

// ── Song-level visual config ──────────────────────────────────────────────────
// Types owned here; used in @score/dsl SongDescriptor.visual field (future PR).

/**
 * Song-level visual preferences, declared in the song file.
 * Overrides the active ThemeConfig for this specific song.
 *
 * @example
 * ```ts
 * export default Song({
 *   bpm: 140,
 *   tracks: [kick, bass],
 *   visual: {
 *     theme: 'lorenz',
 *     instruments: { synth: { glyph: 'waveform-mini', color: '#cc44ff' } },
 *     tracks: { kick: { glyph: 'euclidean-ring', color: '#ff4a4a' } },
 *   },
 * })
 * ```
 */
export type SongVisualConfig = {
  /** Override the active theme for this song — ignored if VisualDslScene is provided. */
  readonly theme?:       string
  /** Per-instrument-type visual overrides (applies to all tracks of that type). */
  readonly instruments?: InstrumentVisualMap
  /** Per-track-name visual overrides (keyed by variable name in the song). */
  readonly tracks?:      Record<string, TrackVisualDescriptor>
  /** Full declarative scene description — authored with Visual DSL factory functions. */
  readonly scene?:       VisualDslScene
}

// ── Named color presets ───────────────────────────────────────────────────────
// Single-word live-coding constants — fast to type mid-set in the REPL.
// Compatible with ChainablePart.color() and Palette.tracks entries.

/** Score's signature electric blue. */
export const COLOR_BLUE  = '#4a8fff'
/** Warm amber-orange. */
export const COLOR_AMBER = '#ffaa44'
/** Deep red / error. */
export const COLOR_RED   = '#ff4a4a'
/** Bright cyan — neon-grid signature. */
export const COLOR_CYAN  = '#00ccff'
/** Phosphor green — neon signature. */
export const COLOR_NEON  = '#00ff88'
/** Acid yellow-green. */
export const COLOR_ACID  = '#ccff00'
/** Lorenz purple / chaos. */
export const COLOR_VOID  = '#cc44ff'
/** Hot pink / magenta. */
export const COLOR_PULSE = '#ff44cc'
/** Pure white. */
export const COLOR_WHITE = '#ffffff'
/** Near-black off-white. */
export const COLOR_GHOST = '#aaaaaa'

// ── Palette — named per-instrument color set ──────────────────────────────────
// A Palette applies a consistent color story across all tracks.
// Song-level: `Song({ palette: 'acid', ... })` → applied as base InstrumentVisualMap.
// Per-instrument `.color()` overrides on top.

/**
 * Named color palette — a flat map of instrument type to CSS hex color.
 * Applied as the base layer of InstrumentVisualMap; per-instrument `.color()` overrides on top.
 *
 * @example
 * ```ts
 * // Song author applies a full color story in one word:
 * export default Song({ bpm: 140, palette: 'acid', tracks: [kick, bass] })
 * // kick → '#ccff00', bass → '#aaff22', etc.
 * ```
 */
export type Palette = {
  readonly name:        string
  /** Color per instrument type. Unset types fall back to AppTheme.tracks[i]. */
  readonly instruments: Partial<Record<InstrumentType, string>>
}

/** Acid palette — sharp yellows and greens, hard-edged like 303 squelch. */
export const acidPalette: Palette = {
  name: 'acid',
  instruments: {
    kick808:  '#ccff00', kick909: '#aaff22', kick:     '#bbff11',
    snare:    '#ffee00', snare909: '#ffdd11',
    hihat:    '#88ff44', hihat808: '#99ff33',
    synth:    '#ccff44', subsynth: '#aaff44', fmsynth: '#bbff22',
    sax:      '#ffff44', arp:     '#ccff66',
    theremin: '#aaffaa', sample:  '#99ff55',
  },
}

/** Neon palette — bright cyan, magenta, lime — digital rave energy. */
export const neonPalette: Palette = {
  name: 'neon',
  instruments: {
    kick808:  '#00ff88', kick909: '#00ffcc', kick:     '#00ffaa',
    snare:    '#ff44cc', snare909: '#ff22bb',
    hihat:    '#00ccff', hihat808: '#00ddff',
    synth:    '#ff00ff', subsynth: '#cc00ff', fmsynth: '#aa00ff',
    sax:      '#44ff44', arp:     '#88ffcc',
    theremin: '#ff88ff', sample:  '#00ff44',
  },
}

/** Void palette — deep purples and dark violets — Lorenz / chaos aesthetic. */
export const voidPalette: Palette = {
  name: 'void',
  instruments: {
    kick808:  '#cc44ff', kick909: '#aa33ff', kick:     '#bb44ff',
    snare:    '#ff44aa', snare909: '#ff3388',
    hihat:    '#8844ff', hihat808: '#6633ff',
    synth:    '#aa66ff', subsynth: '#9955ff', fmsynth: '#8844ff',
    sax:      '#ff66aa', arp:     '#cc66ff',
    theremin: '#dd88ff', sample:  '#9944cc',
  },
}

/** Fire palette — reds, oranges, deep amber — heat and urgency. */
export const firePalette: Palette = {
  name: 'fire',
  instruments: {
    kick808:  '#ff4400', kick909: '#ff3300', kick:     '#ff5500',
    snare:    '#ffaa00', snare909: '#ff8800',
    hihat:    '#ff6600', hihat808: '#ff7700',
    synth:    '#ff2200', subsynth: '#ff1100', fmsynth: '#ff3300',
    sax:      '#ffcc00', arp:     '#ff8844',
    theremin: '#ffdd44', sample:  '#ff6622',
  },
}

/** Registry of built-in palettes by name. */
export const builtInPalettes: Readonly<Record<string, Palette>> = {
  acid: acidPalette,
  neon: neonPalette,
  void: voidPalette,
  fire: firePalette,
}

/**
 * Resolve a palette by name. Returns `undefined` if not found.
 *
 * @param name - Palette name (e.g. 'acid', 'neon', 'void', 'fire').
 * @returns The Palette or undefined.
 */
export const getPalette = (name: string): Palette | undefined => builtInPalettes[name]
