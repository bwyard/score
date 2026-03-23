// resolve.ts — Pure resolver chain (no side effects, no registry reads)
// All functions take maps as arguments and return new objects — never mutate.

import type { AppTheme, ComponentThemeOverride, InstrumentType, InstrumentVisualMap, SongVisualConfig } from './app-theme.js'
import type { TrackVisualDescriptor } from './types.js'

/**
 * Merges a component-level token override into a base AppTheme.
 * Returns a new AppTheme object — never mutates the base.
 *
 * @param base     - The active AppTheme from the resolved VisualThemeBundle.
 * @param override - Partial token overrides for this specific component.
 * @returns A new AppTheme with override tokens applied.
 *
 * @example
 * ```ts
 * const transportTheme = resolveComponentTheme(activeTheme, { border: '#2a2a44' })
 * ```
 */
export const resolveComponentTheme = (
  base:      AppTheme,
  override?: ComponentThemeOverride,
): AppTheme => {
  if (override === undefined) return base
  return { ...base, ...override }
}

/**
 * Resolves the final TrackVisualDescriptor for a track, using the priority chain:
 * 1. `songConfig.tracks[trackName]` — song-level per-track override (highest priority)
 * 2. `songConfig.instruments[instrumentType]` — song-level per-type override
 * 3. `instrumentMap[instrumentType]` — built-in instrument type default
 * 4. `{}` — empty descriptor (no glyph, no color override)
 *
 * @param instrumentType - The instrument type string (e.g. 'kick808', 'synth').
 * @param trackName      - The variable name of the track in the song (e.g. 'kick').
 * @param songConfig     - Song-level visual config (from SongDescriptor.visual).
 * @param instrumentMap  - Built-in instrument visual defaults map.
 * @returns The resolved TrackVisualDescriptor (may be empty if no overrides apply).
 *
 * @example
 * ```ts
 * const desc = resolveTrackVisual('kick808', 'kick', songConfig, defaultInstrumentVisuals)
 * // → { glyph: 'euclidean-ring' } (from defaultInstrumentVisuals unless overridden)
 * ```
 */
export const resolveTrackVisual = (
  instrumentType: InstrumentType,
  trackName:      string,
  songConfig?:    SongVisualConfig,
  instrumentMap?: InstrumentVisualMap,
): TrackVisualDescriptor => {
  // 1. Song-level per-track override (keyed by variable name)
  const trackOverride = songConfig?.tracks?.[trackName]
  if (trackOverride !== undefined) return trackOverride

  // 2. Song-level per-instrument-type override
  const songTypeOverride = songConfig?.instruments?.[instrumentType]
  if (songTypeOverride !== undefined) return songTypeOverride

  // 3. Built-in instrument map default
  const mapDefault = instrumentMap?.[instrumentType]
  if (mapDefault !== undefined) return mapDefault

  // 4. Fallback — no visual descriptor
  return {}
}

/**
 * Resolves the display color for a track, wrapping modulo to stay in bounds.
 *
 * @param theme      - The active AppTheme.
 * @param trackIndex - 0-based track index (may exceed palette length).
 * @returns A CSS hex color string from `theme.tracks`.
 *
 * @example
 * ```ts
 * resolveTrackColor(darkPulseAppTheme, 0)   // → '#4a8fff'
 * resolveTrackColor(darkPulseAppTheme, 9)   // → wraps: theme.tracks[9 % 8]
 * ```
 */
export const resolveTrackColor = (
  theme:      AppTheme,
  trackIndex: number,
): string => theme.tracks[trackIndex % theme.tracks.length] ?? theme.accent
