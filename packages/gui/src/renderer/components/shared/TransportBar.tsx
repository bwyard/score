import { useState, useEffect, useId } from 'react'
import type { HardwareLevel }         from '../../../main/ipc-types.js'

// ── Types ──────────────────────────────────────────────────────────────────────

type EngineState = {
  readonly playing: boolean
  readonly bpm:     number
  readonly bars:    number
}

type Props = {
  readonly hardware: HardwareLevel
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Fixed top bar present in all modes.
 * Subscribes to engine state pushed from the main process.
 * Play/stop/BPM changes are forwarded back via IPC.
 */
export const TransportBar = ({ hardware }: Props) => {
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
      window.scoreBridge.send('transport:stop', undefined)
    } else {
      window.scoreBridge.send('transport:play', undefined)
    }
  }

  return (
    <div role="toolbar" aria-label="Transport controls" style={styles.bar}>

      {/* Play / stop */}
      <button
        aria-label={engine.playing ? 'Stop' : 'Play'}
        aria-pressed={engine.playing}
        style={styles.playBtn}
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
  bar: {
    display:      'flex',
    alignItems:   'center',
    gap:          '1.5rem',
    height:       '48px',
    padding:      '0 1rem',
    background:   '#111114',
    borderBottom: '1px solid #2a2a2e',
    flexShrink:   0,
  },
  playBtn: {
    width:          '36px',
    height:         '36px',
    background:     '#1e2a3a',
    border:         '1px solid #4a8fff',
    borderRadius:   '6px',
    color:          '#4a8fff',
    fontSize:       '1rem',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  bpmGroup: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.4rem',
  },
  bpmInput: {
    width:        '60px',
    background:   '#1a1a1e',
    border:       '1px solid #3a3a3e',
    borderRadius: '4px',
    color:        '#e8e8e8',
    fontSize:     '0.9rem',
    padding:      '0.2rem 0.4rem',
    textAlign:    'center' as const,
  },
  barCount: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.4rem',
  },
  label: {
    fontSize:      '0.65rem',
    color:         '#666',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  value: {
    fontSize:           '0.95rem',
    color:              '#e8e8e8',
    fontVariantNumeric: 'tabular-nums',
  },
  hwBadge: {
    marginLeft: 'auto',
  },
  hw: {
    fontSize:      '0.65rem',
    color:         '#666',
    letterSpacing: '0.08em',
    padding:       '0.2rem 0.5rem',
    border:        '1px solid #2a2a2e',
    borderRadius:  '4px',
  },
  hwActive: {
    color:      '#4a8fff',
    border:     '1px solid #4a8fff',
    background: '#1e2a3a',
  },
} as const
