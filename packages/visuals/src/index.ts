// index.ts — @score/visuals public API
// Single source of truth for all visual identity in Score Studio, CLI, and REPL.
//
// Importing this module auto-registers all 10 built-in themes + default annotation source.
// Consumers only need: import { resolveTheme, ... } from '@score/visuals'

// ── Type surface ──────────────────────────────────────────────────────────────
export type {
  TemporalTick,
  TrackVisualState,
  MathVisualState,
  ErrorVisualState,
  AudioVisualState,
  DrawLayerKind,
  DrawLayer,
  VisualSceneDescriptor,
  VisualTheme,
  EditorAnnotation,
  EditorAnnotationSet,
  AnnotationSource,
  GlyphKind,
  TrackVisualDescriptor,
  VisualOverlayKind,
  VisualOverlayDescriptor,
  VisualDslScene,
  VisualTransitionKind,
  VisualTransition,
  TerminalCell,
  TerminalFrame,
  TerminalTheme,
} from './types.js'

export type {
  AppTheme,
  VisualThemeBundle,
  StudioMode,
  ModeThemeMap,
  ThemeConfig,
  GuiComponentId,
  ComponentThemeOverride,
  ComponentThemeMap,
  InstrumentType,
  InstrumentVisualMap,
  SongVisualConfig,
  Palette,
} from './app-theme.js'

// ── AppTheme palettes ─────────────────────────────────────────────────────────
export {
  darkPulseAppTheme,
  lorenzAppTheme,
  neonGridAppTheme,
  logisticAppTheme,
  euclideanAppTheme,
  probabilityAppTheme,
  minimalAppTheme,
  cycleRingsAppTheme,
  eventCascadeAppTheme,
  tidalStreamAppTheme,
} from './app-theme.js'

// ── Theme config defaults ─────────────────────────────────────────────────────
export { defaultThemeConfig, defaultInstrumentVisuals } from './app-theme.js'

// ── Named color presets ───────────────────────────────────────────────────────
export {
  COLOR_BLUE,
  COLOR_AMBER,
  COLOR_RED,
  COLOR_CYAN,
  COLOR_NEON,
  COLOR_ACID,
  COLOR_VOID,
  COLOR_PULSE,
  COLOR_WHITE,
  COLOR_GHOST,
} from './app-theme.js'

// ── Named palettes ────────────────────────────────────────────────────────────
export {
  acidPalette,
  neonPalette,
  voidPalette,
  firePalette,
  builtInPalettes,
  getPalette,
} from './app-theme.js'

// ── Registry ──────────────────────────────────────────────────────────────────
export {
  defineTheme,
  registerTheme,
  getTheme,
  listThemes,
  resolveTheme,
  defineAnnotationSource,
  registerAnnotationSource,
  getAnnotationSource,
} from './registry.js'

// ── Pure resolvers ────────────────────────────────────────────────────────────
export {
  resolveComponentTheme,
  resolveTrackVisual,
  resolveTrackColor,
} from './resolve.js'

// ── DrawLayer builders ────────────────────────────────────────────────────────
export {
  waveformLayer,
  spectrumLayer,
  radialGlowLayer,
  stepBarLayer,
  euclideanRingLayer,
  gridLayer,
  attractorPointsLayer,
  probabilityFieldLayer,
  particleBurstLayer,
  orbitLayer,
} from './layers.js'

// ── Visual DSL factories ──────────────────────────────────────────────────────
export {
  waveformArc,
  euclideanRing,
  lorenzTrail,
  spectrumBars,
  stepDots,
  textLabel,
  particleBurst,
} from './visual-dsl.js'

// ── Auto-registration (side effects) ─────────────────────────────────────────
// Importing @score/visuals registers all 10 built-in themes + default annotation source.
// BOUNDARY: these are the only side effects in this package.

import { registerTheme } from './registry.js'
import { registerAnnotationSource } from './registry.js'
import { darkPulseBundle }        from './themes/dark-pulse.js'
import { lorenzBundle }           from './themes/lorenz.js'
import { neonGridBundle }         from './themes/neon-grid.js'
import { logisticBundle }         from './themes/logistic.js'
import { euclideanMandalaBundle } from './themes/euclidean-mandala.js'
import { probabilityStormBundle } from './themes/probability-storm.js'
import { minimalBundle }          from './themes/minimal.js'
import { cycleRingsBundle }       from './themes/cycle-rings.js'
import { eventCascadeBundle }     from './themes/event-cascade.js'
import { tidalStreamBundle }      from './themes/tidal-stream.js'
import { defaultAnnotationSource } from './annotations/default-annotations.js'

registerTheme(darkPulseBundle)
registerTheme(lorenzBundle)
registerTheme(neonGridBundle)
registerTheme(logisticBundle)
registerTheme(euclideanMandalaBundle)
registerTheme(probabilityStormBundle)
registerTheme(minimalBundle)
registerTheme(cycleRingsBundle)
registerTheme(eventCascadeBundle)
registerTheme(tidalStreamBundle)

registerAnnotationSource('default', defaultAnnotationSource)
