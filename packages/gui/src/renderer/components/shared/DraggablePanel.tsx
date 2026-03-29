import { useState, useEffect, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

/** Origin snapshot captured at the start of a drag or resize gesture. */
type DragOrigin = {
  readonly mx: number
  readonly my: number
  readonly ox: number
  readonly oy: number
}

/** Position of the panel on screen. */
type Position = {
  readonly x: number
  readonly y: number
}

/** Dimensions of the panel. */
type Size = {
  readonly w: number
  readonly h: number
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MIN_W         = 120
const MIN_H         = 80
const TITLE_H       = 28
const HANDLE_SIZE   = 8
const KEYBOARD_STEP = 10

// ── Props ──────────────────────────────────────────────────────────────────────

/**
 * Props for {@link DraggablePanel}.
 */
export type DraggablePanelProps = {
  /** Text displayed in the title bar. */
  readonly title: string
  /** Content rendered inside the panel body. */
  readonly children: React.ReactNode
  /** Initial X position (pixels from left). Defaults to 40. */
  readonly defaultX?: number
  /** Initial Y position (pixels from top). Defaults to 40. */
  readonly defaultY?: number
  /** Initial panel width in pixels. Defaults to 320. */
  readonly defaultWidth?: number
  /** Initial panel height in pixels. Defaults to 240. */
  readonly defaultHeight?: number
  /**
   * Called when the close button is clicked.
   * If omitted the close button is not rendered.
   */
  readonly onClose?: () => void
  /**
   * Unique identifier for layout persistence. When provided, position and size
   * are reported to `onMoved` after each drag or resize gesture completes.
   */
  readonly panelId?: string
  /**
   * Called with the final position and size after the user finishes dragging or resizing.
   * Use to persist panel layout via IPC.
   */
  readonly onMoved?: (panelId: string, x: number, y: number, w: number, h: number) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A draggable, resizable floating panel for Score Studio.
 *
 * The panel is absolutely positioned within its nearest positioned ancestor.
 * Drag the title bar to move the panel; drag the resize handle in the
 * bottom-right corner to resize it.
 *
 * @example
 * ```tsx
 * <DraggablePanel
 *   title="Mixer"
 *   defaultX={100}
 *   defaultY={80}
 *   defaultWidth={400}
 *   defaultHeight={300}
 *   onClose={() => setVisible(false)}
 * >
 *   <MixerContent />
 * </DraggablePanel>
 * ```
 */
export const DraggablePanel = (props: DraggablePanelProps) => {
  const {
    title,
    children,
    defaultX      = 40,
    defaultY      = 40,
    defaultWidth  = 320,
    defaultHeight = 240,
    onClose,
    panelId,
    onMoved,
  } = props

  const [pos,  setPos]  = useState<Position>({ x: defaultX,     y: defaultY      })
  const [size, setSize] = useState<Size>     ({ w: defaultWidth, h: defaultHeight })

  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)

  // Refs hold the drag origin so mousemove handlers never capture stale state.
  const dragOrigin   = useRef<DragOrigin | null>(null)
  const resizeOrigin = useRef<DragOrigin | null>(null)
  // Track current pos/size in refs so onMouseUp closures always see fresh values.
  const posRef  = useRef<Position>(pos)
  const sizeRef = useRef<Size>(size)

  // ── Drag (title bar) ────────────────────────────────────────────────────────

  const onTitleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setDragging(true)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y }
  }

  useEffect(() => {
    if (!dragging) return

    const onMouseMove = (e: MouseEvent): void => {
      const origin = dragOrigin.current
      if (origin === null) return
      const newPos = {
        x: origin.ox + (e.clientX - origin.mx),
        y: origin.oy + (e.clientY - origin.my),
      }
      posRef.current = newPos
      setPos(newPos)
    }

    const onMouseUp = (): void => {
      setDragging(false)
      dragOrigin.current = null
      if (panelId && onMoved) {
        const { x, y } = posRef.current
        const { w, h } = sizeRef.current
        onMoved(panelId, x, y, w, h)
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
  }, [dragging, panelId, onMoved])

  // ── Keyboard (title bar) — move with Arrow, resize with Shift+Arrow, close with Escape ──

  const onTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      if (onClose !== undefined) { onClose() }
      return
    }

    if (e.shiftKey) {
      // Shift+Arrow → resize
      let newSize: Size | null = null
      if (e.key === 'ArrowRight') { e.preventDefault(); newSize = { w: Math.max(MIN_W, size.w + KEYBOARD_STEP), h: size.h } }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); newSize = { w: Math.max(MIN_W, size.w - KEYBOARD_STEP), h: size.h } }
      if (e.key === 'ArrowDown')  { e.preventDefault(); newSize = { w: size.w, h: Math.max(MIN_H, size.h + KEYBOARD_STEP) } }
      if (e.key === 'ArrowUp')    { e.preventDefault(); newSize = { w: size.w, h: Math.max(MIN_H, size.h - KEYBOARD_STEP) } }
      if (newSize !== null) {
        sizeRef.current = newSize
        setSize(newSize)
        if (panelId !== undefined && onMoved !== undefined) {
          onMoved(panelId, posRef.current.x, posRef.current.y, newSize.w, newSize.h)
        }
      }
    } else {
      // Arrow → move
      let newPos: Position | null = null
      if (e.key === 'ArrowRight') { e.preventDefault(); newPos = { x: pos.x + KEYBOARD_STEP, y: pos.y } }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); newPos = { x: pos.x - KEYBOARD_STEP, y: pos.y } }
      if (e.key === 'ArrowDown')  { e.preventDefault(); newPos = { x: pos.x, y: pos.y + KEYBOARD_STEP } }
      if (e.key === 'ArrowUp')    { e.preventDefault(); newPos = { x: pos.x, y: pos.y - KEYBOARD_STEP } }
      if (newPos !== null) {
        posRef.current = newPos
        setPos(newPos)
        if (panelId !== undefined && onMoved !== undefined) {
          onMoved(panelId, newPos.x, newPos.y, sizeRef.current.w, sizeRef.current.h)
        }
      }
    }
  }

  // ── Keyboard (resize handle) — Arrow keys resize ─────────────────────────────

  const onResizeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    let newSize: Size | null = null
    if (e.key === 'ArrowRight') { e.preventDefault(); newSize = { w: Math.max(MIN_W, size.w + KEYBOARD_STEP), h: size.h } }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); newSize = { w: Math.max(MIN_W, size.w - KEYBOARD_STEP), h: size.h } }
    if (e.key === 'ArrowDown')  { e.preventDefault(); newSize = { w: size.w, h: Math.max(MIN_H, size.h + KEYBOARD_STEP) } }
    if (e.key === 'ArrowUp')    { e.preventDefault(); newSize = { w: size.w, h: Math.max(MIN_H, size.h - KEYBOARD_STEP) } }
    if (newSize !== null) {
      sizeRef.current = newSize
      setSize(newSize)
      if (panelId !== undefined && onMoved !== undefined) {
        onMoved(panelId, posRef.current.x, posRef.current.y, newSize.w, newSize.h)
      }
    }
  }

  // ── Resize (bottom-right handle) ────────────────────────────────────────────

  const onHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setResizing(true)
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, ox: size.w, oy: size.h }
  }

  useEffect(() => {
    if (!resizing) return

    const onMouseMove = (e: MouseEvent): void => {
      const origin = resizeOrigin.current
      if (origin === null) return
      const newSize = {
        w: Math.max(MIN_W, origin.ox + (e.clientX - origin.mx)),
        h: Math.max(MIN_H, origin.oy + (e.clientY - origin.my)),
      }
      sizeRef.current = newSize
      setSize(newSize)
    }

    const onMouseUp = (): void => {
      setResizing(false)
      resizeOrigin.current = null
      if (panelId && onMoved) {
        const { x, y } = posRef.current
        const { w, h } = sizeRef.current
        onMoved(panelId, x, y, w, h)
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
  }, [resizing, panelId, onMoved])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      aria-label={title}
      style={{
        ...styles.panel,
        left:   pos.x,
        top:    pos.y,
        width:  size.w,
        height: size.h,
      }}
    >
      {/* Title bar — Tab to focus, Arrow to move, Shift+Arrow to resize, Escape to close */}
      <div
        role="heading"
        aria-level={3}
        tabIndex={0}
        style={{
          ...styles.titleBar,
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={onTitleMouseDown}
        onKeyDown={onTitleKeyDown}
      >
        <span style={styles.titleText}>{title}</span>

        {onClose !== undefined && (
          <button
            aria-label={`Close ${title}`}
            style={styles.closeBtn}
            onMouseDown={e => { e.stopPropagation() }}
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>

      {/* Panel body */}
      <div style={styles.body}>
        {children}
      </div>

      {/* Resize handle — Tab to focus, Arrow keys to resize */}
      <div
        aria-label="Resize panel"
        role="separator"
        tabIndex={0}
        style={styles.resizeHandle}
        onMouseDown={onHandleMouseDown}
        onKeyDown={onResizeKeyDown}
      />
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  panel: {
    position:  'absolute' as const,
    zIndex:    100,
    border:    '1px solid #2a2a36',
    background: '#0d0d10',
    display:   'flex',
    flexDirection: 'column' as const,
    overflow:  'hidden',
    boxSizing: 'border-box' as const,
    userSelect: 'none' as const,
  },
  titleBar: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    height:         `${String(TITLE_H)}px`,
    flexShrink:     0,
    padding:        '0 6px 0 8px',
    background:     '#141418',
    borderBottom:   '1px solid #1e1e22',
  },
  titleText: {
    color:         '#6a9fff',
    fontSize:      '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontFamily:    'system-ui, sans-serif',
    fontWeight:    600,
    pointerEvents: 'none' as const,
  },
  closeBtn: {
    background:  'none',
    border:      'none',
    color:       '#6a9fff',
    fontSize:    '1rem',
    lineHeight:  1,
    cursor:      'pointer',
    padding:     '0 2px',
    opacity:     0.7,
    flexShrink:  0,
  },
  body: {
    flex:     1,
    overflow: 'auto' as const,
  },
  resizeHandle: {
    position:  'absolute' as const,
    right:     0,
    bottom:    0,
    width:     `${String(HANDLE_SIZE)}px`,
    height:    `${String(HANDLE_SIZE)}px`,
    background: '#2a2a36',
    cursor:    'se-resize',
    flexShrink: 0,
  },
} as const
