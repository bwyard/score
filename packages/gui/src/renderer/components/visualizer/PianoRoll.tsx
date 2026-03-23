import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * A single note event displayed in the PianoRoll.
 */
export type PianoRollNote = {
  /** MIDI note number, 0–127. */
  readonly pitch:    number
  /** Zero-based step index the note falls on. */
  readonly step:     number
  /** Normalised velocity, 0–1. */
  readonly velocity: number
  /** Duration of the note in steps (1 = one step). */
  readonly duration: number
}

type Props = {
  /** Notes to render in the roll. */
  readonly notes:        ReadonlyArray<PianoRollNote>
  /** Zero-based index of the currently playing step. */
  readonly currentStep:  number
  /** Total number of steps in the sequence. */
  readonly stepCount:    number
  /** Lowest MIDI note shown. Defaults to auto-detected from notes, or 48 (C3). */
  readonly minNote?:     number
  /** Highest MIDI note shown. Defaults to auto-detected from notes, or 72 (C5). */
  readonly maxNote?:     number
  /** Called when the user clicks a cell — pitch is MIDI note number, step is zero-based. */
  readonly onNoteClick?: (pitch: number, step: number) => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BG_COLOR           = '#080809'
const EMPTY_TEXT_COLOR   = '#2a3a4a'
const ROW_HEIGHT         = 14
const PIANO_STRIP_WIDTH  = 12

const ROW_OCTAVE_BOUND   = '#0f0f14'   // note % 12 === 0
const ROW_BLACK_KEY      = '#0b0b0f'   // sharps
const ROW_WHITE_KEY      = '#0e0e13'   // naturals

const NOTE_NORMAL        = '#4a8fff'
const NOTE_CURRENT       = '#6aafff'

const CURSOR_OVERLAY     = '#4a8fff18'
const CURSOR_LINE        = '#4a8fff66'

const PIANO_WHITE_KEY    = '#1a1a22'
const PIANO_BLACK_KEY    = '#0a0a0f'

const BLACK_KEY_OFFSETS  = new Set([1, 3, 6, 8, 10])

const DEFAULT_MIN_NOTE   = 48
const DEFAULT_MAX_NOTE   = 72

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the MIDI note number corresponds to a black key. */
const isBlackKey = (note: number): boolean =>
  BLACK_KEY_OFFSETS.has(note % 12)

/** Resolves the row background color for a given MIDI note. */
const rowBgColor = (note: number): string => {
  if (note % 12 === 0) return ROW_OCTAVE_BOUND
  if (isBlackKey(note)) return ROW_BLACK_KEY
  return ROW_WHITE_KEY
}

/**
 * Auto-detects the note range from an array of notes.
 * Pads by 2 semitones above and below, clamped to [0, 127].
 */
const detectNoteRange = (
  notes:        ReadonlyArray<PianoRollNote>,
  minNoteProp?: number,
  maxNoteProp?: number,
): { readonly minNote: number; readonly maxNote: number } => {
  if (notes.length === 0) {
    return {
      minNote: minNoteProp ?? DEFAULT_MIN_NOTE,
      maxNote: maxNoteProp ?? DEFAULT_MAX_NOTE,
    }
  }
  const pitches = notes.map(n => n.pitch)
  const rawMin  = Math.min(...pitches)
  const rawMax  = Math.max(...pitches)
  return {
    minNote: minNoteProp ?? Math.max(0,   rawMin - 2),
    maxNote: maxNoteProp ?? Math.min(127, rawMax + 2),
  }
}

// ── Drawing ───────────────────────────────────────────────────────────────────

const drawRoll = (
  ctx:         CanvasRenderingContext2D,
  notes:       ReadonlyArray<PianoRollNote>,
  currentStep: number,
  stepCount:   number,
  width:       number,
  height:      number,
  minNote:     number,
  maxNote:     number,
): void => {
  // Background
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, width, height)

  // Empty state
  if (notes.length === 0) {
    ctx.fillStyle    = EMPTY_TEXT_COLOR
    ctx.font         = '12px monospace'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('No notes', width / 2, height / 2)
    return
  }

  const noteRange  = maxNote - minNote + 1
  const gridLeft   = PIANO_STRIP_WIDTH
  const gridWidth  = width - gridLeft
  const colWidth   = gridWidth / stepCount

  // ── Row backgrounds ─────────────────────────────────────────────────────────
  // Notes are drawn top-to-bottom: maxNote at row 0, minNote at last row.
  Array.from({ length: noteRange }, (_, i) => {
    const note = maxNote - i
    const rowY = i * ROW_HEIGHT
    ctx.fillStyle = rowBgColor(note)
    ctx.fillRect(gridLeft, rowY, gridWidth, ROW_HEIGHT)
  })

  // ── Current step column overlay ─────────────────────────────────────────────
  const cursorStep  = currentStep < stepCount ? currentStep : currentStep % stepCount
  const cursorX     = gridLeft + cursorStep * colWidth

  ctx.fillStyle = CURSOR_OVERLAY
  ctx.fillRect(cursorX, 0, colWidth, height)

  // ── Note blocks ─────────────────────────────────────────────────────────────
  notes.forEach(note => {
    if (note.pitch < minNote || note.pitch > maxNote) return

    const rowIndex = maxNote - note.pitch
    const rowY     = rowIndex * ROW_HEIGHT
    const noteX    = gridLeft + note.step * colWidth
    const noteW    = Math.max(colWidth * note.duration - 1, 1)
    const noteH    = ROW_HEIGHT - 1

    const isCurrentStepNote = note.step === cursorStep
    ctx.fillStyle = isCurrentStepNote ? NOTE_CURRENT : NOTE_NORMAL
    ctx.fillRect(noteX, rowY + 0.5, noteW, noteH)
  })

  // ── Cursor line ─────────────────────────────────────────────────────────────
  ctx.fillStyle = CURSOR_LINE
  ctx.fillRect(cursorX, 0, 1, height)

  // ── Piano key strip ─────────────────────────────────────────────────────────
  Array.from({ length: noteRange }, (_, i) => {
    const note  = maxNote - i
    const rowY  = i * ROW_HEIGHT
    ctx.fillStyle = isBlackKey(note) ? PIANO_BLACK_KEY : PIANO_WHITE_KEY
    ctx.fillRect(0, rowY, PIANO_STRIP_WIDTH, ROW_HEIGHT)
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Canvas-based piano roll visualizer for Score Studio.
 *
 * Renders a 2D grid of MIDI note events. The X axis represents steps and the
 * Y axis represents MIDI note numbers. A small piano key strip runs along the
 * left edge to indicate pitch. A cursor line and column overlay mark the
 * currently playing step.
 *
 * @param notes       - Array of note events to display.
 * @param currentStep - Zero-based index of the currently playing step.
 * @param stepCount   - Total number of steps in the sequence.
 * @param minNote     - Lowest MIDI note displayed (optional, auto-detected).
 * @param maxNote     - Highest MIDI note displayed (optional, auto-detected).
 *
 * @example
 * ```tsx
 * <PianoRoll
 *   notes={[{ pitch: 60, step: 0, velocity: 1, duration: 1 }]}
 *   currentStep={2}
 *   stepCount={16}
 * />
 * ```
 */
export const PianoRoll = ({
  notes,
  currentStep,
  stepCount,
  minNote: minNoteProp,
  maxNote: maxNoteProp,
  onNoteClick,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { minNote, maxNote } = detectNoteRange(notes, minNoteProp, maxNoteProp)
  const noteRange    = maxNote - minNote + 1
  const canvasHeight = noteRange * ROW_HEIGHT

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
    drawRoll(ctx, notes, currentStep, stepCount, width, height, minNote, maxNote)
  }, [notes, currentStep, stepCount, minNote, maxNote])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!onNoteClick) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const gridLeft = PIANO_STRIP_WIDTH
    if (x < gridLeft) return

    const noteRange = maxNote - minNote + 1
    const rowIndex = Math.floor(y / ROW_HEIGHT)
    if (rowIndex < 0 || rowIndex >= noteRange) return

    const pitch = maxNote - rowIndex
    const colWidth = (canvas.clientWidth - gridLeft) / stepCount
    const step = Math.floor((x - gridLeft) / colWidth)
    if (step < 0 || step >= stepCount) return

    onNoteClick(pitch, step)
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label="Piano roll"
      role="img"
      onClick={onNoteClick ? handleClick : undefined}
      style={{
        width:          '100%',
        height:         `${String(canvasHeight)}px`,
        display:        'block',
        imageRendering: 'pixelated',
        cursor:         onNoteClick ? 'pointer' : 'default',
      }}
    />
  )
}
