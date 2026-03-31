// ── Types ──────────────────────────────────────────────────────────────────────

type TrackInfo = {
  readonly type:    string
  readonly pattern: ReadonlyArray<number | string>
}

/**
 * Character-level decoration range for a single inline beat highlight.
 * Targets the euclidean arg (e.g. the `4` in `Kick808(4)`) or the active
 * step element in an explicit `.pattern([...])` array.
 * All positions are 1-based (Monaco convention).
 */
export type InlineHighlight = {
  readonly line:     number
  readonly startCol: number
  readonly endCol:   number
}

type Props = {
  /** The full code string in the editor. */
  readonly code:        string
  /** Track list from the last successful eval. */
  readonly tracks:      ReadonlyArray<TrackInfo>
  /** Zero-based current sequencer step. */
  readonly currentStep: number
  /** Whether the transport is playing. */
  readonly playing:     boolean
  /**
   * Scroll position of the textarea in pixels. Must be kept in sync so the
   * line-highlight bands stay glued to the visible code lines as the user
   * scrolls. Pass `textarea.scrollTop` from the parent's onScroll handler.
   */
  readonly scrollTop:   number
}

// ── Track color map ───────────────────────────────────────────────────────────

const TRACK_COLORS: Record<string, string> = {
  kick:     '#c05a20',
  snare:    '#c02040',
  hihat:    '#208060',
  synth:    '#2060a0',
  arp:      '#6040a0',
  sample:   '#606060',
  theremin: '#406080',
  sax:      '#805020',
}
const TRACK_COLOR_DEFAULT = '#404040'

// ── Pure logic ────────────────────────────────────────────────────────────────

/**
 * Regex that matches instrument block lines in both styles:
 *   - Legacy:  lines containing `Track(`
 *   - Const:   lines containing `= Kick(` / `= Kick808(` / `= Snare(` etc.
 */
const TRACK_LINE_RE = /(?:Track\(|=\s*(?:Kick(?:808|909)?|Snare(?:909)?|HiHat(?:808)?|Hihat(?:808)?|Bass303|Pad|Rhodes|Pluck|Synth|Sample|Theremin|Sax|Arp|SubSynth|FMSynth)\s*\()/

/**
 * Returns `{ lineIndex, trackIndex }` pairs for each instrument line found in
 * the code. The i-th result corresponds to tracks[i].
 *
 * Used by the progress-bar renderer to know which track color to draw on which
 * line, independently of whether the track is currently hitting.
 *
 * @param code   - The raw code string from the editor.
 * @param tracks - Track descriptors from the last eval.
 * @returns Array of `{ lineIndex, trackIndex }` in source order.
 *
 * @example
 * ```ts
 * getTrackLines(code, tracks) // → [{ lineIndex: 4, trackIndex: 0 }, ...]
 * ```
 */
export const getTrackLines = (
  code:   string,
  tracks: ReadonlyArray<TrackInfo>,
): ReadonlyArray<{ lineIndex: number; trackIndex: number }> => {
  if (tracks.length === 0) return []

  const lines = code.split('\n')
  const trackLineIndices: number[] = []
  lines.forEach((line, i) => {
    if (TRACK_LINE_RE.test(line)) trackLineIndices.push(i)
  })

  const result: { lineIndex: number; trackIndex: number }[] = []
  tracks.forEach((_, i) => {
    const lineIdx = trackLineIndices[i]
    if (lineIdx !== undefined) {
      result.push({ lineIndex: lineIdx, trackIndex: i })
    }
  })
  return result
}

/**
 * Returns the 0-based line indices of tracks that are active at `currentStep`.
 *
 * Strategy: find all lines matching instrument declarations (both `Track(` and
 * `= Kick(` / `= Snare(` / etc. styles). The i-th such line corresponds to
 * `tracks[i]`. A track is active when its pattern entry at
 * `currentStep % pattern.length` is truthy.
 *
 * @param code        - The raw code string from the editor.
 * @param tracks      - Track descriptors from the last eval (type + pattern).
 * @param currentStep - Current sequencer step (zero-based).
 * @returns Sorted array of 0-based line indices to highlight.
 *
 * @example
 * ```ts
 * getActiveLines(code, tracks, 0) // → [5, 9] (line indices of active Track lines)
 * ```
 */
export const getActiveLines = (
  code:        string,
  tracks:      ReadonlyArray<TrackInfo>,
  currentStep: number,
): ReadonlyArray<number> => {
  if (tracks.length === 0) return []

  const lines = code.split('\n')

  // Find all 0-based line indices that contain an instrument declaration
  const trackLineIndices: number[] = []
  lines.forEach((line, i) => {
    if (TRACK_LINE_RE.test(line)) trackLineIndices.push(i)
  })

  const result: number[] = []
  tracks.forEach((track, i) => {
    const lineIdx = trackLineIndices[i]
    if (lineIdx === undefined) return
    const len = track.pattern.length
    if (len === 0) return
    const val = track.pattern[currentStep % len]
    // Active when truthy: 1 (beat) or a non-empty string (note)
    if (val) result.push(lineIdx)
  })

  return result.sort((a, b) => a - b)
}

/**
 * Returns the 1-based Monaco line range for the full instrument block at `trackIndex`.
 *
 * A block starts at the `const <name> = <Factory>(…)` declaration line and
 * extends through any contiguous chain lines (`.method(…)` continuations).
 * It ends just before the first blank line or the first line that starts a new
 * top-level statement (`const`, `export`, `import`, `Song`).
 *
 * @param code       - The raw code string from the editor.
 * @param trackIndex - Zero-based index into the tracks array.
 * @param tracks     - Track descriptors from the last eval.
 * @returns `{ startLine, endLine }` (both 1-based, Monaco convention), or
 *          `null` if the track has no corresponding declaration line.
 *
 * @example
 * ```ts
 * getBlockBounds(code, 0, tracks) // → { startLine: 4, endLine: 7 }
 * ```
 */
export const getBlockBounds = (
  code:       string,
  trackIndex: number,
  tracks:     ReadonlyArray<TrackInfo>,
): { readonly startLine: number; readonly endLine: number } | null => {
  const trackLineList = getTrackLines(code, tracks)
  const entry = trackLineList.find(t => t.trackIndex === trackIndex)
  if (!entry) return null

  const lines    = code.split('\n')
  const startIdx = entry.lineIndex   // 0-based

  // NEW_STATEMENT_RE — recognises the start of a top-level declaration that is
  // not a chain continuation.  Blank lines also terminate the block.
  const NEW_STATEMENT_RE = /^\s*(const|export|import|Song)\b/

  let endIdx = startIdx
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined || line.trim() === '') break       // blank line
    if (NEW_STATEMENT_RE.test(line)) break                   // new statement
    endIdx = i
  }

  return { startLine: startIdx + 1, endLine: endIdx + 1 }    // 1-based
}

