// ConsoleLogPanel.tsx — Self-contained engine console panel for Score Studio.
//
// Subscribes to IPC channels directly and manages its own entry list.
// Replaces the red error banner + the ConsoleLog/logEntries pattern in LiveCode.
//
// HARDWARE BOUNDARY: reads from window.scoreBridge IPC channels.

import { memo, useState, useEffect, useCallback, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

/** Visual badge type displayed beside each log entry. */
export type BadgeKind = 'EVAL' | 'ERROR' | 'BAR'

type PanelEntry = {
  readonly id:      number
  readonly badge:   BadgeKind
  readonly message: string
  readonly time:    number  // Date.now()
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_ENTRIES = 100

const BADGE_COLOR: Record<BadgeKind, string> = {
  EVAL:  '#22cc66',
  ERROR: '#ff4444',
  BAR:   '#4a8fff',
}

const BADGE_BG: Record<BadgeKind, string> = {
  EVAL:  '#0a2a16',
  ERROR: '#2a0a0a',
  BAR:   '#0a1a2a',
}

const MESSAGE_COLOR: Record<BadgeKind, string> = {
  EVAL:  '#88ddaa',
  ERROR: '#ff8888',
  BAR:   '#6a9fff',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const timeStr = (t: number): string => {
  const d  = new Date(t)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const makeEntry = (badge: BadgeKind, message: string): PanelEntry => ({
  id:      Date.now() + Math.random(),
  badge,
  message,
  time:    Date.now(),
})

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Self-contained engine console panel for Score Studio Live Code mode.
 *
 * Manages its own IPC subscriptions and entry list — no props required.
 * Replaces the red error banner and inline `logEntries`/`addLog` pattern.
 *
 * Entry types:
 * - **EVAL** — fires on `song:update` (successful eval)
 * - **ERROR** — fires on `song:error`, `error:report`, `engine:error`
 * - **BAR** — fires on `engine:tick` when `step === 0` (bar boundary)
 *
 * @example
 * ```tsx
 * // Drop into any mode layout — no wiring required.
 * <ConsoleLogPanel />
 * ```
 */
const ConsoleLogPanelInner = () => {
  const [entries, setEntries] = useState<ReadonlyArray<PanelEntry>>([])
  const bottomRef             = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  const addEntry = useCallback((badge: BadgeKind, message: string): void => {
    setEntries(prev => [...prev.slice(-(MAX_ENTRIES - 1)), makeEntry(badge, message)])
  }, [])

  // EVAL — successful song eval
  useEffect(() => {
    const unsub = window.scoreBridge.on('song:update', ({ tracks }) => {
      addEntry('EVAL', `Song loaded — ${String(tracks.length)} track${tracks.length === 1 ? '' : 's'}`)
    })
    return unsub
  }, [addEntry])

  // ERROR — song eval failure
  useEffect(() => {
    const unsub = window.scoreBridge.on('song:error', ({ message }) => {
      addEntry('ERROR', message)
    })
    return unsub
  }, [addEntry])

  // ERROR — legacy error:report channel
  useEffect(() => {
    const unsub = window.scoreBridge.on('error:report', ({ message }) => {
      addEntry('ERROR', message)
    })
    return unsub
  }, [addEntry])

  // ERROR — unexpected engine failure (effect hydration, uncaught exception)
  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:error', ({ message }) => {
      addEntry('ERROR', `[engine] ${message}`)
    })
    return unsub
  }, [addEntry])

  // BAR — bar boundary (engine:tick filtered to step 0 only)
  // HARDWARE BOUNDARY: engine:tick fires at full audio rate; this filters to ~1/stepCount.
  useEffect(() => {
    const unsub = window.scoreBridge.on('engine:tick', ({ step, bar }) => {
      if (step !== 0) return
      addEntry('BAR', `Bar ${String(bar + 1)}`)
    })
    return unsub
  }, [addEntry])

  const onClear = useCallback((): void => { setEntries([]) }, [])

  return (
    <div
      role="log"
      aria-label="Engine console"
      aria-live="polite"
      style={styles.root}
    >
      <div style={styles.header}>
        <span style={styles.headerLabel}>Console</span>
        <button
          style={styles.clearBtn}
          onClick={onClear}
          aria-label="Clear console"
        >
          Clear
        </button>
      </div>

      <div style={styles.body}>
        {entries.length === 0 && (
          <div style={styles.empty}>No output yet — eval a song or press play</div>
        )}
        {entries.map(entry => (
          <div key={entry.id} style={styles.row}>
            <span style={styles.timestamp}>{timeStr(entry.time)}</span>
            <span style={{ ...styles.badge, color: BADGE_COLOR[entry.badge], background: BADGE_BG[entry.badge] }}>
              {entry.badge}
            </span>
            <span style={{ ...styles.message, color: MESSAGE_COLOR[entry.badge] }}>
              {entry.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  )
}

/** Self-contained engine console panel — memoized, no props required. */
export const ConsoleLogPanel = memo(ConsoleLogPanelInner)

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display:       'flex',
    flexDirection: 'column' as const,
    height:        '100%',
    overflow:      'hidden',
    background:    '#080809',
    borderTop:     '1px solid #111116',
  },
  header: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '0.2rem 0.5rem',
    background:      '#0a0a0c',
    borderBottom:    '1px solid #111116',
    flexShrink:      0,
  },
  headerLabel: {
    fontSize:      '0.6rem',
    fontFamily:    "'JetBrains Mono', 'Fira Code', monospace",
    letterSpacing: '0.1em',
    color:         '#7a7a8a', // was #2a3a52 — 1.71:1 on #0a0a0c; now 5.02:1 (WCAG AA)
    textTransform: 'uppercase' as const,
  },
  clearBtn: {
    background:    'none',
    border:        '1px solid #1e1e22',
    color:         '#7a7a8a', // was #3a3a46 — 1.76:1 on #0a0a0c; now 5.02:1 (WCAG AA)
    fontSize:      '0.58rem',
    fontFamily:    'system-ui, sans-serif',
    letterSpacing: '0.06em',
    padding:       '0.1rem 0.35rem',
    borderRadius:  '2px',
    cursor:        'pointer',
  },
  body: {
    flex:       1,
    overflow:   'auto',
    padding:    '0.3rem 0.5rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:   '0.72rem',
    display:    'flex',
    flexDirection: 'column' as const,
    gap:        '1px',
  },
  empty: {
    color:   '#7a7a8a', // was #2a2a36 — insufficient contrast on #080809
    padding: '0.25rem 0',
  },
  row: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        '0.4rem',
    lineHeight: 1.5,
  },
  timestamp: {
    flexShrink:         0,
    color:              '#7a7a8a', // was #3a3a46 — 1.78:1 on #080809; now 5.02:1 (WCAG AA)
    fontSize:           '0.65rem',
    fontVariantNumeric: 'tabular-nums',
  },
  badge: {
    flexShrink:    0,
    fontSize:      '0.58rem',
    fontFamily:    'system-ui, sans-serif',
    letterSpacing: '0.08em',
    padding:       '0.05rem 0.3rem',
    borderRadius:  '2px',
    fontWeight:    600,
  },
  message: {
    wordBreak: 'break-all' as const,
    flex:      1,
  },
} as const
