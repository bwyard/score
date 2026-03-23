import { useState } from 'react'
import type { StudioMode, HardwareLevel } from '../../main/ipc-types.js'

// ── Types ──────────────────────────────────────────────────────────────────────

type ModeCard = {
  readonly id:          StudioMode
  readonly label:       string
  readonly description: string
  readonly icon:        string
  readonly disabled?:   boolean
}

type HardwareOption = {
  readonly id:          HardwareLevel
  readonly label:       string
  readonly description: string
}

// ── Data ───────────────────────────────────────────────────────────────────────

const MODES: readonly ModeCard[] = [
  {
    id:          'live-code',
    label:       'Live Code',
    description: 'Write music as code. Real-time evaluation with visualizer.',
    icon:        '{ }',
  },
  {
    id:          'produce',
    label:       'Produce',
    description: 'Arrange tracks, automate parameters, export stems.',
    icon:        '▦',
  },
  {
    id:          'dj-set',
    label:       'DJ Set',
    description: 'Mix decks, manage cues, crossfade. Score is your DJ software.',
    icon:        '⊙',
  },
  {
    id:          'jam-session',
    label:       'Jam Session',
    description: 'Perform live with MIDI hardware. Patch anything to anything.',
    icon:        '⊕',
  },
]

const HARDWARE_LEVELS: readonly HardwareOption[] = [
  { id: 'pc-only',    label: 'PC Only',      description: 'Keyboard + mouse' },
  { id: 'controller', label: '+ Controller', description: 'MIDI controller connected' },
  { id: 'aio',        label: '+ AIO',        description: 'Pioneer XDJ all-in-one' },
]

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  readonly onSelect: (mode: StudioMode, hardware: HardwareLevel) => void
}

