import { useState, useEffect, useId } from 'react'
import type { HardwareLevel }         from '../../../main/ipc-types.js'

// ── Types ──────────────────────────────────────────────────────────────────────

type EngineState = {
  readonly playing: boolean
  readonly bpm:     number
  readonly bars:    number
}

type Props = {
  readonly hardware:     HardwareLevel
  readonly onHome:       () => void
  // Optional overrides — when provided, these fire instead of the default IPC calls.
  // Used by LiveCode to eval code before starting the engine.
  readonly onPlay?:      () => void
  readonly onStop?:      () => void
  readonly onBpmChange?: (bpm: number) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Fixed top bar present in all modes.
 * Subscribes to engine state pushed from the main process.
 * Play/stop/BPM changes are forwarded back via IPC.
 */
export const TransportBar = ({ hardware, onHome, onPlay, onStop, onBpmChange }: Props) => {
  const bpmId   = useId()
  const barsId  = useId()

  const [engine, setEngine] = useState<EngineState>({
    playing: false,
    bpm:     128,
    bars:    0,
  })

  const [localBpm, setLocalBpm] = useState(128)

  useEffect(() => {
    const off = window.scoreBridge.on('engine:state', payload => {
      setEngine(payload)
    })
    return off
  }, [])

  useEffect(() => {
    setLocalBpm(engine.bpm)
  }, [engine.bpm])

  const toggle = (): void => {
    if (engine.playing) {
      if (onStop) onStop()
      else window.scoreBridge.send('transport:stop', undefined)
    } else {
      if (onPlay) onPlay()
      else window.scoreBridge.send('transport:play', undefined)
    }
  }

  return (
    <div role="toolbar" aria-label="Transport controls" style={styles.bar}>

      {/* Home — return to splash */}
      <button
        aria-label="Score Studio home"
        style={styles.homeBtn}
        onClick={onHome}
        title="Back to mode selector"
      >
        Score
      </button>

      <div style={styles.divider} aria-hidden="true" />

      {/* Play / stop */}
      <button
        aria-label={engine.playing ? 'Stop' : 'Play'}
        aria-pressed={engine.playing}
        style={engine.playing ? { ...styles.playBtn, ...styles.playBtnActive } : styles.playBtn}
        onClick={toggle}
      >
        {engine.playing ? '■' : '▶'}
      </button>

      {/* BPM */}
      <div style={styles.bpmGroup}>
        <label htmlFor={bpmId} style={styles.label}>BPM</label>
        <input
          id={bpmId}
          style={styles.bpmInput}
          type="number"
          min={20}
          max={300}
          value={localBpm}
          onChange={e => {
            const bpm = Number(e.target.value)
            setLocalBpm(bpm)
            if (bpm >= 20 && bpm <= 300) {
              window.scoreBridge.send('transport:bpm-set', { bpm })
              onBpmChange?.(bpm)
            }
          }}
        />
      </div>

      {/* Bar counter */}
      <div style={styles.barCount}>
        <label htmlFor={barsId} style={styles.label}>Bar</label>
        <output id={barsId} htmlFor={bpmId} style={styles.value}>{engine.bars}</output>
      </div>

      {/* Hardware indicator */}
      <div style={styles.hwBadge} aria-label={`Hardware: ${hardware}`}>
        {hardware === 'pc-only'    && <span style={styles.hw}>PC</span>}
        {hardware === 'controller' && <span style={{ ...styles.hw, ...styles.hwActive }}>CTRL</span>}
        {hardware === 'aio'        && <span style={{ ...styles.hw, ...styles.hwActive }}>AIO</span>}
      </div>

    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  homeBtn: {
    background:    'none',
    border:        'none',
    color:         '#4a8fff',
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.75rem',
    fontWeight:    700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    cursor:        'pointer',
    padding:       '0.2rem 0.5rem',
    flexShrink:    0,
    opacity:       0.85,
  },
  divider: {
    width:      '1px',
    height:     '18px',
    background: '#252528',
    flexShrink: 0,
  },
  bar: {
    display:      'flex',
    alignItems:   'center',
    gap:          '1.1rem',
    height:       '42px',
    padding:      '0 0.85rem',
    background:   '#0e0e11',
    borderBottom: '1px solid #1e1e22',
    flexShrink:   0,
    userSelect:   'none' as const,
  },
  playBtn: {
    width:          '30px',
    height:         '30px',
    background:     '#111318',
    border:         '1px solid #252c3a',
    borderRadius:   '3px',
    color:          '#6a9fff',
    fontSize:       '0.75rem',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    transition:     'all 0.1s ease',
  },
  playBtnActive: {
    background: '#152035',
    border:     '1px solid #4a8fff',
    color:      '#7ab0ff',
    boxShadow:  '0 0 6px rgba(74,143,255,0.25)',
  },
  bpmGroup: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.3rem',
  },
  bpmInput: {
    width:              '52px',
    background:         '#080809',
    border:             '1px solid #1e1e22',
    borderRadius:       '2px',
    color:              '#c8d8f8',
    fontFamily:         "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:           '0.8rem',
    fontVariantNumeric: 'tabular-nums',
    padding:            '0.12rem 0.25rem',
    textAlign:          'center' as const,
  },
  barCount: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.3rem',
  },
  label: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.58rem',
    color:         '#3e3e46',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  value: {
    fontFamily:         "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:           '0.8rem',
    color:              '#9aadbe',
    fontVariantNumeric: 'tabular-nums',
    minWidth:           '2ch',
    textAlign:          'right' as const,
  },
  hwBadge: {
    marginLeft: 'auto',
  },
  hw: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.58rem',
    color:         '#3e3e46',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding:       '0.12rem 0.4rem',
    border:        '1px solid #1e1e22',
    borderRadius:  '2px',
  },
  hwActive: {
    color:      '#6a9fff',
    border:     '1px solid #253050',
    background: '#0d1928',
  },
} as const
