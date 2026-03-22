import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

export type EvalStatusKind = 'idle' | 'ok' | 'error' | 'pending'

type Props = {
  readonly status:     EvalStatusKind
  readonly message?:   string
  readonly timestamp?: number
}

// ── Relative time helper ───────────────────────────────────────────────────────

const relativeTime = (timestamp: number): string => {
  const secs = Math.floor((Date.now() - timestamp) / 1000)
  if (secs < 60)   return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60)   return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

// ── Dot colors per status ──────────────────────────────────────────────────────

const DOT_COLOR: Record<EvalStatusKind, string> = {
  idle:    '#3a3a46',
  ok:      '#22cc66',
  error:   '#ff4444',
  pending: '#ffcc00',
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Small pill badge showing the result of the last code eval.
 *
 * @param status    - Current eval state: idle | ok | error | pending
 * @param message   - Error detail string (used when status='error')
 * @param timestamp - Date.now() value of last eval (used when status='ok')
 */
export const EvalStatus = ({ status, message, timestamp }: Props) => {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (status !== 'ok' || timestamp === undefined) return

    // BOUNDARY — IO: interval drives relative-time re-render; cleaned up on unmount / status change
    const handle: { value: ReturnType<typeof setInterval> | null } = { value: null }
    handle.value = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)

    return () => {
      if (handle.value !== null) clearInterval(handle.value)
    }
  }, [status, timestamp])

  return (
    <div style={styles.pill} aria-label={`Eval status: ${status}`}>
      <span
        aria-hidden="true"
        style={{ ...styles.dot, background: DOT_COLOR[status] }}
      />
      <span style={styles.label}>
        {status === 'idle'    && 'Ready'}
        {status === 'ok'      && 'OK'}
        {status === 'error'   && 'Error'}
        {status === 'pending' && 'Pending...'}
      </span>
      {status === 'ok' && timestamp !== undefined && (
        <span style={styles.time}>{relativeTime(timestamp)}</span>
      )}
      {status === 'error' && message !== undefined && (
        <span style={styles.errorMsg} title={message}>
          {message.length > 48 ? `${message.slice(0, 45)}…` : message}
        </span>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  pill: {
    display:        'inline-flex',
    flexDirection:  'column' as const,
    gap:            '0.2rem',
    padding:        '0.3rem 0.65rem',
    background:     '#0c0c0e',
    border:         '1px solid #1e1e22',
    borderRadius:   '999px',
    fontFamily:     "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:       '0.72rem',
    color:          '#a0a0b0',
    minWidth:       '72px',
  },
  row: {
    display:     'flex',
    alignItems:  'center',
    gap:         '0.4rem',
  },
  dot: {
    display:      'inline-block',
    width:        '6px',
    height:       '6px',
    borderRadius: '50%',
    flexShrink:   0,
    marginRight:  '0.35rem',
  },
  label: {
    display:    'inline',
    fontWeight: 600,
  },
  time: {
    fontSize: '0.65rem',
    color:    '#5a5a6a',
    marginLeft: '0.25rem',
  },
  errorMsg: {
    display:      'block',
    fontSize:     '0.65rem',
    color:        '#ff7777',
    marginTop:    '0.1rem',
    whiteSpace:   'nowrap' as const,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    maxWidth:     '220px',
  },
} as const
