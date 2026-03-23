// BugReportModal.tsx — Non-coder-friendly bug report modal
//
// Captures a description from the user, bundles it with:
//   - the current code in the editor
//   - the last 20 console log entries
//   - the current engine state
// and offers two export paths:
//   - "Copy Report" — writes JSON to clipboard (no IPC needed, always works)
//   - "Save Report" — sends bug:report IPC (main process saves to Downloads)
//
// Design: zero technical jargon shown to user. "What's included" is collapsed.

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for the BugReportModal. */
export type BugReportModalProps = {
  /** Whether the modal is visible. */
  readonly isOpen: boolean
  /** Called when the user dismisses the modal. */
  readonly onClose: () => void
  /** Returns the current code in the editor — captured at submit time. */
  readonly getCurrentCode: () => string
  /** Returns recent log lines — captured at submit time. */
  readonly getRecentLogs: () => string[]
  /** Current engine state snapshot. */
  readonly engineState: Record<string, unknown>
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A non-technical bug report modal.
 *
 * Presents a simple "What happened?" text area. No raw JSON or
 * technical fields are shown to the user — everything is captured
 * automatically and bundled into the report on submit.
 *
 * Two submit paths:
 * - "Copy Report" — copies JSON to clipboard, always available
 * - "Save Report" — sends `bug:report` IPC; main saves to Downloads
 *
 * @example
 * ```tsx
 * <BugReportModal
 *   isOpen={isBugOpen}
 *   onClose={() => setIsBugOpen(false)}
 *   getCurrentCode={() => currentCode}
 *   getRecentLogs={() => recentLogs}
 *   engineState={engineState}
 * />
 * ```
 */
export const BugReportModal = ({
  isOpen,
  onClose,
  getCurrentCode,
  getRecentLogs,
  engineState,
}: BugReportModalProps) => {
  const [description, setDescription] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copied, setCopied]           = useState(false)

  if (!isOpen) return null

  const buildReport = () => ({
    description,
    code:        getCurrentCode(),
    logs:        JSON.stringify(getRecentLogs()),
    timestamp:   Date.now(),
    engineState,
  })

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(JSON.stringify(buildReport(), null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => { setCopied(false) }, 2000)
    })
  }

  const handleSave = (): void => {
    window.scoreBridge.send('bug:report', buildReport())
    onClose()
  }

  const handleClose = (): void => {
    setDescription('')
    setDetailsOpen(false)
    setCopied(false)
    onClose()
  }

  const codePreview = getCurrentCode().split('\n').slice(0, 3).join('\n')
  const logCount    = getRecentLogs().length

  return (
    <div role="dialog" aria-modal="true" aria-label="Report an issue" style={styles.overlay}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Report an Issue</h2>
          <button
            aria-label="Close"
            style={styles.closeBtn}
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <label style={styles.label} htmlFor="bug-description">
          What happened?
        </label>
        <textarea
          id="bug-description"
          style={styles.textarea}
          rows={4}
          placeholder="Describe what you were doing and what went wrong..."
          value={description}
          onChange={e => { setDescription(e.target.value) }}
        />

        {/* What's included — collapsed disclosure */}
        <button
          aria-expanded={detailsOpen}
          style={styles.disclosureBtn}
          onClick={() => { setDetailsOpen(v => !v) }}
        >
          <span style={styles.disclosureArrow}>{detailsOpen ? '▾' : '▸'}</span>
          What&apos;s included
        </button>

        {detailsOpen && (
          <div style={styles.details} aria-label="Report contents">
            <p style={styles.detailItem}>
              <span style={styles.detailKey}>Code snapshot</span>
              <code style={styles.codeSnippet}>{codePreview}{'\n…'}</code>
            </p>
            <p style={styles.detailItem}>
              <span style={styles.detailKey}>Recent activity</span>
              <span style={styles.detailVal}>{logCount} recent {logCount === 1 ? 'event' : 'events'}</span>
            </p>
            <p style={styles.detailItem}>
              <span style={styles.detailKey}>Engine state</span>
              <span style={styles.detailVal}>Included automatically</span>
            </p>
            <p style={styles.detailItem}>
              <span style={styles.detailKey}>No personal data</span>
              <span style={styles.detailVal}>Only what you see above</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
          <button style={styles.copyBtn} onClick={handleCopy} aria-live="polite">
            {copied ? 'Copied ✓' : 'Copy Report'}
          </button>
          <button style={styles.saveBtn} onClick={handleSave}>
            Save Report
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position:        'fixed' as const,
    inset:           0,
    background:      'rgba(0,0,0,0.7)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          1000,
  },
  card: {
    background:      '#0e0e11',
    border:          '1px solid #1e1e22',
    borderRadius:    8,
    padding:         24,
    width:           480,
    maxWidth:        'calc(100vw - 32px)',
    display:         'flex',
    flexDirection:   'column' as const,
    gap:             12,
    boxShadow:       '0 8px 32px rgba(0,0,0,0.6)',
  },
  header: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    4,
  },
  title: {
    margin:          0,
    fontSize:        16,
    fontWeight:      600,
    color:           '#c8d8f8',
    letterSpacing:   '0.02em',
  },
  closeBtn: {
    background:      'none',
    border:          'none',
    color:           '#556688',
    fontSize:        16,
    cursor:          'pointer',
    padding:         '2px 6px',
    borderRadius:    4,
    lineHeight:      1,
  },
  label: {
    fontSize:        13,
    color:           '#8899bb',
    fontWeight:      500,
  },
  textarea: {
    width:           '100%',
    background:      '#12121a',
    border:          '1px solid #2a2a35',
    borderRadius:    6,
    color:           '#c8d8f8',
    fontSize:        13,
    padding:         '8px 10px',
    resize:          'vertical' as const,
    fontFamily:      'inherit',
    outline:         'none',
    boxSizing:       'border-box' as const,
  },
  disclosureBtn: {
    background:      'none',
    border:          'none',
    color:           '#556688',
    fontSize:        12,
    cursor:          'pointer',
    padding:         0,
    textAlign:       'left' as const,
    display:         'flex',
    alignItems:      'center',
    gap:             4,
  },
  disclosureArrow: {
    fontSize:        10,
    color:           '#445577',
  },
  details: {
    background:      '#0a0a10',
    border:          '1px solid #1a1a22',
    borderRadius:    6,
    padding:         '10px 12px',
    display:         'flex',
    flexDirection:   'column' as const,
    gap:             6,
  },
  detailItem: {
    margin:          0,
    display:         'flex',
    flexDirection:   'column' as const,
    gap:             2,
  },
  detailKey: {
    fontSize:        11,
    color:           '#445577',
    fontWeight:      600,
    textTransform:   'uppercase' as const,
    letterSpacing:   '0.05em',
  },
  detailVal: {
    fontSize:        12,
    color:           '#8899bb',
  },
  codeSnippet: {
    fontSize:        11,
    color:           '#6a9fff',
    fontFamily:      'monospace',
    whiteSpace:      'pre' as const,
    overflow:        'hidden',
    maxHeight:       48,
    display:         'block',
  },
  actions: {
    display:         'flex',
    gap:             8,
    justifyContent:  'flex-end',
    marginTop:       4,
  },
  cancelBtn: {
    background:      'none',
    border:          '1px solid #2a2a35',
    color:           '#8899bb',
    borderRadius:    6,
    padding:         '7px 16px',
    fontSize:        13,
    cursor:          'pointer',
  },
  copyBtn: {
    background:      '#1a1a24',
    border:          '1px solid #2a2a35',
    color:           '#c8d8f8',
    borderRadius:    6,
    padding:         '7px 16px',
    fontSize:        13,
    cursor:          'pointer',
  },
  saveBtn: {
    background:      '#4a8fff',
    border:          'none',
    color:           '#fff',
    borderRadius:    6,
    padding:         '7px 16px',
    fontSize:        13,
    cursor:          'pointer',
    fontWeight:      600,
  },
} as const