export const SplashScreen = ({ onSelect }: Props) => {
  const [selectedMode,     setSelectedMode]     = useState<StudioMode | null>('live-code')
  const [selectedHardware, setSelectedHardware] = useState<HardwareLevel>('pc-only')

  const activeMode = MODES.find(m => m.id === selectedMode)

  return (
    <main style={styles.root} aria-label="Score Studio mode selector">
      <header style={styles.header}>
        <h1 style={styles.logo}>Score Studio</h1>
        <p   style={styles.tagline}>What are you doing today?</p>
      </header>

      {/* Mode selection */}
      <section aria-label="Select a mode">
        <div role="group" aria-label="Studio modes" style={styles.modeGrid}>
          {MODES.map(m => (
            <button
              key={m.id}
              aria-label={m.disabled ? `${m.label} — coming soon` : m.label}
              aria-pressed={selectedMode === m.id}
              aria-describedby={`mode-desc-${m.id}`}
              aria-disabled={m.disabled}
              disabled={m.disabled}
              style={{
                ...styles.modeCard,
                ...(selectedMode === m.id ? styles.modeCardActive : {}),
                ...(m.disabled ? styles.modeCardDisabled : {}),
              }}
              onClick={() => { if (!m.disabled) setSelectedMode(m.id) }}
            >
              <span aria-hidden="true" style={styles.modeIcon}>{m.icon}</span>
              <span style={styles.modeLabel}>{m.label}</span>
              <span id={`mode-desc-${m.id}`} style={styles.modeDesc}>
                {m.disabled ? 'Coming soon' : m.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Hardware level */}
      <section aria-label="Select hardware level">
        <div role="group" aria-label="Hardware options" style={styles.hardwareRow}>
          {HARDWARE_LEVELS.map(h => (
            <button
              key={h.id}
              aria-label={h.label}
              aria-pressed={selectedHardware === h.id}
              aria-describedby={`hw-desc-${h.id}`}
              style={{
                ...styles.hwButton,
                ...(selectedHardware === h.id ? styles.hwButtonActive : {}),
              }}
              onClick={() => { setSelectedHardware(h.id) }}
            >
              <span style={styles.hwLabel}>{h.label}</span>
              <span id={`hw-desc-${h.id}`} style={styles.hwDesc}>{h.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Start */}
      <button
        style={{
          ...styles.startButton,
          ...(activeMode ? {} : styles.startButtonDisabled),
        }}
        disabled={activeMode === undefined}
        aria-label={activeMode ? `Start ${activeMode.label}` : 'Select a mode to continue'}
        onClick={() => { if (activeMode) onSelect(activeMode.id, selectedHardware) }}
      >
        {activeMode ? `Start ${activeMode.label}` : 'Select a mode'}
      </button>
    </main>
  )
}

// ── Styles (inline — no CSS deps at scaffold stage) ───────────────────────────

const styles = {
  root: {
    display:        'flex',
    flexDirection:  'column' as const,
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100vh',
    gap:            '1.75rem',
    padding:        '2rem',
    background:     'linear-gradient(180deg, #0c0c0e 0%, #0e0e12 100%)',
  },
  header: {
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    gap:           '0.3rem',
  },
  logo: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '1.6rem',
    fontWeight:    700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color:         '#c8d8f8',
    margin:        0,
  },
  tagline: {
    fontFamily: 'system-ui, sans-serif',
    fontSize:   '0.8rem',
    color:      '#4a4a52',
    margin:     0,
    letterSpacing: '0.06em',
  },
  modeGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap:                 '0.75rem',
    maxWidth:            '860px',
    width:               '100%',
  },
  modeCard: {
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    gap:           '0.4rem',
    padding:       '1.25rem 0.75rem',
    background:    '#111113',
    border:        '1px solid #1e1e22',
    borderRadius:  '4px',
    cursor:        'pointer',
    color:         '#888',
    transition:    'border-color 0.1s ease, background 0.1s ease',
  },
  modeCardActive: {
    background:  '#111825',
    border:      '1px solid #2a4a7a',
    color:       '#c8d8f8',
    boxShadow:   '0 0 16px rgba(74,143,255,0.12)',
  },
  modeCardDisabled: {
    opacity:     0.35,
    cursor:      'not-allowed',
    background:  '#0c0c0e',
    border:      '1px solid #161618',
  },
  modeIcon: {
    fontFamily: 'monospace',
    fontSize:   '1.5rem',
    lineHeight: 1,
    color:      '#4a8fff',
    opacity:    0.7,
  },
  modeLabel: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.85rem',
    fontWeight:    600,
    letterSpacing: '0.04em',
  },
  modeDesc: {
    fontFamily: 'system-ui, sans-serif',
    fontSize:   '0.7rem',
    color:      '#4a4a52',
    textAlign:  'center' as const,
    lineHeight: 1.4,
  },
  hardwareRow: {
    display: 'flex',
    gap:     '0.5rem',
  },
  hwButton: {
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    gap:           '0.15rem',
    padding:       '0.5rem 1rem',
    background:    '#111113',
    border:        '1px solid #1e1e22',
    borderRadius:  '3px',
    cursor:        'pointer',
    color:         '#888',
    transition:    'border-color 0.1s ease, background 0.1s ease',
  },
  hwButtonActive: {
    background: '#111825',
    border:     '1px solid #2a4a7a',
    color:      '#c8d8f8',
  },
  hwLabel: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.78rem',
    fontWeight:    600,
    letterSpacing: '0.04em',
  },
  hwDesc: {
    fontFamily: 'system-ui, sans-serif',
    fontSize:   '0.65rem',
    color:      '#3e3e46',
  },
  startButton: {
    padding:       '0.6rem 2.5rem',
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.85rem',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    background:    '#1a3060',
    color:         '#8ab8ff',
    border:        '1px solid #2a4a8a',
    borderRadius:  '3px',
    cursor:        'pointer',
    transition:    'all 0.1s ease',
  },
  startButtonDisabled: {
    background: '#111113',
    color:      '#3e3e46',
    border:     '1px solid #1e1e22',
    cursor:     'not-allowed',
  },
} as const
