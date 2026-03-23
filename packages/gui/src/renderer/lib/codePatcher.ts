// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the start char positions of every instrument block in the code string.
 *
 * Matches both styles:
 *   - Legacy:  `Track(Kick(` / `Track(Snare(` etc.
 *   - Const:   `= Kick(` / `= Snare(` etc. (named const instruments)
 *
 * The returned position always points to the START of the instrument function
 * call itself (e.g. `Kick(`, `Synth(`) so that `trackSlice` captures the
 * props block regardless of whether `Track(` wrapping is present.
 */
const findTrackPositions = (code: string): ReadonlyArray<number> => {
  const positions: number[] = []
  // Match Track(Kick( ... or = Kick( ... (with optional whitespace after =)
  // Capture group 1 is the instrument name position offset within the match.
  const re = /(?:Track\(|=\s*)(Kick|Snare|HiHat|Synth|Sample|Theremin|Sax|Arp)\s*\(/g
  let m
  while ((m = re.exec(code)) !== null) {
    // m.index is the start of `Track(` or `=`. We want the index of the
    // instrument name itself (the start of `Kick(`, `Synth(`, etc.).
    const fullMatch = m[0]
    const instrName = m[1] ?? ''
    // Find where the instrument name starts within the full match
    const nameOffset = fullMatch.lastIndexOf(instrName)
    positions.push(m.index + nameOffset)
  }
  return positions
}

/** Slice the code region belonging to trackIndex (from its Track( to the next or end). */
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
 * @param trackIndex - Zero-based track index (nth `Track(` in the code).
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
