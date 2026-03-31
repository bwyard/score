import { describe, it, expect, vi }  from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe }                       from './setup.js'
import { PunchcardGrid }             from '../src/renderer/components/visualizer/PunchcardGrid.js'
import type { PunchcardTrack }       from '../src/renderer/components/visualizer/PunchcardGrid.js'

// ── Fixtures ───────────────────────────────────────────────────────────────────

const ONE_TRACK: ReadonlyArray<PunchcardTrack> = [
  { name: 'Kick', type: 'kick', pattern: [1, 0, 0, 0, 1, 0, 0, 0] },
]

const TWO_TRACKS: ReadonlyArray<PunchcardTrack> = [
  { name: 'Kick',  type: 'kick',  pattern: [1, 0, 0, 0, 1, 0, 0, 0] },
  { name: 'Snare', type: 'snare', pattern: [0, 0, 1, 0, 0, 0, 1, 0] },
]

const setup = (
  tracks:      ReadonlyArray<PunchcardTrack> = ONE_TRACK,
  onStepClick?: (t: number, s: number) => void,
) => render(
  <PunchcardGrid
    tracks={tracks}
    currentStep={0}
    stepCount={8}
    {...(onStepClick !== undefined ? { onStepClick } : {})}
  />,
)

const getGrid = () => screen.getByRole('application')

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('PunchcardGrid — rendering', () => {
  it('renders a canvas with application role', () => {
    setup()
    expect(getGrid()).toBeInTheDocument()
  })

  it('has aria-label describing track and step count', () => {
    setup(TWO_TRACKS)
    expect(getGrid()).toHaveAttribute('aria-label', 'Punchcard sequencer grid, 2 tracks, 8 steps')
  })

  it('empty grid aria-label says empty', () => {
    setup([])
    expect(getGrid()).toHaveAttribute('aria-label', 'Punchcard sequencer grid, empty')
  })

  it('has aria-describedby linking to usage instructions', () => {
    setup()
    const descId = getGrid().getAttribute('aria-describedby')
    expect(descId).toBeTruthy()
    const desc = document.getElementById(descId!)
    expect(desc).toBeInTheDocument()
    expect(desc?.textContent).toMatch(/arrow keys/i)
    expect(desc?.textContent).toMatch(/space or enter/i)
    expect(desc?.textContent).toMatch(/escape/i)
  })

  it('is Tab-focusable (tabIndex 0)', () => {
    setup()
    expect(getGrid()).toHaveAttribute('tabindex', '0')
  })
})

// ── Keyboard navigation ───────────────────────────────────────────────────────

describe('PunchcardGrid — keyboard navigation', () => {
  it('ArrowRight calls onStepClick at step 1 after two presses then Space', () => {
    const onStepClick = vi.fn()
    setup(ONE_TRACK, onStepClick)
    const grid = getGrid()
    grid.focus()
    fireEvent.keyDown(grid, { key: 'ArrowRight' })
    fireEvent.keyDown(grid, { key: ' ' })
    // Active cell started at 0 on focus, moved to 1 via ArrowRight
    expect(onStepClick).toHaveBeenCalledWith(0, 1)
  })

  it('Space at default position (0,0) fires onStepClick(0, 0)', () => {
    const onStepClick = vi.fn()
    setup(ONE_TRACK, onStepClick)
    const grid = getGrid()
    grid.focus()
    fireEvent.keyDown(grid, { key: ' ' })
    expect(onStepClick).toHaveBeenCalledWith(0, 0)
  })

  it('Enter at default position fires onStepClick(0, 0)', () => {
    const onStepClick = vi.fn()
    setup(ONE_TRACK, onStepClick)
    const grid = getGrid()
    grid.focus()
    fireEvent.keyDown(grid, { key: 'Enter' })
    expect(onStepClick).toHaveBeenCalledWith(0, 0)
  })

  it('ArrowDown moves to second track, Space fires onStepClick(1, 0)', () => {
    const onStepClick = vi.fn()
    setup(TWO_TRACKS, onStepClick)
    const grid = getGrid()
    grid.focus()
    fireEvent.keyDown(grid, { key: 'ArrowDown' })
    fireEvent.keyDown(grid, { key: ' ' })
    expect(onStepClick).toHaveBeenCalledWith(1, 0)
  })

  it('ArrowUp does not go below track 0', () => {
    const onStepClick = vi.fn()
    setup(ONE_TRACK, onStepClick)
    const grid = getGrid()
    grid.focus()
    fireEvent.keyDown(grid, { key: 'ArrowUp' })
    fireEvent.keyDown(grid, { key: ' ' })
    // Should still be track 0
    expect(onStepClick).toHaveBeenCalledWith(0, 0)
  })

  it('ArrowLeft wraps from step 0 to last step', () => {
    const onStepClick = vi.fn()
    setup(ONE_TRACK, onStepClick)
    const grid = getGrid()
    grid.focus()
    fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    fireEvent.keyDown(grid, { key: ' ' })
    // Wrap: step 0 - 1 → step 7 (pattern length 8)
    expect(onStepClick).toHaveBeenCalledWith(0, 7)
  })

  it('ArrowRight wraps from last step to step 0', () => {
    const onStepClick = vi.fn()
    setup(ONE_TRACK, onStepClick)
    const grid = getGrid()
    grid.focus()
    // Move to last step (7) then one more right → wraps to 0
    for (let i = 0; i < 8; i++) fireEvent.keyDown(grid, { key: 'ArrowRight' })
    fireEvent.keyDown(grid, { key: ' ' })
    expect(onStepClick).toHaveBeenCalledWith(0, 0)
  })

  it('Home moves to step 0', () => {
    const onStepClick = vi.fn()
    setup(ONE_TRACK, onStepClick)
    const grid = getGrid()
    grid.focus()
    fireEvent.keyDown(grid, { key: 'ArrowRight' })
    fireEvent.keyDown(grid, { key: 'ArrowRight' })
    fireEvent.keyDown(grid, { key: 'Home' })
    fireEvent.keyDown(grid, { key: ' ' })
    expect(onStepClick).toHaveBeenCalledWith(0, 0)
  })

  it('End moves to last step', () => {
    const onStepClick = vi.fn()
    setup(ONE_TRACK, onStepClick)
    const grid = getGrid()
    grid.focus()
    fireEvent.keyDown(grid, { key: 'End' })
    fireEvent.keyDown(grid, { key: ' ' })
    expect(onStepClick).toHaveBeenCalledWith(0, 7)
  })

  it('Space does nothing when no onStepClick provided', () => {
    // Should not throw
    setup(ONE_TRACK, undefined)
    const grid = getGrid()
    grid.focus()
    expect(() => { fireEvent.keyDown(grid, { key: ' ' }) }).not.toThrow()
  })

  it('keyboard events on empty grid do not throw', () => {
    setup([])
    const grid = getGrid()
    grid.focus()
    expect(() => {
      fireEvent.keyDown(grid, { key: 'ArrowRight' })
      fireEvent.keyDown(grid, { key: ' ' })
    }).not.toThrow()
  })
})

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('PunchcardGrid — accessibility', () => {
  it('has no axe violations (with tracks)', async () => {
    const { container } = setup(TWO_TRACKS)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations (empty)', async () => {
    const { container } = setup([])
    expect(await axe(container)).toHaveNoViolations()
  })
})
