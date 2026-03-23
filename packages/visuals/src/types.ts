// types.ts — Complete @score/visuals type surface
// Single source of truth for all visual types across Score Studio, CLI, and REPL.

import type { TemporalTick } from '@score/sequencer'
export type { TemporalTick }

// ── Per-track audio state ─────────────────────────────────────────────────────

/** Visual state for a single track, sampled each animation frame. */
export type TrackVisualState = {
  /** Track variable name (e.g. 'kick', 'bass'). */
  readonly name:         string
  /** Instrument type string (e.g. 'kick808', 'synth'). */
  readonly type:         string
  /** Whether this track fired on the current step. */
  readonly active:       boolean
  /** Amplitude 0–1, sampled from the track's output. */
  readonly rms:          number
  /** Resolved step pattern from PartDescriptor._pattern. */
  readonly pattern?:     readonly number[]
  /** Active modulation parameter names. */
  readonly modulations?: readonly string[]
}

// ── Math-as-art substrate ─────────────────────────────────────────────────────
// The SAME math objects that produce the audio are exposed here.
// Themes drawing Lorenz points draw the ACTUAL attractor that ran the bass pattern —
// one computation, two outputs: sound and light.

/** Live values of the math engines that are currently driving the song. */
export type MathVisualState = {
  /** Live Lorenz attractor position (x, y, z ∈ approx −25…25). */
  readonly lorenz?:        { readonly x: number; readonly y: number; readonly z: number }
  /** Current logistic map r parameter (0…4), driven from BPM or pattern density. */
  readonly logisticR?:     number
  /** Per-track OUProcess drift values (0–1), e.g. filter cutoff / pitch bend. */
  readonly ouDrift?:       readonly number[]
  /** Per-track euclidean sequencer positions — { step, total } for each track. */
  readonly euclidean?:     ReadonlyArray<{ readonly step: number; readonly total: number }>
  /** Per-track step probability weights for degrade/stepProb patterns. */
  readonly probabilities?: ReadonlyArray<readonly number[]>
}

// ── Error / warning visual state ─────────────────────────────────────────────

/** Visual error overlay state, populated when @score/core emits a ScoreError. */
export type ErrorVisualState = {
  /** Whether the error state is currently active. */
  readonly active:  boolean
  /** Error message string. */
  readonly message: string
  /** Severity level. */
  readonly level:   'warning' | 'error'
}

// ── Primary audio-visual state ────────────────────────────────────────────────

/**
 * Complete audio-visual state passed to every theme on each animation frame.
 * All values are readonly snapshots — themes must not mutate this object.
 *
 * @example
 * ```ts
 * const state: AudioVisualState = {
 *   waveform: [...], bins: [...],
 *   tick: { step: 4, bar: 1, beat: 0, bpm: 128, time: 1.5, stepCount: 16 },
 *   rms: 0.6,
 *   tracks: [{ name: 'kick', type: 'kick808', active: true, rms: 0.9 }],
 * }
 * ```
 */
export type AudioVisualState = {
  /** Time-domain waveform samples, normalised to −1…1. */
  readonly waveform: readonly number[]
  /** FFT magnitude bins, normalised to 0…1. */
  readonly bins:     readonly number[]
  /**
   * Canonical temporal snapshot (ADR 027).
   * Replaces flat step/bar/bpm fields — import TemporalTick from \@score/sequencer.
   */
  readonly tick:     TemporalTick
  /** Master RMS amplitude 0–1. */
  readonly rms:      number
  /** Per-track visual states. */
  readonly tracks:   readonly TrackVisualState[]
  /** Song seed for deterministic chaos reproducibility. */
  readonly seed?:    number
  /** Math engine state — the same math that produced this audio frame. */
  readonly math?:    MathVisualState
  /**
   * @score/form arrangement section state — populated when Form is live.
   * Allows themes to respond to musical structure (drop intensity, breakdown calm).
   */
  readonly section?: {
    readonly type:          string  // 'intro' | 'buildup' | 'drop' | 'breakdown' | 'outro' | ...
    readonly barInSection:  number
    readonly intensity:     number  // 0–1 normalized section energy
    readonly next?:         string  // upcoming section type for pre-transition effects
  }
  /** Error overlay state — populated when @score/core emits a ScoreError. */
  readonly error?: ErrorVisualState
  /**
   * Open extension bag for future data sources (MIDI CC, Stage, Prime, etc.).
   * Never use this for typed data — add a typed field above instead.
   */
  readonly ext?: Record<string, unknown>
}

