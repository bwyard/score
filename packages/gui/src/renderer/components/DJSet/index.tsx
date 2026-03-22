import { useState }     from 'react'
import { TransportBar } from '../shared/TransportBar.js'
import type { HardwareLevel } from '../../../main/ipc-types.js'

// ── Default code shown in the code panel ───────────────────────────────────────

const STARTER = `import { Song, Kick, Synth } from '@score/core'

const kick = Kick({
  pattern: [1, 0, 0, 0, 1, 0, 0, 0],
  volume:  0.9,
})

export default Song({
  bpm:    130,
  tracks: [kick],
})`

// ── Component ──────────────────────────────────────────────────────────────────

type Props = { readonly hardware: HardwareLevel; readonly onHome: () => void }

/**
 * DJ Set mode — Score IS the DJ software when no AIO hardware is connected.
 * PC-only: full deck view with waveforms, beat grid, hot cues, crossfader, FX.
 * + Controller: same layout, hardware MIDI maps to the same handlers.
 * + AIO (Pioneer XDJ): AIO display becomes primary; Score mirrors state.
 *
 * Code panel: visible when playing code-driven tracks.
 * Phase 12e: deck management, BPM analysis, key detection, hot cues,
 *            library/crate management, two-deck sync engine, stem separation.
 */
