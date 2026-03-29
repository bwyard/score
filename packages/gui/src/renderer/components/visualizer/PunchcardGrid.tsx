import { memo, useRef, useEffect, useState, useId, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

export type PunchcardTrack = {
  readonly name:    string
  readonly type:    string
  readonly pattern: ReadonlyArray<number | string>
}

type ActiveCell = {
  readonly track: number
  readonly step:  number
}

type Props = {
  readonly tracks:        ReadonlyArray<PunchcardTrack>
  readonly currentStep:   number
  readonly stepCount:     number
  readonly onStepClick?:  (trackIndex: number, stepIndex: number) => void
  /** Called when a track label (left column) is clicked — opens the instrument editor for that track. */
  readonly onLabelClick?: (trackIndex: number) => void
  /** Which track index is currently selected (shows edit highlight on label). */
  readonly selectedTrack?: number | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BG_COLOR         = '#080809'
const ROW_HEIGHT       = 28
const ROW_GAP          = 2
const LABEL_WIDTH      = 52   // track name text column
const STRIP_WIDTH      = 4    // colour accent strip inside label area
const CELL_GAP         = 1

const STRIP_COLOR: Record<string, string> = {
  kick:    '#c05a20',
  kick808: '#c05a20',
  kick909: '#d04010',
  snare:   '#c02040',
  snare909:'#c02040',
  hihat:   '#208060',
  hihat808:'#208060',
  bass303: '#9040c0',
  synth:   '#2060a0',
  subsynth:'#2060a0',
  fmsynth: '#1a50c0',
  pad:     '#206080',
  pluck:   '#208060',
  arp:     '#6040a0',
  sample:  '#606060',
}
const STRIP_DEFAULT = '#404040'

const CELL_ACTIVE          = '#2a4a6a'
const CELL_INACTIVE        = '#111115'
const CURSOR_OVERLAY       = '#4a8fff22'
const CURSOR_OVERLAY_FLASH = '#6aafff44'
const CURSOR_ACTIVE        = '#4a8fff'
const CURSOR_INACTIVE      = '#1a2a3a'
const EMPTY_COLOR          = '#2a3a4a'
const FLASH_DURATION_MS    = 80

// ── Drawing helpers ────────────────────────────────────────────────────────────

const resolveStripColor = (type: string): string =>
  STRIP_COLOR[type] ?? STRIP_DEFAULT

const isActive = (value: number | string): boolean =>
  value !== 0 && value !== ''

const drawGrid = (
  ctx:           CanvasRenderingContext2D,
  tracks:        ReadonlyArray<PunchcardTrack>,
  currentStep:   number,
  stepCount:     number,
  width:         number,
  height:        number,
  flash:         boolean,
  selectedTrack: number | null | undefined,
  activeCell:    ActiveCell | null,
): void => {
  // Background
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, width, height)

  if (tracks.length === 0) {
    ctx.fillStyle    = EMPTY_COLOR
    ctx.font         = '12px monospace'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Waiting for song\u2026', width / 2, height / 2)
    return
  }

  const cellAreaWidth = width - LABEL_WIDTH
  const cellWidth     = (cellAreaWidth - (stepCount - 1) * CELL_GAP) / stepCount

  // Draw each track row
  tracks.forEach((track, rowIndex) => {
    const rowY       = rowIndex * (ROW_HEIGHT + ROW_GAP)
    const trackLen   = track.pattern.length > 0 ? track.pattern.length : stepCount
    // Per-track cursor: wrap currentStep within this track's pattern length.
    // Shorter patterns loop — an 8-step kick repeats in a 16-step grid.
    const localStep  = currentStep % trackLen

    // Label area background — highlighted blue tint when this track is selected
    const isSelected = selectedTrack === rowIndex
    ctx.fillStyle = isSelected ? '#0e1a2e' : '#0a0a0c'
    ctx.fillRect(0, rowY, LABEL_WIDTH, ROW_HEIGHT)

    // Colour accent strip
    ctx.fillStyle = resolveStripColor(track.type)
    ctx.fillRect(0, rowY, STRIP_WIDTH, ROW_HEIGHT)

    // Edit affordance arrow on selected row
    if (isSelected) {
      ctx.fillStyle = '#4a8fff'
      ctx.font      = '8px monospace'
      ctx.textAlign = 'right'
      ctx.fillText('▸', LABEL_WIDTH - 2, rowY + ROW_HEIGHT / 2)
    }

    // Track name text
    ctx.fillStyle    = isSelected ? '#8ab8ff' : '#5a6a7a'
    ctx.font         = '9px monospace'
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'middle'
    const label = track.name.length > 5 ? track.name.slice(0, 5) : track.name
    ctx.fillText(label.toUpperCase(), STRIP_WIDTH + 4, rowY + ROW_HEIGHT / 2)

    // Step cells — loop pattern if track is shorter than stepCount
    Array.from({ length: stepCount }, (_, step) => {
      const cellX      = LABEL_WIDTH + step * (cellWidth + CELL_GAP)
      const patternIdx = step % trackLen
      const isCurrent  = (step % trackLen) === localStep
      const active     = isActive(track.pattern[patternIdx] ?? 0)

      // Draw loop-boundary marker: subtle divider at pattern repeat points
      if (step > 0 && step % trackLen === 0) {
        ctx.fillStyle = '#2a2a36'
        ctx.fillRect(cellX - CELL_GAP, rowY, CELL_GAP, ROW_HEIGHT)
      }

      const color = isCurrent
        ? (active ? CURSOR_ACTIVE : CURSOR_INACTIVE)
        : (active ? CELL_ACTIVE   : CELL_INACTIVE)

      ctx.fillStyle = color
      ctx.fillRect(cellX, rowY, cellWidth, ROW_HEIGHT)
    })
  })

  // Cursor column overlay — global cursor at the raw currentStep position,
  // clipped to stepCount. Shows the transport position across the full grid.
  const globalCursorStep = currentStep < stepCount ? currentStep : currentStep % stepCount
  const cursorX          = LABEL_WIDTH + globalCursorStep * (cellWidth + CELL_GAP)
  const totalHeight      = tracks.length * (ROW_HEIGHT + ROW_GAP) - ROW_GAP

  ctx.fillStyle = flash ? CURSOR_OVERLAY_FLASH : CURSOR_OVERLAY
  ctx.fillRect(cursorX, 0, cellWidth, totalHeight)

  // Active keyboard cell — bright outline for keyboard focus navigation
  if (activeCell !== null && activeCell.track < tracks.length) {
    const activeCellRowY = activeCell.track * (ROW_HEIGHT + ROW_GAP)
    const activeCellX    = LABEL_WIDTH + activeCell.step * (cellWidth + CELL_GAP)
    ctx.strokeStyle      = '#ffffff'
    ctx.lineWidth        = 1.5
    ctx.strokeRect(activeCellX + 0.75, activeCellRowY + 0.75, cellWidth - 1.5, ROW_HEIGHT - 1.5)
  }
}

// ── Visually-hidden style (screen reader only) ─────────────────────────────────

const srOnlyStyle: React.CSSProperties = {
  position: 'absolute',
  width:    1,
  height:   1,
  padding:  0,
  margin:   -1,
  overflow: 'hidden',
  clip:     'rect(0,0,0,0)',
  border:   0,
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Canvas-based punchcard grid visualizer for Score Studio.
 * Renders one row per track, with step cells and a playhead cursor column.
 * Fully keyboard-navigable: arrow keys move the active cell, Space/Enter
 * toggle the selected step, Escape returns focus to the parent.
 *
 * @param tracks      - Array of tracks to display, each with a step pattern.
 * @param currentStep - Zero-based index of the currently playing step.
 * @param stepCount   - Total number of steps per bar (typically 16).
 *
 * @example
 * ```tsx
 * <PunchcardGrid
 *   tracks={[{ name: 'Kick', type: 'kick', pattern: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] }]}
 *   currentStep={4}
 *   stepCount={16}
 * />
 * ```
 */
const PunchcardGridInner = ({ tracks, currentStep, stepCount, onStepClick, onLabelClick, selectedTrack }: Props) => {
  const canvasRef                     = useRef<HTMLCanvasElement>(null)
  const [flash,      setFlash]        = useState(false)
  const [activeCell, setActiveCell]   = useState<ActiveCell | null>(null)
  const descId                        = useId()

  // Beat flash: pulse on step 0
  useEffect(() => {
    if (currentStep !== 0) return
    setFlash(true)
    const id = setTimeout(() => { setFlash(false); }, FLASH_DURATION_MS)
    return () => { clearTimeout(id); }
  }, [currentStep])

  // Canvas redraw
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    const dpr    = window.devicePixelRatio
    const width  = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width  = Math.round(width  * dpr)
    canvas.height = Math.round(height * dpr)

    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    ctx.scale(dpr, dpr)
    drawGrid(ctx, tracks, currentStep, stepCount, width, height, flash, selectedTrack, activeCell)
  }, [tracks, currentStep, stepCount, flash, selectedTrack, activeCell])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const trackIndex = Math.floor(y / (ROW_HEIGHT + ROW_GAP))
    if (trackIndex < 0 || trackIndex >= tracks.length) return

    if (x < LABEL_WIDTH) {
      onLabelClick?.(trackIndex)
      return
    }

    if (!onStepClick) return
    const track = tracks[trackIndex]
    if (!track) return
    const trackLen = track.pattern.length > 0 ? track.pattern.length : stepCount
    const cellAreaWidth = canvas.clientWidth - LABEL_WIDTH
    const cellWidth = (cellAreaWidth - (trackLen - 1) * CELL_GAP) / trackLen

    const stepIndex = Math.floor((x - LABEL_WIDTH) / (cellWidth + CELL_GAP))
    if (stepIndex < 0 || stepIndex >= trackLen) return

    onStepClick(trackIndex, stepIndex)
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>): void => {
    if (tracks.length === 0) return

    // Initialise active cell on first keypress if none is set
    const current: ActiveCell = activeCell ?? { track: 0, step: 0 }

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault()
        const rightTrack    = tracks[current.track]
        const rightTrackLen = rightTrack
          ? (rightTrack.pattern.length > 0 ? rightTrack.pattern.length : stepCount)
          : stepCount
        setActiveCell({ track: current.track, step: (current.step + 1) % rightTrackLen })
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        const leftTrack    = tracks[current.track]
        const leftTrackLen = leftTrack
          ? (leftTrack.pattern.length > 0 ? leftTrack.pattern.length : stepCount)
          : stepCount
        setActiveCell({ track: current.track, step: (current.step - 1 + leftTrackLen) % leftTrackLen })
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const nextTrack     = Math.min(current.track + 1, tracks.length - 1)
        const nextTrackData = tracks[nextTrack]
        const nextLen       = nextTrackData
          ? (nextTrackData.pattern.length > 0 ? nextTrackData.pattern.length : stepCount)
          : stepCount
        setActiveCell({ track: nextTrack, step: Math.min(current.step, nextLen - 1) })
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prevTrack     = Math.max(current.track - 1, 0)
        const prevTrackData = tracks[prevTrack]
        const prevLen       = prevTrackData
          ? (prevTrackData.pattern.length > 0 ? prevTrackData.pattern.length : stepCount)
          : stepCount
        setActiveCell({ track: prevTrack, step: Math.min(current.step, prevLen - 1) })
        break
      }
      case 'Home': {
        e.preventDefault()
        setActiveCell({ track: current.track, step: 0 })
        break
      }
      case 'End': {
        e.preventDefault()
        const endTrack    = tracks[current.track]
        const endTrackLen = endTrack
          ? (endTrack.pattern.length > 0 ? endTrack.pattern.length : stepCount)
          : stepCount
        setActiveCell({ track: current.track, step: endTrackLen - 1 })
        break
      }
      case ' ':
      case 'Enter': {
        e.preventDefault()
        if (onStepClick) {
          onStepClick(current.track, current.step)
        }
        break
      }
      case 'Escape': {
        setActiveCell(null)
        canvasRef.current?.blur()
        break
      }
      default:
        break
    }
  }, [activeCell, tracks, stepCount, onStepClick])

  const handleFocus = useCallback((): void => {
    if (activeCell === null && tracks.length > 0) {
      setActiveCell({ track: 0, step: 0 })
    }
  }, [activeCell, tracks.length])

  const handleBlur = useCallback((): void => {
    setActiveCell(null)
  }, [])

  const canvasHeight =
    tracks.length === 0
      ? 60
      : tracks.length * (ROW_HEIGHT + ROW_GAP) - ROW_GAP

  const ariaLabel =
    tracks.length === 0
      ? 'Punchcard sequencer grid, empty'
      : `Punchcard sequencer grid, ${String(tracks.length)} tracks, ${String(stepCount)} steps`

  return (
    <div style={{ display: 'contents' }}>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label={ariaLabel}
        aria-describedby={descId}
        tabIndex={0}
        onClick={onStepClick ?? onLabelClick ? handleClick : undefined}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width:          '100%',
          height:         `${String(canvasHeight)}px`,
          display:        'block',
          imageRendering: 'pixelated',
          cursor:         onStepClick ? 'pointer' : 'default',
        }}
      />
      <span id={descId} style={srOnlyStyle}>
        Use arrow keys to navigate steps. Space or Enter to toggle a step.
        Home moves to the first step, End to the last.
        Escape returns focus to the main content.
      </span>
    </div>
  )
}

/** Canvas punchcard grid — memoized to prevent re-renders at display tick rate. */
export const PunchcardGrid = memo(PunchcardGridInner)
