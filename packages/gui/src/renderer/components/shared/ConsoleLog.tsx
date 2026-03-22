import { useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'ok' | 'error' | 'warn'

export type LogEntry = {
  readonly id:      number
  readonly level:   LogLevel
  readonly message: string
  readonly time:    number  // Date.now()
}

type Props = {
  readonly entries: ReadonlyArray<LogEntry>
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const timeStr = (t: number): string => {
  const d = new Date(t)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const PREFIX: Record<LogLevel, string> = {
  info:  '·',
  ok:    '✓',
  error: '✗',
  warn:  '!',
}

const COLOR: Record<LogLevel, string> = {
  info:  '#6a6a7a',
  ok:    '#22cc66',
  error: '#ff4444',
  warn:  '#ffcc00',
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Scrolling console log for Score Studio Live Code mode.
 *
 * Displays a chronological list of engine events, eval results, and errors.
 * Auto-scrolls to the bottom when new entries arrive.
 *
 * @param entries - Array of log entries to display.
 *
 * @example
 * ```tsx
 * const [log, setLog] = useState<LogEntry[]>([])
 * const addLog = (level: LogLevel, message: string) =>
 *   setLog(prev => [...prev, { id: Date.now(), level, message, time: Date.now() }])
 * <ConsoleLog entries={log} />
 * ```
 */
export const ConsoleLog = ({ entries }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [entries])

  return (
    <div
      role="log"
      aria-label="Engine console"
      aria-live="polite"
      style={styles.root}
    >
      {entries.length === 0 && (
        <div style={styles.empty}>No output yet — eval a song or press play</div>
      )}
      {entries.map(entry => (
        <div key={entry.id} style={styles.row}>
          <span style={{ ...styles.prefix, color: COLOR[entry.level] }}>
            {PREFIX[entry.level]}
          </span>
          <span style={styles.timestamp}>{timeStr(entry.time)}</span>
          <span style={{ ...styles.message, color: COLOR[entry.level] }}>
            {entry.message}
          </span>
        </div>
      ))}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    flex:       1,
    overflow:   'auto',
    background: '#080809',
    padding:    '0.4rem 0.5rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:   '0.72rem',
    display:    'flex',
    flexDirection: 'column' as const,
    gap:        '1px',
  },
  empty: {
    color:   '#2a2a36',
    padding: '0.25rem 0',
  },
  row: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        '0.5rem',
    lineHeight: 1.5,
  },
  prefix: {
    flexShrink: 0,
    width:      '10px',
    textAlign:  'center' as const,
  },
  timestamp: {
    flexShrink: 0,
    color:      '#3a3a46',
    fontSize:   '0.65rem',
    fontVariantNumeric: 'tabular-nums',
  },
  message: {
    wordBreak: 'break-all' as const,
    flex:      1,
  },
} as const