/**
 * Returns step badge data for each instrument line — used to render `STEP/TOTAL`
 * pills in the Monaco editor via `after` inline decorations (t219).
 *
 * @param code             - Raw code string from the editor.
 * @param tracks           - Track descriptors from the last eval.
 * @param currentStep      - Current sequencer step (zero-based).
 * @param defaultStepCount - Fallback step count when a track has no pattern.
 * @returns Array of `{ line, step, total }` — `line` is 1-based (Monaco convention).
 *
 * @example
 * ```ts
 * getStepBadges(code, tracks, 3, 8) // → [{ line: 5, step: 3, total: 4 }, ...]
 * ```
 */
export const getStepBadges = (
  code:             string,
  tracks:           ReadonlyArray<TrackInfo>,
  currentStep:      number,
  defaultStepCount: number,
): ReadonlyArray<{ line: number; step: number; total: number }> => {
  if (tracks.length === 0) return []
  const trackLines = getTrackLines(code, tracks)
  return trackLines.map(({ lineIndex, trackIndex }) => {
    const track = tracks[trackIndex]
    if (!track) return null
    const total = track.pattern.length > 0 ? track.pattern.length : defaultStepCount
    return { line: lineIndex + 1, step: currentStep % total, total }
  }).filter((b): b is { line: number; step: number; total: number } => b !== null)
}

/**
 * Matches the numeric euclidean arg in a drum shorthand call — e.g. the `4`
 * in `Kick808(4)`. Only matches numeric args, not empty `()` or pitch strings.
 */
const EUCLIDEAN_ARG_RE = /(?:Kick(?:808|909)?|Snare(?:909)?|Hihat(?:808)?|HiHat(?:808)?|Sample)\s*\((\d+)\)/

