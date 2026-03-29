import React, { useState, useCallback, useEffect, useRef } from 'react'
import { CodeEditorPanel }  from '../shared/CodeEditorPanel.js'
import { PerformanceCanvas } from './PerformanceCanvas.js'
import { useAudioVisualState } from '../../hooks/useAudioVisualState.js'
import type { IpcAudioData } from '../../hooks/useAudioVisualState.js'
import type { TrackVisualState } from '@score/visuals'
import type { HardwareLevel } from '../../../main/ipc-types.js'

// ── Starter code for Performance Mode ─────────────────────────────────────────

const PERFORMANCE_STARTER = `import { Song, Kick808, Bass303 } from '@score/dsl'

const kick = Kick808().pattern([1,0,0,0,1,0,0,0]).volume(0.7)
const bass = Bass303('C2').cutoff(500).volume(0.6)

export default Song({ bpm: 130, tracks: [kick, bass] })`

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  readonly hardware: HardwareLevel
  readonly onHome:   () => void
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display:        'flex',
    flexDirection:  'column' as const,
    width:          '100vw',
    height:         '100vh',
    background:     '#050506',
    overflow:       'hidden',
  },
  body: {
    display:   'flex',
    flex:      1,
    overflow:  'hidden',
  },
  editorStrip: {
    width:      '30%',
    minWidth:   '240px',
    display:    'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid #111116',
    overflow:   'hidden',
  },
  toolbar: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '0.3rem 0.6rem',
    background:      '#080809',
    borderBottom:    '1px solid #111116',
    flexShrink:      0,
  },
  toolbarLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.5rem',
  },
  homeBtn: {
    background:    'none',
    border:        '1px solid #1e1e22',
    color:         '#3a3a46',
    fontSize:      '0.65rem',
    fontFamily:    'system-ui, sans-serif',
    letterSpacing: '0.06em',
    padding:       '0.2rem 0.45rem',
    borderRadius:  '2px',
    cursor:        'pointer',
  },
  modeLabel: {
    fontSize:      '0.6rem',
    fontFamily:    "'JetBrains Mono', monospace",
    letterSpacing: '0.1em',
    color:         '#2a3a52',
    textTransform: 'uppercase' as const,
  },
  tabHint: {
    fontSize:      '0.55rem',
    fontFamily:    'system-ui, sans-serif',
    letterSpacing: '0.06em',
    color:         '#1e2a3a',
  },
  editorContainer: {
    flex:     1,
    overflow: 'hidden',
  },
  canvasArea: {
    flex:     1,
    overflow: 'hidden',
    display:  'flex',
  },
} as const

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Performance Mode — 5th StudioMode entry for Algorave-style live sets.
 *
 * Layout: 30% Monaco editor strip (left) + 70% visual canvas (right).
 * Pressing `Tab` toggles the editor strip visibility for pure-visual performance.
 *
 * IPC wiring:
 * - `engine:analysis` → `audioRef` (waveform samples)
 * - `engine:tick`     → `stepRef`  (step + stepCount + bar + beat + bpm)
 * - `engine:state`    → `bpmRef`   (BPM)
 * - `song:update`     → `tracksRef` + `theme` state
 *
 * @param hardware - Selected hardware tier (reserved for future channel-to-controller wiring).
 * @param onHome   - Called when the user navigates back to the splash screen.
 */
export const PerformanceMode = ({ hardware: _hardware, onHome }: Props): React.JSX.Element => {
  const [code,          setCode]          = useState(PERFORMANCE_STARTER)
  const [editorVisible, setEditorVisible] = useState(true)
  const [theme,         setTheme]         = useState('dark-pulse')

  // Stable refs updated by IPC handlers — read by the rAF loop in useAudioVisualState
  const audioRef  = useRef<IpcAudioData>({ waveform: [] })
  const stepRef   = useRef<{ step: number; stepCount: number }>({ step: 0, stepCount: 16 })
  const bpmRef    = useRef<number>(120)
  const tracksRef = useRef<readonly TrackVisualState[]>([])

  // IPC subscriptions — update refs without triggering React renders
  useEffect(() => {
    const unsubAnalysis = window.scoreBridge.on('engine:analysis', ({ waveform }) => {
      audioRef.current = { waveform }
    })
    const unsubStep = window.scoreBridge.on('display:tick', ({ step, stepCount }) => {
      stepRef.current = { step, stepCount }
    })
    const unsubState = window.scoreBridge.on('engine:state', ({ bpm }) => {
      bpmRef.current = bpm
    })
    const unsubSong = window.scoreBridge.on('song:update', (payload) => {
      if (payload.theme !== undefined) setTheme(payload.theme)
      tracksRef.current = payload.tracks.map(t => ({
        name:    t.name,
        type:    t.type,
        active:  false,
        rms:     0,
        pattern: t.pattern.filter((v): v is number => typeof v === 'number'),
      }))
    })

    return () => {
      unsubAnalysis()
      unsubStep()
      unsubState()
      unsubSong()
    }
  }, [])

  // Tab key toggles editor visibility for pure-visual performance
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'TEXTAREA' && tag !== 'INPUT') {
          e.preventDefault()
          setEditorVisible(v => !v)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [])

  const handleEval = useCallback((): void => {
    window.scoreBridge.send('engine:eval', { code })
  }, [code])

  // Build AudioVisualState at ~60fps
  const visualState = useAudioVisualState(audioRef, stepRef, bpmRef, tracksRef)

  return (
    <div style={styles.root}>
      <div style={styles.body}>

        {editorVisible && (
          <div style={styles.editorStrip}>
            <div style={styles.toolbar}>
              <div style={styles.toolbarLeft}>
                <button style={styles.homeBtn} onClick={onHome}>← Home</button>
                <span style={styles.modeLabel}>Performance</span>
              </div>
              <span style={styles.tabHint}>Tab — hide editor</span>
            </div>
            <div style={styles.editorContainer}>
              <CodeEditorPanel
                value={code}
                onChange={setCode}
                onEval={handleEval}
              />
            </div>
          </div>
        )}

        <div style={styles.canvasArea}>
          <PerformanceCanvas
            state={visualState}
            theme={theme}
            editorVisible={editorVisible}
          />
        </div>

      </div>
    </div>
  )
}
