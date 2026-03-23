// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the start char positions of every instrument block in the code string.
 *
 * Matches both styles:
 *   - Legacy:  `Track(Kick(` / `Track(Synth(` etc.
 *   - Const:   `= Kick(` / `= Bass303(` etc. (named const instruments, chain API)
 *
 * Accepts any PascalCase name (e.g. `Bass303`, `FMSynth`, `KarplusSynth`) so the
 * full chain API instrument set is covered without a hard-coded allowlist.
 * `Song` and `Track` are explicitly excluded to avoid false matches.
 *
 * The returned position always points to the START of the instrument function
 * call itself (e.g. `Kick(`, `Bass303(`) so that `trackSlice` captures the
 * full region regardless of wrapping style.
 */
const findTrackPositions = (code: string): ReadonlyArray<number> => {
  // Match Track(AnyInstrument( ... or = AnyInstrument( ... (with optional whitespace)
  // Accepts any PascalCase name so the full chain API instrument set is covered.
  // Song and Track are excluded to avoid false matches.
  const re = /(?:Track\(|=\s*)([A-Z][A-Za-z0-9]*)\s*\(/g
  return Array.from(code.matchAll(re))
    .filter(m => {
      const instrName = m[1] ?? ''
      return instrName !== 'Song' && instrName !== 'Track'
    })
    .map(m => {
      const fullMatch = m[0]
      const instrName = m[1] ?? ''
      const nameOffset = fullMatch.lastIndexOf(instrName)
      return m.index + nameOffset
    })
}

/** Slice the code region belonging to trackIndex (from its instrument call to the next or end). */
const trackSlice = (code: string, trackIndex: number): { start: number; end: number } | null => {
  const positions = findTrackPositions(code)
  const start = positions[trackIndex]
  if (start === undefined) return null
  const end = positions[trackIndex + 1] ?? code.length
  return { start, end }
}

// ── Exported pure patch functions ─────────────────────────────────────────────

/**
 * Replace the bpm value in the song code.
 * Finds the first `bpm: <number>` and replaces the number.
 *
 * @param code   - Full DSL code string.
 * @param newBpm - New BPM value.
 * @returns Patched code string, or original if `bpm:` is not found.
 *
 * @example
 * ```ts
 * patchBpm('Song({ bpm: 128, tracks: [] })', 140)
 * // → 'Song({ bpm: 140, tracks: [] })'
 * ```
 */
export const patchBpm = (code: string, newBpm: number): string =>
  code.replace(/\bbpm:\s*\d+(?:\.\d+)?/, `bpm: ${String(newBpm)}`)

/**
 * Replace a single step value in the pattern array of the given track.
 * Pattern must be on a single line as `pattern: [1, 0, 0, 0]`.
 *
 * @param code       - Full DSL code string.
 * @param trackIndex - Zero-based track index (nth instrument declaration in the code).
 * @param stepIndex  - Zero-based step index within the pattern array.
 * @param value      - New step value (typically 0 or 1).
 * @returns Patched code string, or original if target is not found.
 *
 * @example
 * ```ts
 * // Toggle step 2 of track 0 on
 * patchTrackPattern(code, 0, 2, 1)
 * ```
 */
export const patchTrackPattern = (
  code:       string,
  trackIndex: number,
  stepIndex:  number,
  value:      number,
): string => {
  const region = trackSlice(code, trackIndex)
  if (!region) return code
  const { start, end } = region
  const slice = code.slice(start, end)

  const m = /pattern:\s*\[([^\]]*)\]/.exec(slice)
  if (!m) return code

  const items = (m[1] ?? '').split(',').map(s => s.trim())
  if (stepIndex < 0 || stepIndex >= items.length) return code
  items[stepIndex] = String(value)

  const newChunk = `pattern: [${items.join(', ')}]`
  const newSlice = slice.slice(0, m.index) + newChunk + slice.slice(m.index + m[0].length)
  return code.slice(0, start) + newSlice + code.slice(end)
}

/**
 * Replace the volume value for the given track.
 * Matches the first `volume: <number>` within the track's region.
 *
 * @param code       - Full DSL code string.
 * @param trackIndex - Zero-based track index.
 * @param volume     - New volume in [0, 1].
 * @returns Patched code string, or original if `volume:` is not found in the track.
 *
 * @example
 * ```ts
 * patchTrackVolume(code, 0, 0.5)
 * ```
 */
export const patchTrackVolume = (
  code:       string,
  trackIndex: number,
  volume:     number,
): string => {
  const region = trackSlice(code, trackIndex)
  if (!region) return code
  const { start, end } = region
  const slice = code.slice(start, end)

  const m = /\bvolume:\s*\d+(?:\.\d+)?/.exec(slice)
  if (!m) return code

  // Round to 2 decimal places, strip trailing zeros
  const formatted = String(Math.round(volume * 100) / 100)
  const newSlice = slice.slice(0, m.index) + `volume: ${formatted}` + slice.slice(m.index + m[0].length)
  return code.slice(0, start) + newSlice + code.slice(end)
}

/**
 * Replace a note at the given index in the notes array of the given track.
 * Targets `notes: ['C3', 'E3', ...]` within the track's code region.
 *
 * @param code       - Full DSL code string.
 * @param trackIndex - Zero-based track index.
 * @param noteIndex  - Zero-based index in the notes array.
 * @param note       - New note name (e.g. `'D4'`).
 * @returns Patched code string, or original if `notes:` is not found.
 *
 * @example
 * ```ts
 * patchTrackNote(code, 4, 1, 'F3')  // change Arp note at index 1 to F3
 * ```
 */
export const patchTrackNote = (
  code:       string,
  trackIndex: number,
  noteIndex:  number,
  note:       string,
): string => {
  const region = trackSlice(code, trackIndex)
  if (!region) return code
  const { start, end } = region
  const slice = code.slice(start, end)

  const m = /notes:\s*\[([^\]]*)\]/.exec(slice)
  if (!m) return code

  const items = (m[1] ?? '').split(',').map(s => s.trim())
  if (noteIndex < 0 || noteIndex >= items.length) return code
  items[noteIndex] = `'${note}'`

  const newChunk = `notes: [${items.join(', ')}]`
  const newSlice = slice.slice(0, m.index) + newChunk + slice.slice(m.index + m[0].length)
  return code.slice(0, start) + newSlice + code.slice(end)
}