/**
 * Returns character-level inline highlight ranges for the currently active
 * step across all tracks — used to render a Strudl-style inline playhead in
 * the Monaco editor.
 *
 * Strategy per track:
 *  - If the track block contains `.pattern([...])` → find the element at
 *    `currentStep % patternLength` and return its column range.
 *  - Otherwise (euclidean shorthand, e.g. `Kick808(4)`) → return the column
 *    range of the numeric arg inside the first `(N)` on the declaration line.
 *
 * Only tracks that are **active** at `currentStep` (i.e. their pattern value
 * is truthy) produce a highlight — passive steps return nothing.
 *
 * @param code        - Full DSL code string from the editor.
 * @param tracks      - Track descriptors from last successful eval.
 * @param currentStep - Current zero-based sequencer step.
 * @returns Array of column-level highlight ranges (1-based, Monaco convention).
 *
 * @example
 * ```ts
 * // const kick = Kick808(4).volume(0.8)   ← 4 hits, step 0 active
 * getActiveStepHighlight(code, tracks, 0)
 * // → [{ line: 3, startCol: 17, endCol: 18 }]  (highlights the `4`)
 * ```
 */
export const getActiveStepHighlight = (
  code:        string,
  tracks:      ReadonlyArray<TrackInfo>,
  currentStep: number,
): ReadonlyArray<InlineHighlight> => {
  if (tracks.length === 0) return []

  const lines         = code.split('\n')
  const trackLineList = getTrackLines(code, tracks)
  const result: InlineHighlight[] = []

  for (const { lineIndex, trackIndex } of trackLineList) {
    const track = tracks[trackIndex]
    if (!track) continue

    const patLen     = Math.max(track.pattern.length, 1)
    const activeStep = currentStep % patLen
    const val        = track.pattern[activeStep]

    // Only highlight the active (hitting) step
    if (!val) continue

    // ── Case 1: explicit .pattern([...]) ───────────────────────────────────
    // Search from the declaration line through the track's chain block
    const NEW_STATEMENT_RE = /^\s*(const|export|import|Song)\b/
    let patternLineIdx = -1
    let patternLine    = ''

    for (let i = lineIndex; i < lines.length; i++) {
      const ln = lines[i]
      if (ln === undefined || ln.trim() === '') break
      if (i > lineIndex && NEW_STATEMENT_RE.test(ln)) break
      if (ln.includes('.pattern([')) {
        patternLineIdx = i
        patternLine    = ln
        break
      }
    }

    if (patternLineIdx !== -1) {
      const patStart   = patternLine.indexOf('.pattern([')
      const arrayStart = patStart + '.pattern(['.length
      const arrayEnd   = patternLine.indexOf('])', arrayStart)
      if (arrayStart !== -1 && arrayEnd !== -1) {
        const arrayContent = patternLine.slice(arrayStart, arrayEnd)

        // Tokenise by commas, tracking per-element char positions
        const elements: Array<{ start: number; end: number }> = []
        let tokenStart = 0
        let inStr      = false

        for (let i = 0; i < arrayContent.length; i++) {
          const ch = arrayContent[i]
          if (ch === "'" || ch === '"') inStr = !inStr
          if (!inStr && ch === ',') {
            elements.push({ start: tokenStart, end: i })
            tokenStart = i + 1
          }
        }
        elements.push({ start: tokenStart, end: arrayContent.length })

        const el = elements[activeStep]
        if (el) {
          const raw      = arrayContent.slice(el.start, el.end)
          const trimLeft  = raw.length - raw.trimStart().length
          const trimRight = raw.length - raw.trimEnd().length
          const absStart  = arrayStart + el.start + trimLeft
          const absEnd    = arrayStart + el.end   - trimRight

          result.push({
            line:     patternLineIdx + 1,   // 1-based
            startCol: absStart + 1,          // 1-based
            endCol:   absEnd   + 1,
          })
          continue
        }
      }
    }

    // ── Case 2: euclidean shorthand ─────────────────────────────────────────
    // Highlight the numeric arg — e.g. the `4` in `Kick808(4)`.
    const declLine = lines[lineIndex]
    if (!declLine) continue

    const m = EUCLIDEAN_ARG_RE.exec(declLine)
    if (!m) continue

    // Locate the `(N)` within the full match to get exact column
    const parenOpen  = declLine.indexOf('(', m.index)
    const parenClose = declLine.indexOf(')', parenOpen)
    if (parenOpen === -1 || parenClose <= parenOpen + 1) continue

    result.push({
      line:     lineIndex + 1,
      startCol: parenOpen  + 2,    // skip `(`, 1-based
      endCol:   parenClose + 1,    // 1-based, exclusive
    })
  }

  return result
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CodeHighlight — mirror-div overlay that highlights active beat lines and
 * renders per-track cycle progress bars (Strudel-like tracking).
 *
 * Renders as a `position: absolute` div with `z-index: 1`, placed between the
 * CodeWaveform canvas (z-index 0) and the textarea (z-index 2). It mirrors the
 * textarea font metrics and line-height so highlight bands align precisely with
 * code lines.
 *
 * Active-beat highlights (blue glow) are shown only on hits.
 * Progress bars sweep left→right continuously while playing.
 * Both clear when transport stops.
 *
 * @param code        - The raw code string (must match textarea value exactly).
 * @param tracks      - Track list from the last eval, for pattern lookup.
 * @param currentStep - Current sequencer step from the engine.
 * @param playing     - Whether the transport is rolling.
 * @param scrollTop   - Textarea scroll offset — sync via onScroll so highlights track with code.
 *
 * @example
 * ```tsx
 * // In editorArea (position: relative):
 * <CodeWaveform waveform={waveform} playing={playing} />  // z-index 0
 * <CodeHighlight code={code} tracks={tracks} currentStep={step} playing={playing} scrollTop={scrollTop} />  // z-index 1
 * <textarea onScroll={e => setScrollTop(e.target.scrollTop)} style={{ position: 'relative', zIndex: 2, background: 'transparent' }} />
 * ```
 */
export const CodeHighlight = ({ code, tracks, currentStep, playing, scrollTop }: Props) => {
  const activeLines = playing ? getActiveLines(code, tracks, currentStep) : []
  const trackLines  = playing ? getTrackLines(code, tracks) : []

  if (activeLines.length === 0 && trackLines.length === 0) return null

  const lines = code.split('\n')

  // Build a map from lineIndex → trackIndex for progress bars
  const lineToTrack = new Map<number, number>()
  trackLines.forEach(({ lineIndex, trackIndex }) => {
    lineToTrack.set(lineIndex, trackIndex)
  })

  return (
    <div aria-hidden="true" style={styles.overlay}>
      {/* Translate inner content by -scrollTop to stay glued to code lines */}
      <div style={{ transform: `translateY(-${String(scrollTop)}px)` }}>
      {lines.map((_, idx) => {
        const isActive = activeLines.includes(idx)
        const trackIdx = lineToTrack.get(idx)
        const hasBar   = trackIdx !== undefined

        if (!isActive && !hasBar) {
          return <div key={idx} style={styles.line} />
        }

        const track    = trackIdx !== undefined ? tracks[trackIdx] : undefined
        const patLen   = track ? Math.max(track.pattern.length, 1) : 1
        const progress = hasBar ? (currentStep % patLen) / patLen : 0
        const color    = hasBar
          ? (TRACK_COLORS[track?.type ?? ''] ?? TRACK_COLOR_DEFAULT)
          : TRACK_COLOR_DEFAULT

        return (
          <div
            key={idx}
            style={{ ...styles.line, position: 'relative', overflow: 'hidden' }}
          >
            {hasBar && (
              <>
                {/* Full-height cycle fill — sweeps left→right like Strudel */}
                <div style={{
                  position:   'absolute',
                  top: 0, left: 0, bottom: 0,
                  width:      `${String(progress * 100)}%`,
                  background: color,
                  opacity:    isActive ? 0.22 : 0.07,
                  transition: 'width 0.05s linear, opacity 0.05s',
                  pointerEvents: 'none',
                }} />
                {/* Cursor line — thin bright edge at current cycle position */}
                <div style={{
                  position:   'absolute',
                  top: 0, bottom: 0,
                  left:       `${String(progress * 100)}%`,
                  width:      '2px',
                  background: color,
                  opacity:    isActive ? 0.9 : 0.45,
                  transition: 'left 0.05s linear',
                  pointerEvents: 'none',
                }} />
                {/* Step badge — "3/8" showing current step in pattern */}
                <div style={{
                  position:   'absolute',
                  top:        '50%',
                  right:      '4px',
                  transform:  'translateY(-50%)',
                  fontSize:   '0.55rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  color,
                  opacity:    isActive ? 0.9 : 0.35,
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}>
                  {`${String((currentStep % patLen) + 1)}/${String(patLen)}`}
                </div>
              </>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position:      'absolute' as const,
    inset:         0,
    pointerEvents: 'none' as const,
    zIndex:        1,
    // Match textarea padding exactly
    padding:       '0.75rem',
    boxSizing:     'border-box' as const,
  },
  line: {
    // Must match textarea: fontFamily, fontSize, lineHeight
    fontFamily:  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize:    '0.8rem',
    lineHeight:  1.65,
    height:      'calc(0.8rem * 1.65)',
    width:       '100%',
    borderRadius: '2px',
  },
} as const
