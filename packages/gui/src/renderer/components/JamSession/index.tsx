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
  root:         { display: 'flex', flexDirection: 'column' as const, height: '100vh' },
  body:         { display: 'flex', flex: 1, overflow: 'hidden' },
  midiPanel:    { flex: '0 0 280px', borderRight: '1px solid #2a2a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  muteMatrix:   { flex: 1, borderRight: '1px solid #2a2a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mappingPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholder:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.6rem', color: '#444' },
  placeholderIcon: { fontSize: '2.5rem' },
  sub:             { fontSize: '0.75rem', color: '#333' },
  statusBadge: {
    fontSize:      '0.65rem',
    letterSpacing: '0.1em',
    padding:       '0.2rem 0.6rem',
    borderRadius:  '4px',
  },
  statusBadgeOn:  { background: '#1a3a1a', color: '#4aff8f', border: '1px solid #4aff8f' },
  statusBadgeOff: { background: '#1a1a1e', color: '#666',    border: '1px solid #3a3a3e' },
  connectBtn: {
    padding:      '0.4rem 1rem',
    background:   '#1e2a3a',
    border:       '1px solid #4a8fff',
    borderRadius: '6px',
    color:        '#4a8fff',
    fontSize:     '0.85rem',
    cursor:       'pointer',
  },
} as const