/**
 * Update or append a chain method call on the given track's instrument line.
 *
 * Designed for the chain API style:
 * ```
 * const kick = Kick808().pattern([1,0,0,0]).volume(0.6)
 * const bass = Bass303('C2').cutoff(600).volume(0.8)
 * ```
 *
 * - If `.method(...)` already exists in the track's region, its argument(s) are
 *   replaced with the new value.
 * - If the method is not present, `.method(value)` is appended to the last line
 *   of the track's chain expression (before the next `const` or `export default`).
 *
 * Number values are formatted to at most 3 decimal places.
 * String values are wrapped in single quotes.
 *
 * @param code       - Full DSL code string.
 * @param trackIndex - Zero-based track index.
 * @param method     - Chain method name without leading dot (e.g. `'volume'`, `'reverb'`).
 * @param value      - New argument value.
 * @returns Patched code string, or original if the track is not found.
 *
 * @example
 * ```ts
 * patchChainMethod(code, 0, 'volume', 0.8)
 * // Kick808().pattern([1,0,0,0]).volume(0.6) → .volume(0.8)
 *
 * patchChainMethod(code, 1, 'reverb', 0.3)
 * // Bass303('C2').volume(0.8) → .volume(0.8).reverb(0.3)  (appended)
 * ```
 */
