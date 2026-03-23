// registry.ts — Theme and annotation source registry
//
// This module is a side-effect BOUNDARY: registerTheme / registerAnnotationSource
// are the only mutable operations in @score/visuals. Everything else is pure.
//
// Import side effects: importing index.ts auto-registers all 10 built-in themes
// and the default annotation source.

import type { VisualThemeBundle, ThemeConfig, StudioMode } from './app-theme.js'
import type { AnnotationSource } from './types.js'

// ── Local error factory (avoids @score/core dep) ─────────────────────────────

const VisualsError = (message: string): Error => {
  const err = new Error(message)
  err.name = 'ScoreError'
  return err
}

// ── Theme registry ────────────────────────────────────────────────────────────
// BOUNDARY: this Map is the only mutable state in @score/visuals.

const themeRegistry = new Map<string, VisualThemeBundle>()

/**
 * Identity function marking a function as an intentional VisualThemeBundle.
 * Use when defining themes outside this package to get type checking.
 *
 * @param bundle - A VisualThemeBundle to mark as intentional.
 * @returns The same bundle unchanged.
 *
 * @example
 * ```ts
 * export const myTheme = defineTheme({ name: 'my-theme', appTheme, canvasTheme })
 * ```
 */
export const defineTheme = (bundle: VisualThemeBundle): VisualThemeBundle => bundle

/**
 * Registers a VisualThemeBundle under its name.
 * Overwrites any existing registration with the same name.
 *
 * @param bundle - The VisualThemeBundle to register.
 *
 * @example
 * ```ts
 * registerTheme(darkPulseBundle)
 * ```
 */
export const registerTheme = (bundle: VisualThemeBundle): void => {
  themeRegistry.set(bundle.name, bundle)
}

/**
 * Retrieves a registered VisualThemeBundle by name.
 *
 * @param name - The theme name to look up.
 * @returns The registered VisualThemeBundle.
 * @throws {ScoreError} If no theme with that name has been registered.
 *
 * @example
 * ```ts
 * const bundle = getTheme('lorenz')
 * ```
 */
export const getTheme = (name: string): VisualThemeBundle => {
  const bundle = themeRegistry.get(name)
  if (bundle === undefined) {
    throw VisualsError(
      `@score/visuals: theme '${name}' is not registered. ` +
      `Available themes: [${listThemes().join(', ')}]. ` +
      `Did you forget to import '@score/visuals'?`,
    )
  }
  return bundle
}

/**
 * Returns all registered theme names.
 *
 * @returns A readonly array of registered theme name strings.
 *
 * @example
 * ```ts
 * listThemes() // → ['dark-pulse', 'lorenz', 'neon-grid', ...]
 * ```
 */
export const listThemes = (): readonly string[] => [...themeRegistry.keys()]

/**
 * Resolves the active VisualThemeBundle for a given mode and config.
 * Pure function — reads registry via getTheme but does not mutate.
 *
 * Resolution order:
 * 1. `config.modes[mode]` — per-mode override if set
 * 2. `config.global` — global fallback
 *
 * @param config - The ThemeConfig (global + per-mode overrides).
 * @param mode   - The current StudioMode.
 * @returns The resolved VisualThemeBundle.
 * @throws {ScoreError} If neither the mode override nor the global theme is registered.
 *
 * @example
 * ```ts
 * const bundle = resolveTheme(defaultThemeConfig, 'performance')
 * // → lorenzBundle (per mode override)
 * ```
 */
export const resolveTheme = (config: ThemeConfig, mode: StudioMode): VisualThemeBundle => {
  const themeName = config.modes?.[mode] ?? config.global
  return getTheme(themeName)
}

// ── Annotation source registry ────────────────────────────────────────────────
// Parallel registry for Monaco editor annotation sources.

const annotationRegistry = new Map<string, AnnotationSource>()

/**
 * Identity function marking a function as an intentional AnnotationSource.
 *
 * @param fn - The AnnotationSource to mark.
 * @returns The same function unchanged.
 */
export const defineAnnotationSource = (fn: AnnotationSource): AnnotationSource => fn

/**
 * Registers an AnnotationSource under a name.
 *
 * @param name - Registry key (e.g. 'default').
 * @param fn   - The AnnotationSource to register.
 */
export const registerAnnotationSource = (name: string, fn: AnnotationSource): void => {
  annotationRegistry.set(name, fn)
}

/**
 * Retrieves a registered AnnotationSource by name.
 *
 * @param name - The annotation source name to look up.
 * @returns The registered AnnotationSource.
 * @throws {ScoreError} If no source with that name has been registered.
 */
export const getAnnotationSource = (name: string): AnnotationSource => {
  const fn = annotationRegistry.get(name)
  if (fn === undefined) {
    throw VisualsError(
      `@score/visuals: annotation source '${name}' is not registered. ` +
      `Did you forget to import '@score/visuals'?`,
    )
  }
  return fn
}
