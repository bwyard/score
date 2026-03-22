import { useState, useEffect } from 'react'
import { TransportBar }        from '../shared/TransportBar.js'
import type { HardwareLevel }  from '../../../main/ipc-types.js'

type Props = { readonly hardware: HardwareLevel; readonly onHome: () => void }

/**
 * Jam Session mode — live performance with MIDI hardware.
 * Powered by @score/session (createJamSession) in the main process.
 * Phase 13b: full jam session GUI, MIDI mapping visualiser, track mutes.
 */
export const JamSession = ({ hardware, onHome }: Props) => {
  const [midiConnected, setMidiConnected] = useState(false)

  useEffect(() => {
    const off = window.scoreBridge.on('midi:status', ({ connected }) => {
      setMidiConnected(connected)
    })
    return off
  }, [])

  const handleConnectMidi = (): void => {
    window.scoreBridge.send('midi:connect', undefined)
  }

  return (
    <div style={styles.root}>
      <TransportBar hardware={hardware} onHome={onHome} />

      <div style={styles.body}>
        {/* MIDI status + connect */}
        <div style={styles.midiPanel}>
          <div style={styles.placeholder}>
            <span style={styles.placeholderIcon}>⊕</span>
            <span>MIDI Controller</span>
            <span style={{
              ...styles.statusBadge,
              ...(midiConnected ? styles.statusBadgeOn : styles.statusBadgeOff),
            }}>
              {midiConnected ? 'CONNECTED' : 'NOT CONNECTED'}
            </span>
            {!midiConnected && (
              <button style={styles.connectBtn} onClick={handleConnectMidi}>
                Connect MIDI
              </button>
            )}
            <span style={styles.sub}>
              {hardware === 'aio'
                ? 'Pioneer XDJ — mapping loaded'
                : hardware === 'controller'
                  ? 'Generic MIDI controller'
                  : 'No hardware — keyboard + mouse only'}
            </span>
          </div>
        </div>

        {/* Track mute matrix — Phase 13b */}
        <div style={styles.muteMatrix}>
          <div style={styles.placeholder}>
            <span>Track mute matrix — Phase 13b</span>
            <span style={styles.sub}>Per-track mute · Volume · FX send</span>
          </div>
        </div>

        {/* MIDI mapping visualiser — Phase 13b */}
        <div style={styles.mappingPanel}>
          <div style={styles.placeholder}>
            <span>MIDI mapping — Phase 13b</span>
            <span style={styles.sub}>Controller → engine parameter visualiser</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root:         { display: 'flex', flexDirection: 'column' as const, height: '100vh', background: '#0c0c0e' },
  body:         { display: 'flex', flex: 1, overflow: 'hidden' },
  midiPanel:    {
    flex:            '0 0 260px',
    borderRight:     '1px solid #1e1e22',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    background:      '#111113',
  },
  muteMatrix:   {
    flex:        1,
    borderRight: '1px solid #1e1e22',
    display:     'flex',
    alignItems:  'center',
    justifyContent: 'center',
    background:  '#0c0c0e',
  },
  mappingPanel: {
    flex:    1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0c0c0e',
  },
  placeholder:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.6rem', color: '#2e2e36' },
  placeholderIcon: { fontFamily: 'monospace', fontSize: '2rem', color: '#2a4a6a' },
  sub:             { fontFamily: 'system-ui, sans-serif', fontSize: '0.7rem', color: '#2a2a32', letterSpacing: '0.06em' },
  statusBadge: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.6rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding:       '0.18rem 0.5rem',
    borderRadius:  '2px',
  },
  statusBadgeOn:  { background: '#0e2a1a', color: '#4adf8f', border: '1px solid #1a5a30' },
  statusBadgeOff: { background: '#111113', color: '#3e3e46', border: '1px solid #1e1e22' },
  connectBtn: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.75rem',
    letterSpacing: '0.08em',
    padding:       '0.35rem 0.9rem',
    background:    '#0e1825',
    border:        '1px solid #253050',
    borderRadius:  '3px',
    color:         '#4a8fff',
    cursor:        'pointer',
  },
} as const
