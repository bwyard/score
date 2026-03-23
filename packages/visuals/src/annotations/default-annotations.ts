// default-annotations.ts — Default Monaco editor annotation source
// Maps AudioVisualState.tracks[i].pattern to editor gutter arcs.
// Registered as 'default' on index.ts import.

import { defineAnnotationSource } from '../registry.js'
import { darkPulseAppTheme } from '../app-theme.js'
import type { AudioVisualState, EditorAnnotationSet } from '../types.js'

/**
 * Default annotation source — derives Monaco editor gutter annotations from audio state.
 *
 * For each track that has a pattern, emits one EditorAnnotation with:
 * - `variableName`: track name (from TrackVisualState.name)
 * - `lineNumber`: from varMap lookup
 * - `trackIndex`: index in tracks array
 * - `pattern`: resolved step pattern
 * - `step`: current sequencer step
 * - `color`: from AppTheme.tracks[trackIndex]
 *
 * Returns an empty set if no tracks have patterns or if varMap is empty.
 *
 * @param state  - Current AudioVisualState.
 * @param varMap - Variable name → Monaco line number mapping.
 * @returns EditorAnnotationSet for all matched tracks.
 */
export const defaultAnnotationSource = defineAnnotationSource((
  state:  AudioVisualState,
  varMap: ReadonlyArray<{ readonly name: string; readonly lineNumber: number }>,
): EditorAnnotationSet => {
  if (varMap.length === 0) return []

  const varIndex = new Map(varMap.map(v => [v.name, v.lineNumber]))

  return state.tracks
    .filter(t => t.pattern !== undefined && t.pattern.length > 0)
    .flatMap((t, i) => {
      const lineNumber = varIndex.get(t.name)
      if (lineNumber === undefined) return []
      return [{
        variableName: t.name,
        lineNumber,
        trackIndex:   i,
        pattern:      t.pattern!,
        step:         state.step,
        color:        darkPulseAppTheme.tracks[i % darkPulseAppTheme.tracks.length] ?? darkPulseAppTheme.accent,
      }]
    })
})