// ── Canvas rendering output ───────────────────────────────────────────────────

/**
 * All supported draw layer types.
 * Each kind maps to a specific rendering primitive in the canvas renderer.
 */
export type DrawLayerKind =
  | 'waveform'          // time-domain oscilloscope trace
  | 'spectrum'          // FFT frequency bars
  | 'radial-glow'       // RMS pulse ring — expands on beat
  | 'step-bar'          // vertical scrub line at current step position
  | 'euclidean-ring'    // per-track Euclidean rhythm circle
  | 'grid'              // perspective vanishing-point grid (neon extrusion)
  | 'attractor-points'  // Lorenz / logistic map trajectory points
  | 'probability-field' // stepProb / degrade 2D density heatmap
  | 'particle-burst'    // per-hit particle emitter
  | 'orbit'             // OUProcess drift trace (smooth curve)
  | 'text'              // text annotation overlay

/**
 * A single renderable layer in a visual scene.
 * The canvas renderer iterates layers and draws each in order (painter's algorithm).
 */
export type DrawLayer = {
  /** The rendering primitive to use. */
  readonly kind:  DrawLayerKind
  /** Primary color as a CSS hex string (e.g. '#4a8fff'). */
  readonly color: string
  /** Opacity 0–1. */
  readonly alpha: number
  /** Layer-specific data — interpreted by the renderer for this `kind`. */
  readonly data:  Record<string, unknown>
}

/**
 * Complete description of a canvas scene at one instant.
 * Returned by a `VisualTheme` function on every animation frame.
 */
export type VisualSceneDescriptor = {
  readonly _type:      'VisualSceneDescriptor'
  /** CSS color string for the canvas background. */
  readonly background: string
  /** Ordered layers — rendered back to front. */
  readonly layers:     ReadonlyArray<DrawLayer>
}

/**
 * A canvas visual theme — a pure function from audio state to a scene description.
 * Stateful themes (e.g. Lorenz trajectory) use a closure but the function itself
 * is deterministic given the same AudioVisualState.
 *
 * @example
 * ```ts
 * const darkPulse: VisualTheme = (state) => ({
 *   _type: 'VisualSceneDescriptor',
 *   background: '#0e0e11',
 *   layers: [radialGlowLayer(state.rms, '#4a8fff', 0.6)],
 * })
 * ```
 */
export type VisualTheme = (state: AudioVisualState) => VisualSceneDescriptor

// ── Monaco editor gutter annotations ─────────────────────────────────────────
// Consumed by @score/gui MonacoEditor gutter extension.
// Defined here now so the MonacoEditor PR just imports the type — no refactor needed.

/** A single editor gutter annotation for one track at one step. */
export type EditorAnnotation = {
  /** Variable name in the song file (e.g. 'kick', 'bass'). */
  readonly variableName: string
  /** 0-based Monaco line number. */
  readonly lineNumber:   number
  /** Index into AudioVisualState.tracks. */
  readonly trackIndex:   number
  /** Resolved step pattern for this track. */
  readonly pattern:      readonly number[]
  /** Current sequencer step — determines which step is highlighted. */
  readonly step:         number
  /** Color from active AppTheme.tracks[trackIndex]. */
  readonly color:        string
}

/** A set of editor annotations for all tracks in the current song. */
export type EditorAnnotationSet = ReadonlyArray<EditorAnnotation>

/**
 * Pure function that derives editor annotations from audio state + variable positions.
 *
 * @param state - Current audio-visual state.
 * @param varMap - Variable name → Monaco line number mapping (extracted from AST).
 * @returns Set of gutter annotations, one per track.
 */
export type AnnotationSource = (
  state:  AudioVisualState,
  varMap: ReadonlyArray<{ readonly name: string; readonly lineNumber: number }>
) => EditorAnnotationSet

// ── Per-track DSL glyph ───────────────────────────────────────────────────────
// @score/dsl ChainablePart will gain a `.glyph()` method storing TrackVisualDescriptor.
// Typed here now so the DSL PR just imports the type — no refactor needed.

