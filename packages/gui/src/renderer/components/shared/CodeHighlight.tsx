// ── Types ──────────────────────────────────────────────────────────────────────

type TrackInfo = {
  readonly type:    string
  readonly pattern: ReadonlyArray<number | string>
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
 *   - Const:   lines containing `= Kick(` / `= Snare(` / `= HiHat(` etc.
 */
const TRACK_LINE_RE = /(?:Track\(|=\s*(?:Kick|Snare|HiHat|Synth|Sample|Theremin|Sax|Arp)\s*\()/

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
      <div style={{ transform: `translateY(-${scrollTop}px)` }}>
      {lines.map((_, idx) => {
        const isActive = activeLines.includes(idx)
        const trackIdx = lineToTrack.get(idx)
        const hasBar   = trackIdx !== undefined

        if (!isActive && !hasBar) {
          return <div key={idx} style={styles.line} />
        }

        const track    = hasBar ? tracks[trackIdx!] : undefined
        const patLen   = track ? Math.max(track.pattern.length, 1) : 1
        const progress = hasBar
          ? (currentStep % patLen) / patLen
          : 0
        const color    = hasBar
          ? (TRACK_COLORS[tracks[trackIdx!]!.type] ?? TRACK_COLOR_DEFAULT)
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
                  width:      `${progress * 100}%`,
                  background: color,
                  opacity:    isActive ? 0.22 : 0.07,
                  transition: 'width 0.05s linear, opacity 0.05s',
                  pointerEvents: 'none',
                }} />
                {/* Cursor line — thin bright edge at current cycle position */}
                <div style={{
                  position:   'absolute',
                  top: 0, bottom: 0,
                  left:       `${progress * 100}%`,
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
                  {`${(currentStep % patLen) + 1}/${patLen}`}
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
