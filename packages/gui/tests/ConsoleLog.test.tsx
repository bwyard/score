import { describe, it, expect } from 'vitest'
import { render, screen }       from '@testing-library/react'
import { ConsoleLog }           from '../src/renderer/components/shared/ConsoleLog.js'
import type { LogEntry }        from '../src/renderer/components/shared/ConsoleLog.js'

const mkEntry = (id: number, level: LogEntry['level'], message: string): LogEntry => ({
  id, level, message, time: 1000000000000 + id,
})

describe('ConsoleLog', () => {
  it('renders empty state when no entries', () => {
    render(<ConsoleLog entries={[]} />)
    expect(screen.getByRole('log')).toBeInTheDocument()
    expect(screen.getByText(/no output yet/i)).toBeInTheDocument()
  })

  it('renders log entries', () => {
    const entries = [
      mkEntry(1, 'ok',    'Song loaded'),
      mkEntry(2, 'error', 'Eval failed'),
      mkEntry(3, 'info',  'Playing'),
      mkEntry(4, 'warn',  'Swap queued'),
    ]
    render(<ConsoleLog entries={entries} />)
    expect(screen.getByText('Song loaded')).toBeInTheDocument()
    expect(screen.getByText('Eval failed')).toBeInTheDocument()
    expect(screen.getByText('Playing')).toBeInTheDocument()
    expect(screen.getByText('Swap queued')).toBeInTheDocument()
  })

  it('has aria-live=polite for screen readers', () => {
    render(<ConsoleLog entries={[]} />)
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite')
  })
})
