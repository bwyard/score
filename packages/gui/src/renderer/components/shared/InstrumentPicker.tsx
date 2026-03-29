// InstrumentPicker.tsx — Instrument selection modal.
//
// Renders a grid of instrument type buttons grouped by category.
// Clicking a button fires onPick(instrumentType). Escape or close button fires onClose().
//
// No audio, no IPC — pure props in, callbacks out.

import React, { useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link InstrumentPicker}. */
export type InstrumentPickerProps = {
  /** Called when the user selects an instrument. @param instrumentType - DSL type string, e.g. `'kick'`. */
  readonly onPick:  (instrumentType: string) => void
  /** Called when the picker should be dismissed (Escape key or close button). */
  readonly onClose: () => void
}

// ── Instrument catalogue ──────────────────────────────────────────────────────

type InstrumentEntry = { readonly label: string; readonly type: string }

const DRUMS: readonly InstrumentEntry[] = [
  { label: 'Kick',    type: 'kick'    },
  { label: 'Snare',   type: 'snare'   },
  { label: 'HiHat',   type: 'hihat'   },
  { label: 'Clap',    type: 'clap'    },
  { label: 'Crash',   type: 'crash'   },
  { label: 'Ride',    type: 'ride'    },
]

const MELODIC: readonly InstrumentEntry[] = [
  { label: 'Bass303', type: 'bass303'  },
  { label: 'SubSynth',type: 'subsynth' },
  { label: 'Synth',   type: 'synth'   },
  { label: 'Pad',     type: 'pad'     },
  { label: 'Pluck',   type: 'pluck'   },
  { label: 'FMSynth', type: 'fmsynth' },
]

const OTHER: readonly InstrumentEntry[] = [
  { label: 'Sample',  type: 'sample'  },
  { label: 'Arp',     type: 'arp'     },
]

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0,
    background: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#111', border: '1px solid #333', borderRadius: 6,
    padding: '16px 20px', minWidth: 340, position: 'relative' as const,
  },
  header: {
    display: 'flex', flexDirection: 'row' as const,
    alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  title: { fontSize: 12, color: '#ccc', fontFamily: 'monospace', fontWeight: 'bold' as const },
  closeBtn: {
    background: 'none', border: '1px solid #444', borderRadius: 2,
    color: '#888', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace',
    padding: '2px 8px',
  },
  section: { marginBottom: 10 },
  sectionLabel: {
    fontSize: 9, color: '#555', fontFamily: 'monospace',
    textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6,
  },
  grid: {
    display: 'flex', flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6,
  },
  instrBtn: {
    background: '#1a1a1a', border: '1px solid #333', borderRadius: 3,
    color: '#aaa', cursor: 'pointer', fontSize: 10, fontFamily: 'monospace',
    padding: '4px 10px', minWidth: 56,
  },
} as const

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Instrument selection modal.
 *
 * Renders a dark modal overlay with a grid of instrument type buttons grouped
 * by category (Drums, Melodic, Other). Clicking a button fires `onPick(type)`.
 * Pressing Escape or clicking the close button fires `onClose()`.
 *
 * @example
 * ```tsx
 * <InstrumentPicker
 *   onPick={type => addTrack(type)}
 *   onClose={() => setPickerOpen(false)}
 * />
 * ```
 */
export const InstrumentPicker = (props: InstrumentPickerProps): React.JSX.Element => {
  const { onPick, onClose } = props

  const modalRef = useRef<HTMLDivElement>(null)

  // Initial focus, Escape dismiss, focus trap
  useEffect(() => {
    const modal = modalRef.current
    if (modal === null) return

    modal.querySelector<HTMLButtonElement>('button')?.focus()

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])')
      )
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [onClose])

  const renderGroup = (entries: readonly InstrumentEntry[]) => (
    <div style={styles.grid}>
      {entries.map(({ label, type }) => (
        <button
          key={type}
          style={styles.instrBtn}
          aria-label={label}
          onClick={() => { onPick(type) }}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div style={styles.overlay} data-testid="instrument-picker-overlay">
      <div ref={modalRef} style={styles.modal} role="dialog" aria-modal="true" aria-label="Pick an instrument">

        <div style={styles.header}>
          <span style={styles.title}>Add Instrument</span>
          <button style={styles.closeBtn} aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Drums</div>
          {renderGroup(DRUMS)}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Melodic</div>
          {renderGroup(MELODIC)}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Other</div>
          {renderGroup(OTHER)}
        </div>

      </div>
    </div>
  )
}