export const DJSet = ({ hardware, onHome }: Props) => {
  const [codeOpen,    setCodeOpen]    = useState(false)
  const [code,        setCode]        = useState(STARTER)

  return (
    <div style={styles.root}>
      <TransportBar hardware={hardware} onHome={onHome} />

      <div style={styles.body}>
        {/* Code panel — collapsible left sidebar */}
        <div style={{ ...styles.codePanel, width: codeOpen ? '280px' : '0' }}>
          {codeOpen && (
            <>
              <div style={styles.codePanelHeader}>
                <span style={styles.codePanelTitle}>song.ts</span>
                <button
                  style={styles.codeToggleBtn}
                  onClick={() => { setCodeOpen(false) }}
                  aria-label="Close code panel"
                >
                  ✕
                </button>
              </div>
              <textarea
                style={styles.codeEditor}
                value={code}
                onChange={e => { setCode(e.target.value) }}
                spellCheck={false}
                aria-label="Song code"
              />
            </>
          )}
        </div>

        {/* Code toggle tab */}
        {!codeOpen && (
          <button
            style={styles.codeTab}
            onClick={() => { setCodeOpen(true) }}
            aria-label="Open code panel"
            title="Show song code"
          >
            {'{ }'}
          </button>
        )}

        {/* Deck A */}
        <div style={styles.deck}>
          <div style={styles.deckHeader}>
            <span style={styles.deckLabel}>A</span>
            <span style={styles.deckSub}>Deck A</span>
          </div>
          <div style={styles.placeholder}>
            <span style={styles.placeholderIcon}>⊙</span>
            <span style={styles.placeholderText}>Waveform · Beat grid · Hot cues</span>
            <span style={styles.sub}>Phase 12e</span>
          </div>
        </div>

        {/* Centre strip — crossfader + FX */}
        <div style={styles.centreStrip}>
          <div style={styles.placeholder}>
            <span style={styles.sub}>FX</span>
            <div style={styles.crossfaderTrack}>
              <div style={styles.crossfaderThumb} />
            </div>
            <span style={styles.sub}>Phase 12e</span>
          </div>
        </div>

        {/* Deck B */}
        <div style={styles.deck}>
          <div style={styles.deckHeader}>
            <span style={styles.deckLabel}>B</span>
            <span style={styles.deckSub}>Deck B</span>
          </div>
          <div style={styles.placeholder}>
            <span style={styles.placeholderIcon}>⊙</span>
            <span style={styles.placeholderText}>Waveform · Beat grid · Hot cues</span>
            <span style={styles.sub}>Phase 12e</span>
          </div>
        </div>
      </div>

      {/* Library / crate browser */}
      <div style={styles.library}>
        <div style={styles.libraryHeader}>
          <span style={styles.libraryLabel}>Library</span>
          <span style={styles.sub}>
            {hardware === 'aio' ? 'AIO display mirrors library' : 'Drag tracks to decks · Phase 12e'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root:   { display: 'flex', flexDirection: 'column' as const, height: '100vh', background: '#0c0c0e' },
  body:   { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' as const },

  // Code panel
  codePanel: {
    borderRight:   '1px solid #1e1e22',
    background:    '#0d0d10',
    display:       'flex',
    flexDirection: 'column' as const,
    overflow:      'hidden',
    transition:    'width 0.15s ease',
    flexShrink:    0,
  },
  codePanelHeader: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '0.3rem 0.5rem',
    background:      '#111113',
    borderBottom:    '1px solid #1e1e22',
    flexShrink:      0,
  },
  codePanelTitle: {
    fontFamily:  "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:    '0.7rem',
    color:       '#4a4a52',
    letterSpacing: '0.04em',
  },
  codeToggleBtn: {
    background:  'none',
    border:      'none',
    color:       '#3e3e46',
    fontSize:    '0.65rem',
    cursor:      'pointer',
    padding:     '0.1rem 0.25rem',
  },
  codeEditor: {
    flex:       1,
    width:      '100%',
    background: '#080809',
    color:      '#8a9ab8',
    border:     'none',
    outline:    'none',
    padding:    '0.6rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:   '0.72rem',
    lineHeight: 1.6,
    resize:     'none' as const,
    tabSize:    2,
  },
  codeTab: {
    position:    'absolute' as const,
    left:        0,
    top:         '50%',
    transform:   'translateY(-50%)',
    background:  '#111113',
    border:      '1px solid #1e1e22',
    borderLeft:  'none',
    borderRadius: '0 3px 3px 0',
    color:       '#3e3e46',
    fontFamily:  'monospace',
    fontSize:    '0.7rem',
    padding:     '0.4rem 0.25rem',
    cursor:      'pointer',
    writingMode: 'vertical-rl' as const,
    letterSpacing: '0.12em',
    zIndex:      1,
  },

  // Decks
  deck: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column' as const,
    borderRight:   '1px solid #1e1e22',
    background:    '#0e0e11',
  },
  deckHeader: {
    display:      'flex',
    alignItems:   'center',
    gap:          '0.4rem',
    padding:      '0.4rem 0.7rem',
    borderBottom: '1px solid #1e1e22',
    background:   '#111113',
    flexShrink:   0,
  },
  deckLabel: {
    fontFamily:  "'JetBrains Mono', 'Fira Code', monospace",
    fontSize:    '1rem',
    fontWeight:  700,
    color:       '#4a8fff',
    lineHeight:  1,
  },
  deckSub: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.65rem',
    color:         '#3e3e46',
    letterSpacing: '0.08em',
  },
  centreStrip: {
    flex:            '0 0 160px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    borderRight:     '1px solid #1e1e22',
    background:      '#111113',
  },
  crossfaderTrack: {
    width:        '100px',
    height:       '4px',
    background:   '#1e1e22',
    borderRadius: '2px',
    position:     'relative' as const,
    margin:       '0.5rem 0',
  },
  crossfaderThumb: {
    position:     'absolute' as const,
    left:         '50%',
    top:          '-4px',
    transform:    'translateX(-50%)',
    width:        '10px',
    height:       '12px',
    background:   '#252528',
    border:       '1px solid #3a3a42',
    borderRadius: '2px',
  },

  // Library
  library: {
    height:       '160px',
    borderTop:    '1px solid #1e1e22',
    display:      'flex',
    flexDirection: 'column' as const,
    background:   '#111113',
  },
  libraryHeader: {
    display:      'flex',
    alignItems:   'center',
    gap:          '1rem',
    padding:      '0.4rem 0.75rem',
    borderBottom: '1px solid #1e1e22',
    background:   '#0e0e11',
    flexShrink:   0,
  },
  libraryLabel: {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '0.65rem',
    color:         '#4a4a52',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },

  // Shared placeholders
  placeholder:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.4rem' },
  placeholderIcon: { fontFamily: 'monospace', fontSize: '1.8rem', color: '#1e2e3e', lineHeight: 1 },
  placeholderText: { fontFamily: 'system-ui, sans-serif', fontSize: '0.7rem', color: '#2a2a32' },
  sub:             { fontFamily: 'system-ui, sans-serif', fontSize: '0.65rem', color: '#2a2a32', letterSpacing: '0.06em' },
} as const
