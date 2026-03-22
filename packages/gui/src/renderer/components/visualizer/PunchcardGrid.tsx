import { useRef, useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

export type PunchcardTrack = {
  readonly name:    string
  readonly type:    string
  readonly pattern: ReadonlyArray<number | string>
}

type Props = {
  readonly tracks:      ReadonlyArray<PunchcardTrack>
  readonly currentStep: number
  readonly stepCount:   number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BG_COLOR         = '#080809'
const ROW_HEIGHT       = 28
const ROW_GAP          = 2
const LEFT_STRIP_WIDTH = 4
const CELL_GAP         = 1

const STRIP_COLOR: Record<string, string> = {
  kick:   '#c05a20',
  snare:  '#c02040',
  hihat:  '#208060',
  synth:  '#2060a0',
  arp:    '#6040a0',
  sample: '#606060',
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
  ctx:         CanvasRenderingContext2D,
  tracks:      ReadonlyArray<PunchcardTrack>,
  currentStep: number,
  stepCount:   number,
  width:       number,
  height:      number,
  flash:       boolean,
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

  const cellAreaWidth = width - LEFT_STRIP_WIDTH
  const cellWidth     = (cellAreaWidth - (stepCount - 1) * CELL_GAP) / stepCount

  // Draw each track row
  tracks.forEach((track, rowIndex) => {
    const rowY       = rowIndex * (ROW_HEIGHT + ROW_GAP)
    const trackLen   = track.pattern.length > 0 ? track.pattern.length : stepCount
    // Per-track cursor: wrap currentStep within this track's pattern length.
    // Shorter patterns loop — an 8-step kick repeats in a 16-step grid.
    const localStep  = currentStep % trackLen

    // Left strip
    ctx.fillStyle = resolveStripColor(track.type)
    ctx.fillRect(0, rowY, LEFT_STRIP_WIDTH, ROW_HEIGHT)

    // Step cells — loop pattern if track is shorter than stepCount
    Array.from({ length: stepCount }, (_, step) => {
      const cellX      = LEFT_STRIP_WIDTH + step * (cellWidth + CELL_GAP)
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
  const cursorX          = LEFT_STRIP_WIDTH + globalCursorStep * (cellWidth + CELL_GAP)
  const totalHeight      = tracks.length * (ROW_HEIGHT + ROW_GAP) - ROW_GAP

  ctx.fillStyle = flash ? CURSOR_OVERLAY_FLASH : CURSOR_OVERLAY
  ctx.fillRect(cursorX, 0, cellWidth, totalHeight)
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Canvas-based punchcard grid visualizer for Score Studio.
 * Renders one row per track, with step cells and a playhead cursor column.
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
export const PunchcardGrid = ({ tracks, currentStep, stepCount }: Props) => {
  const canvasRef         = useRef<HTMLCanvasElement>(null)
  const [flash, setFlash] = useState(false)

  // Beat flash: pulse on step 0
  useEffect(() => {
    if (currentStep !== 0) return
    setFlash(true)
    const id = setTimeout(() => setFlash(false), FLASH_DURATION_MS)
    return () => clearTimeout(id)
  }, [currentStep])

  // Canvas redraw
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    const dpr    = window.devicePixelRatio ?? 1
    const width  = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width  = Math.round(width  * dpr)
    canvas.height = Math.round(height * dpr)

    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    ctx.scale(dpr, dpr)
    drawGrid(ctx, tracks, currentStep, stepCount, width, height, flash)
  }, [tracks, currentStep, stepCount, flash])

  const canvasHeight =
    tracks.length === 0
      ? 60
      : tracks.length * (ROW_HEIGHT + ROW_GAP) - ROW_GAP

  return (
    <canvas
      ref={canvasRef}
      style={{
        width:          '100%',
        height:         `${canvasHeight}px`,
        display:        'block',
        imageRendering: 'pixelated',
      }}
    />
  )
}