export const patchChainMethod = (
  code:       string,
  trackIndex: number,
  method:     string,
  value:      number | string,
): string => {
  const region = trackSlice(code, trackIndex)
  if (!region) return code
  const { start, end } = region
  const slice = code.slice(start, end)

  const formatted =
    typeof value === 'string'
      ? `'${value}'`
      : String(Math.round(value * 1000) / 1000)

  // Try to find and replace an existing .method(...) call in the slice
  const methodRe = new RegExp(`\\.${method}\\([^)]*\\)`)
  if (methodRe.test(slice)) {
    const newSlice = slice.replace(methodRe, `.${method}(${formatted})`)
    return code.slice(0, start) + newSlice + code.slice(end)
  }

  // Method not present — append it to the last non-empty line of the region
  // that belongs to this track's chain (before next const/export default).
  const lines = slice.split('\n')
  // Slice up to the first next-track or export boundary, then find last non-empty line.
  const stopIdx = lines.findIndex(ln =>
    ln.trim().startsWith('const ') || ln.trim().startsWith('export '))
  const regionLines = stopIdx === -1 ? lines : lines.slice(0, stopIdx)
  const insertLineIdx = regionLines.reduce((acc, ln, i) =>
    ln.trim().length > 0 ? i : acc, 0)

  const patched = lines.map((ln, i) =>
    i === insertLineIdx ? ln + `.${method}(${formatted})` : ln)
  return code.slice(0, start) + patched.join('\n') + code.slice(end)
}

/**
 * Insert a new instrument `const` declaration before `export default Song(` and
 * append the variable name to the Song's `tracks` array.
 *
 * @param code           - Full DSL code string.
 * @param varName        - Variable name to declare (e.g. `'pad'`).
 * @param instrumentLine - The full instrument expression (e.g. `"Pad('Am').reverb(0.3)"`).
 * @returns Patched code string, or original if `export default Song(` is not found.
 *
 * @example
 * ```ts
 * patchAddInstrument(code, 'pad', "Pad('Am').reverb(0.3).volume(0.6)")
 * // Inserts: const pad = Pad('Am').reverb(0.3).volume(0.6)
 * // Updates: tracks: [kick, snare] → tracks: [kick, snare, pad]
 * ```
 */
export const patchAddInstrument = (
  code:           string,
  varName:        string,
  instrumentLine: string,
): string => {
  // Find the export default Song( line
  const exportIdx = code.indexOf('export default Song(')
  if (exportIdx === -1) return code

  // Insert const declaration on the line before export default
  const newConst = `const ${varName} = ${instrumentLine}\n`
  const withConst = code.slice(0, exportIdx) + newConst + code.slice(exportIdx)

  // Now find the tracks array and append varName.
  // Handles: tracks: [kick, snare] and tracks: [\n  kick,\n  snare\n]
  const tracksMatch = /\btracks\s*:\s*\[([^\]]*)\]/s.exec(withConst)
  if (!tracksMatch) return withConst

  const inner = tracksMatch[1] ?? ''
  const trimmed = inner.trimEnd()

  // Detect indentation style from existing entries
  const lastCommaOrBracket = trimmed.lastIndexOf('\n')
  const indent = lastCommaOrBracket !== -1
    ? trimmed.slice(lastCommaOrBracket + 1).match(/^\s*/)?.[0] ?? '  '
    : ' '

  // Build the replacement: append varName with matching style.
  // If existing entries already use trailing commas (e.g. `bass,\n`) avoid
  // adding a second comma; also add a trailing comma to varName for consistency.
  const hasNewlines    = inner.includes('\n')
  const trailingComma  = trimmed.endsWith(',')
  const newInner = hasNewlines
    ? trailingComma
      ? `${trimmed}\n${indent}${varName},\n`
      : `${trimmed},\n${indent}${varName}\n`
    : `${trimmed}, ${varName}`

  const matchStart = tracksMatch.index + tracksMatch[0].indexOf('[') + 1
  const matchEnd   = matchStart + inner.length
  return withConst.slice(0, matchStart) + newInner + withConst.slice(matchEnd)
}
