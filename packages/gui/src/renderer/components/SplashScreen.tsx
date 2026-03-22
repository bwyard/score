import { useState } from 'react'
import type { StudioMode, HardwareLevel } from '../../main/ipc-types.js'

// ── Types ──────────────────────────────────────────────────────────────────────

type ModeCard = {
  readonly id:          StudioMode
  readonly label:       string
  readonly description: string
  readonly icon:        string
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
  const [selectedMode,     setSelectedMode]     = useState<StudioMode | null>(null)
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
              aria-pressed={selectedMode === m.id}
              aria-describedby={`mode-desc-${m.id}`}
              style={{
                ...styles.modeCard,
                ...(selectedMode === m.id ? styles.modeCardActive : {}),
              }}
              onClick={() => setSelectedMode(m.id)}
            >
              <span aria-hidden="true" style={styles.modeIcon}>{m.icon}</span>
              <span style={styles.modeLabel}>{m.label}</span>
              <span id={`mode-desc-${m.id}`} style={styles.modeDesc}>{m.description}</span>
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
              aria-pressed={selectedHardware === h.id}
              aria-describedby={`hw-desc-${h.id}`}
              style={{
                ...styles.hwButton,
                ...(selectedHardware === h.id ? styles.hwButtonActive : {}),
              }}
              onClick={() => setSelectedHardware(h.id)}
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
        onClick={() => activeMode && onSelect(activeMode.id, selectedHardware)}
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
    gap:            '2rem',
    padding:        '2rem',
    background:     'radial-gradient(ellipse at center, #141418 0%, #0d0d0f 70%)',
  },
  header: {
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    gap:           '0.4rem',
  },
  logo: {
    fontSize:      '2rem',
    fontWeight:    700,
    letterSpacing: '0.05em',
    color:         '#e8e8e8',
    margin:        0,
  },
  tagline: {
    fontSize: '1rem',
    color:    '#888',
    margin:   0,
  },
  modeGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap:                 '1rem',
    maxWidth:            '900px',
    width:               '100%',
  },
  modeCard: {
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    gap:           '0.5rem',
    padding:       '1.5rem 1rem',
    background:    '#1a1a1e',
    border:        '1px solid #2a2a2e',
    borderRadius:  '12px',
    cursor:        'pointer',
    transition:    'all 0.15s ease',
    color:         '#e8e8e8',
  },
  modeCardActive: {
    background: '#1e2a3a',
    border:     '1px solid #4a8fff',
    boxShadow:  '0 0 20px rgba(74, 143, 255, 0.15)',
  },
  modeIcon: {
    fontSize:   '1.8rem',
    lineHeight: 1,
  },
  modeLabel: {
    fontSize:   '1rem',
    fontWeight: 600,
  },
  modeDesc: {
    fontSize:   '0.75rem',
    color:      '#888',
    textAlign:  'center' as const,
    lineHeight: 1.4,
  },
  hardwareRow: {
    display: 'flex',
    gap:     '0.75rem',
  },
  hwButton: {
    display:       'flex',
    flexDirection: 'column' as const,
    alignItems:    'center',
    gap:           '0.2rem',
    padding:       '0.6rem 1.2rem',
    background:    '#1a1a1e',
    border:        '1px solid #2a2a2e',
    borderRadius:  '8px',
    cursor:        'pointer',
    color:         '#e8e8e8',
  },
  hwButtonActive: {
    background: '#1e2a3a',
    border:     '1px solid #4a8fff',
  },
  hwLabel: {
    fontSize:   '0.85rem',
    fontWeight: 600,
  },
  hwDesc: {
    fontSize: '0.7rem',
    color:    '#888',
  },
  startButton: {
    padding:       '0.75rem 3rem',
    fontSize:      '1rem',
    fontWeight:    600,
    background:    '#4a8fff',
    color:         '#fff',
    border:        'none',
    borderRadius:  '8px',
    cursor:        'pointer',
    letterSpacing: '0.03em',
    transition:    'all 0.15s ease',
  },
  startButtonDisabled: {
    background: '#2a2a2e',
    color:      '#666',
    cursor:     'not-allowed',
  },
} as const