/** Supported per-track inline glyph kinds. */
export type GlyphKind =
  | 'euclidean-ring'
  | 'step-dots'
  | 'waveform-mini'
  | 'probability-arc'
  | 'none'

/**
 * Visual descriptor attached to a DSL track via `.glyph()`.
 * Overrides the instrument type default from InstrumentVisualMap.
 */
export type TrackVisualDescriptor = {
  /** Inline glyph rendered alongside the track in the editor. */
  readonly glyph?:   GlyphKind
  /** Color override — defaults to AppTheme.tracks[trackIndex]. */
  readonly color?:   string
  /** Human-readable label override (defaults to track variable name). */
  readonly label?:   string
  /** Opacity override 0–1. */
  readonly opacity?: number
}

// ── Visual DSL — live-codeable scene description ──────────────────────────────
// Song files can describe their visuals using the same factory function style as instruments.
// @score/dsl SongDescriptor gains `visual?: SongVisualConfig` which accepts VisualDslScene.

/** Supported overlay kinds in the Visual DSL. */
export type VisualOverlayKind =
  | 'waveform-arc'
  | 'euclidean-ring'
  | 'lorenz-trail'
  | 'spectrum-bars'
  | 'step-dots'
  | 'text-label'
  | 'particle-burst'

/**
 * A declarative overlay descriptor — the output of Visual DSL factory functions.
 * Consumed by the canvas renderer to compose additional layers onto the active theme.
 */
export type VisualOverlayDescriptor = {
  readonly _type:    'VisualOverlayDescriptor'
  /** The overlay rendering kind. */
  readonly kind:     VisualOverlayKind
  /** Color override — defaults to active AppTheme.tracks[trackIndex]. */
  readonly color?:   string
  /** Opacity 0–1. */
  readonly alpha?:   number
  /** Kind-specific options. */
  readonly options?: Record<string, unknown>
}

/**
 * A declarative visual scene authored in a song file.
 * Used as the `visual` property of SongDescriptor / SongVisualConfig.
 *
 * @example
 * ```ts
 * export default Song({
 *   bpm: 140,
 *   tracks: [kick, bass],
 *   visual: { theme: 'lorenz', overlays: [euclideanRing({ alpha: 0.7 })] },
 * })
 * ```
 */
export type VisualDslScene = {
  readonly _type:     'VisualDslScene'
  /** Override the active theme for this song (ignores global ThemeConfig). */
  readonly theme?:    string
  /** Additional overlay layers rendered on top of the active theme. */
  readonly overlays?: ReadonlyArray<VisualOverlayDescriptor>
}

// ── Visual transitions ────────────────────────────────────────────────────────

/** How the canvas transitions between scenes. */
export type VisualTransitionKind = 'fade' | 'flash' | 'wipe' | 'none'

/**
 * Transition descriptor — rendered between mode switches, section changes, or on eval.
 * Purely declarative: the canvas renderer decides how to animate it.
 */
export type VisualTransition = {
  /** Transition style. */
  readonly kind:       VisualTransitionKind
  /** Duration in milliseconds. */
  readonly durationMs: number
  /** Flash color — defaults to AppTheme.accent. Used only when kind is 'flash'. */
  readonly color?:     string
}

// ── Terminal / REPL / CLI output ──────────────────────────────────────────────
// Platform-agnostic data. @score/cli / @score/repl handle ANSI rendering.
// @score/visuals NEVER imports chalk or any Node terminal library.

/** A single terminal display cell with optional color. */
export type TerminalCell = {
  /** Display text for this cell. */
  readonly text:   string
  /** CSS hex color — the terminal renderer maps this to the nearest ANSI code. */
  readonly color?: string
}

/**
 * A complete terminal frame — a 2D grid of cells.
 * Returned by a TerminalTheme on each update tick.
 */
export type TerminalFrame = {
  readonly _type: 'TerminalFrame'
  /** Rows of cells — outer array is rows, inner array is columns. */
  readonly rows:  ReadonlyArray<ReadonlyArray<TerminalCell>>
}

/**
 * A terminal visual theme — pure function from audio state to a terminal frame.
 * Used by @score/cli and @score/repl to display live step information.
 */
export type TerminalTheme = (state: AudioVisualState) => TerminalFrame
