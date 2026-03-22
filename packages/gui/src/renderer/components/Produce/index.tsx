import { TransportBar } from '../shared/TransportBar.js'
import type { HardwareLevel } from '../../../main/ipc-types.js'

type Props = { readonly hardware: HardwareLevel; readonly onHome: () => void }

/**
 * Produce mode — DAW-style arrangement view.
 * Phase 13c: audio clip editor.
 * Phase 13d: automation lanes.
 * Phase 13e: plugin architecture.
 */
export const Produce = ({ hardware, onHome }: Props) => (
  <div style={styles.root}>
    <TransportBar hardware={hardware} onHome={onHome} />

    <div style={styles.body}>
      {/* Track headers */}
      <div style={styles.trackHeaders}>
        {/* Track headers — Phase 13 stubs */}
        <div style={styles.trackLanes}>
          {['Kick', 'Bass', 'Lead', 'Pad', 'FX'].map((name, i) => (
            <div key={name} style={styles.trackLane}>
              <div style={{ ...styles.trackLaneStrip, background: TRACK_COLORS[i] }} />
              <span style={styles.trackLaneName}>{name}</span>
              <button style={styles.trackLaneMute}>M</button>
            </div>
          ))}
        </div>
      </div>

      {/* Clip timeline */}
      <div style={styles.timeline}>
        {/* Timeline ruler + clip area */}
        <div style={styles.timelineRuler}>
          {[1,2,3,4,5,6,7,8].map(bar => (
            <span key={bar} style={{ ...styles.timelineRulerLabel, marginRight: '3rem' }}>{bar}</span>
          ))}
        </div>
        <div style={styles.timelineBody}>
          <div style={styles.placeholder}>
            <span style={styles.placeholderIcon}>▦</span>
            <span style={styles.sub}>Clip timeline — Phase 13c</span>
          </div>
        </div>
      </div>
    </div>

    {/* Mixer strip — collapsible bottom */}
    <div style={styles.mixerStrip}>
      <div style={styles.placeholder}>
        <span style={styles.sub}>Mixer — Phase 13</span>
      </div>
    </div>
  </div>
)

const styles = {
  root:  { display: 'flex', flexDirection: 'column' as const, height: '100vh', background: '#0c0c0e' },
  body:  { display: 'flex', flex: 1, overflow: 'hidden' },
  trackHeaders: {
    flex:        '0 0 200px',
    borderRight: '1px solid #1e1e22',
    display:     'flex',
    flexDirection: 'column' as const,
    background:  '#111113',
    overflowY:   'auto' as const,
  },
  timeline: {
    flex:    1,
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#0c0c0e',
  },
  mixerStrip: {
    height:       '130px',
    borderTop:    '1px solid #1e1e22',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    background:   '#0e0e11',
  },
  // Track header lane items (phase 13 — stubs)
  trackLanes: {
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           0,
    padding:       '0.5rem 0',
    flex:          1,
  },
  trackLane: {
    display:     'flex',
    alignItems:  'center',
    height:      '40px',
    borderBottom: '1px solid #1a1a1e',
    gap:         '0.5rem',
    paddingRight: '0.5rem',
  },
  trackLaneStrip: {
    width:     '3px',
    height:    '100%',
    flexShrink: 0,
  },
  trackLaneName: {
    fontFamily:  'system-ui, sans-serif',
    fontSize:    '0.72rem',
    color:       '#8a9aaa',
    flex:        1,
    whiteSpace:  'nowrap' as const,
    overflow:    'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  trackLaneMute: {
    fontFamily:  'system-ui, sans-serif',
    fontSize:    '0.55rem',
    color:       '#3e3e46',
    letterSpacing: '0.1em',
    padding:     '0.1rem 0.25rem',
    border:      '1px solid #1e1e22',
    borderRadius: '2px',
    cursor:      'pointer',
    background:  'none',
  },
  // Timeline ruler stub
  timelineRuler: {
    height:      '20px',
    borderBottom: '1px solid #1e1e22',
    background:  '#0e0e11',
    display:     'flex',
    alignItems:  'center',
    paddingLeft: '0.5rem',
  },
  timelineRulerLabel: {
    fontFamily:         "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:           '0.6rem',
    color:              '#3e3e46',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing:      '0.08em',
  },
  timelineBody: {
    flex:       1,
    display:    'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.5rem', color: '#2e2e36' },
  placeholderIcon: { fontFamily: 'monospace', fontSize: '2rem', color: '#2a4a6a' },
  sub:             { fontFamily: 'system-ui, sans-serif', fontSize: '0.7rem', color: '#2a2a32', letterSpacing: '0.06em' },
} as const

const TRACK_COLORS = ['#3a7a5a', '#3a5a8a', '#6a4a8a', '#8a6a3a', '#8a3a4a']
