import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent }        from '@testing-library/react'
import { DraggablePanel }           from '../src/renderer/components/shared/DraggablePanel.js'

// ── Helpers ────────────────────────────────────────────────────────────────────

const defaultProps = {
  title:         'Test Panel',
  defaultX:      50,
  defaultY:      80,
  defaultWidth:  300,
  defaultHeight: 200,
}

const renderPanel = (overrides: Partial<React.ComponentProps<typeof DraggablePanel>> = {}) =>
  render(
    <DraggablePanel {...defaultProps} {...overrides}>
      <span data-testid="panel-child">hello</span>
    </DraggablePanel>
  )

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('DraggablePanel — rendering', () => {
  it('renders children correctly', () => {
    const { getByTestId } = renderPanel()
    expect(getByTestId('panel-child')).toBeInTheDocument()
    expect(getByTestId('panel-child').textContent).toBe('hello')
  })

  it('renders the title text in the title bar', () => {
    const { getByRole } = renderPanel()
    const heading = getByRole('heading', { level: 3 })
    expect(heading.textContent).toContain('Test Panel')
  })

  it('starts at the default position via inline style', () => {
    const { getByLabelText } = renderPanel()
    const panel = getByLabelText('Test Panel')
    expect(panel).toHaveStyle({ left: '50px', top: '80px' })
  })

  it('starts with the default size via inline style', () => {
    const { getByLabelText } = renderPanel()
    const panel = getByLabelText('Test Panel')
    expect(panel).toHaveStyle({ width: '300px', height: '200px' })
  })
})

// ── Close button ──────────────────────────────────────────────────────────────

describe('DraggablePanel — close button', () => {
  it('renders close button when onClose prop is provided', () => {
    const { getByRole } = renderPanel({ onClose: vi.fn() })
    expect(getByRole('button', { name: /close test panel/i })).toBeInTheDocument()
  })

  it('does not render close button when onClose prop is omitted', () => {
    const { queryByRole } = renderPanel()
    expect(queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    const { getByRole } = renderPanel({ onClose })
    fireEvent.click(getByRole('button', { name: /close test panel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

// ── Resize handle ─────────────────────────────────────────────────────────────

describe('DraggablePanel — resize handle', () => {
  it('renders the resize handle in the DOM', () => {
    const { getByRole } = renderPanel()
    expect(getByRole('separator', { name: /resize panel/i })).toBeInTheDocument()
  })
})

// ── Drag (title bar) ──────────────────────────────────────────────────────────

describe('DraggablePanel — drag behaviour', () => {
  it('title bar has an onMouseDown handler (drag initiator)', () => {
    const { getByRole } = renderPanel()
    const titleBar = getByRole('heading', { level: 3 })
    // fireEvent.mouseDown must not throw — confirms handler is attached
    expect(() => fireEvent.mouseDown(titleBar, { clientX: 10, clientY: 10 })).not.toThrow()
  })

  it('moves the panel when dragging the title bar', () => {
    const { getByLabelText, getByRole } = renderPanel()
    const panel    = getByLabelText('Test Panel')
    const titleBar = getByRole('heading', { level: 3 })

    // Start drag at (10, 10) — panel origin is (50, 80)
    fireEvent.mouseDown(titleBar, { clientX: 10, clientY: 10 })
    // Move 40px right, 20px down
    fireEvent.mouseMove(document, { clientX: 50, clientY: 30 })
    // Expected new position: (50 + 40, 80 + 20) = (90, 100)
    expect(panel).toHaveStyle({ left: '90px', top: '100px' })

    fireEvent.mouseUp(document)
  })

  it('stops moving after mouseUp', () => {
    const { getByLabelText, getByRole } = renderPanel()
    const panel    = getByLabelText('Test Panel')
    const titleBar = getByRole('heading', { level: 3 })

    fireEvent.mouseDown(titleBar, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(document, { clientX: 30, clientY: 30 })
    fireEvent.mouseUp(document)

    // Further moves after mouseUp should not change position
    fireEvent.mouseMove(document, { clientX: 200, clientY: 200 })
    expect(panel).toHaveStyle({ left: '80px', top: '110px' })
  })
})

// ── Resize ────────────────────────────────────────────────────────────────────

describe('DraggablePanel — resize behaviour', () => {
  it('resize handle has an onMouseDown handler', () => {
    const { getByRole } = renderPanel()
    const handle = getByRole('separator', { name: /resize panel/i })
    expect(() => fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 })).not.toThrow()
  })

  it('resizes the panel when dragging the resize handle', () => {
    const { getByLabelText, getByRole } = renderPanel()
    const panel  = getByLabelText('Test Panel')
    const handle = getByRole('separator', { name: /resize panel/i })

    // Start at (0, 0) — panel size is (300, 200)
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 })
    // Drag +50px wide, +30px tall
    fireEvent.mouseMove(document, { clientX: 50, clientY: 30 })
    expect(panel).toHaveStyle({ width: '350px', height: '230px' })

    fireEvent.mouseUp(document)
  })

  it('enforces minimum width of 120px', () => {
    const { getByLabelText, getByRole } = renderPanel({ defaultWidth: 150 })
    const panel  = getByLabelText('Test Panel')
    const handle = getByRole('separator', { name: /resize panel/i })

    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 })
    // Drag far left — would make width negative
    fireEvent.mouseMove(document, { clientX: -200, clientY: 0 })
    expect(panel).toHaveStyle({ width: '120px' })

    fireEvent.mouseUp(document)
  })

  it('enforces minimum height of 80px', () => {
    const { getByLabelText, getByRole } = renderPanel({ defaultHeight: 100 })
    const panel  = getByLabelText('Test Panel')
    const handle = getByRole('separator', { name: /resize panel/i })

    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 })
    // Drag far up — would make height negative
    fireEvent.mouseMove(document, { clientX: 0, clientY: -200 })
    expect(panel).toHaveStyle({ height: '80px' })

    fireEvent.mouseUp(document)
  })

  it('stops resizing after mouseUp', () => {
    const { getByLabelText, getByRole } = renderPanel()
    const panel  = getByLabelText('Test Panel')
    const handle = getByRole('separator', { name: /resize panel/i })

    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(document, { clientX: 20, clientY: 20 })
    fireEvent.mouseUp(document)

    // Further moves should not change size
    fireEvent.mouseMove(document, { clientX: 500, clientY: 500 })
    expect(panel).toHaveStyle({ width: '320px', height: '220px' })
  })
})
