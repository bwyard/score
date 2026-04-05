// InstrumentPanel.tsx — Per-track instrument parameter panel.
//
// Renders instrument-type-specific controls: labeled range sliders + mute button.
// Each slider fires onChange(method, value) where method is a chain API method name
// (e.g. 'volume', 'reverb', 'filter'). The consumer wires onChange to patchChainMethod.
//
// No audio, no IPC — pure props in, callbacks out.

import React from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link InstrumentPanel}. */
export type InstrumentPanelProps = {
  /** Zero-based track index — used for unique input IDs. */
  readonly trackIndex:     number
  /** DSL instrument type string, e.g. 'kick', 'synth', 'bass303'. */
  readonly instrumentType: string
  /** Display name for the track (shown at top of panel). */
  readonly trackName:      string
  /** Current parameter values keyed by chain API method name. */
  readonly params:         Record<string, number | string>
  /** Whether this track is currently muted. */
  readonly muted:          boolean
  /**
   * Called when a control changes.
   * @param method - Chain API method name, e.g. `'volume'`, `'reverb'`, `'filter'`.
   * @param value  - New value (number or string).
   */
  readonly onChange:  (method: string, value: number | string) => void
  /** Called when the mute button is clicked. */
  readonly onMute:    () => void
}

// ── Internal control types ────────────────────────────────────────────────────

type SliderControl = {
  readonly kind:    'slider'
  readonly label:   string
  readonly method:  string
  readonly min:     number
  readonly max:     number
  readonly step:    number
  readonly default: number
}

type CheckboxControl = {
  readonly kind:   'checkbox'
  readonly label:  string
  readonly method: string
}

type SelectControl = {
  readonly kind:    'select'
  readonly label:   string
  readonly method:  string
  readonly options: readonly { readonly value: string; readonly label: string }[]
}

type Control = SliderControl | CheckboxControl | SelectControl

const slider = (
  label: string, method: string, min: number, max: number, step: number, def: number,
): SliderControl => ({ kind: 'slider', label, method, min, max, step, default: def })

// _checkbox available for future controls (e.g. HiHat open, gate mode)
const _checkbox = (label: string, method: string): CheckboxControl =>
  ({ kind: 'checkbox', label, method })

const select = (
  label: string, method: string, options: readonly { readonly value: string; readonly label: string }[],
): SelectControl => ({ kind: 'select', label, method, options })

// ── Control definitions per instrument type ───────────────────────────────────

// ── Universal controls — shown on every instrument type ───────────────────────
// These map directly to chain API methods: .swing(v), .humanize(v), etc.

const UNIVERSAL_CONTROLS: readonly Control[] = [
  slider('Pan',      'pan',      -1,   1,   0.01, 0),
  slider('Swing',    'swing',     0,   0.5, 0.01, 0),
  slider('Humanize', 'humanize',  0,   0.1, 0.001, 0),
  slider('Degrade',  'degrade',   0,   1,   0.01, 0),
  slider('Stutter',  'stutter',   1,   8,   1,    1),
  slider('Octave',   'octave',   -3,   3,   1,    0),
]

const FALLBACK_CONTROLS: readonly Control[] = [
  slider('Volume', 'volume', 0, 1, 0.01, 0.8),
  slider('Reverb', 'reverb', 0, 1, 0.01, 0),
]

const KICK_MODELS   = [{ value: 'Kick808', label: '808' }, { value: 'Kick909', label: '909' }, { value: 'Kick', label: 'Generic' }]
const SNARE_MODELS  = [{ value: 'Snare909', label: '909' }, { value: 'Snare', label: 'Generic' }]
const HIHAT_MODELS  = [{ value: 'Hihat808', label: '808' }, { value: 'HiHat', label: 'Generic' }]

const CONTROLS: Record<string, readonly Control[]> = {
  kick:         [select('Model', '_model', KICK_MODELS),  slider('Volume', 'volume', 0, 1, 0.01, 0.85), slider('Tune', 'pitch', -24, 24, 1, 0),    slider('Decay', 'decay', 0.1, 2, 0.01, 0.5),  slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  kick808:      [select('Model', '_model', KICK_MODELS),  slider('Volume', 'volume', 0, 1, 0.01, 0.85), slider('Tune', 'pitch', -24, 24, 1, 0),    slider('Decay', 'decay', 0.1, 2, 0.01, 0.5),  slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  kick909:      [select('Model', '_model', KICK_MODELS),  slider('Volume', 'volume', 0, 1, 0.01, 0.85), slider('Tune', 'pitch', -24, 24, 1, 0),    slider('Decay', 'decay', 0.1, 2, 0.01, 0.5),  slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  kickHardstyle:[slider('Volume', 'volume', 0, 1, 0.01, 0.9), slider('Tune', 'pitch', -24, 24, 1, 0), slider('Decay', 'decay', 0.1, 2, 0.01, 0.8), slider('Drive', 'drive', 0, 1, 0.01, 0.5), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  kickHardcore: [slider('Volume', 'volume', 0, 1, 0.01, 0.9), slider('Tune', 'pitch', -24, 24, 1, 0), slider('Decay', 'decay', 0.05, 0.5, 0.01, 0.15), slider('Drive', 'drive', 0, 1, 0.01, 0.9), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  snare:        [select('Model', '_model', SNARE_MODELS), slider('Volume', 'volume', 0, 1, 0.01, 0.7),  slider('Tune', 'pitch', -24, 24, 1, 0),    slider('Snappy', 'sustain', 0, 1, 0.01, 0.5), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  snare909:     [select('Model', '_model', SNARE_MODELS), slider('Volume', 'volume', 0, 1, 0.01, 0.7),  slider('Tune', 'pitch', -24, 24, 1, 0),    slider('Snappy', 'sustain', 0, 1, 0.01, 0.5), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  clap909:      [slider('Volume', 'volume', 0, 1, 0.01, 0.7), slider('Tune', 'pitch', -24, 24, 1, 0), slider('Decay', 'decay', 0.01, 1, 0.01, 0.15), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  hihat:        [select('Model', '_model', HIHAT_MODELS), slider('Volume', 'volume', 0, 1, 0.01, 0.4),  slider('Tune', 'pitch', -24, 24, 1, 0),    slider('Decay', 'decay', 0.05, 2, 0.01, 0.1), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  hihat808:     [select('Model', '_model', HIHAT_MODELS), slider('Volume', 'volume', 0, 1, 0.01, 0.4),  slider('Tune', 'pitch', -24, 24, 1, 0),    slider('Decay', 'decay', 0.05, 2, 0.01, 0.1), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  'hihat-open808': [slider('Volume', 'volume', 0, 1, 0.01, 0.35), slider('Tune', 'pitch', -24, 24, 1, 0), slider('Decay', 'decay', 0.1, 4, 0.01, 0.5), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  bass303:      [slider('Volume', 'volume', 0, 1, 0.01, 0.8), slider('Cutoff', 'cutoff', 100, 8000, 10, 600), slider('Resonance', 'resonance', 0, 30, 0.1, 0.5), slider('Env Depth', 'envDepth', 0, 8000, 10, 3000), slider('Delay', 'delay', 0, 1, 0.01, 0)],
  supersaw:     [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Detune', 'detune', 0, 50, 1, 20), slider('Filter', 'filter', 100, 8000, 10, 4000), slider('Attack', 'attack', 0.01, 2, 0.01, 0.01), slider('Release', 'release', 0.1, 4, 0.01, 0.3), slider('Reverb', 'reverb', 0, 1, 0.01, 0.2)],
  wobble:       [slider('Volume', 'volume', 0, 1, 0.01, 0.8), slider('Cutoff', 'lfoDepth', 0, 1200, 10, 800), slider('LFO Rate', 'lfoRateHz', 0.1, 10, 0.1, 2), slider('Resonance', 'resonance', 0, 20, 0.1, 1), slider('Delay', 'delay', 0, 1, 0.01, 0)],
  synth:        [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Filter', 'filter', 100, 8000, 10, 2000), slider('Attack', 'attack', 0.01, 2, 0.01, 0.01), slider('Release', 'release', 0.1, 4, 0.01, 0.3), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  subsynth:     [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Filter', 'filter', 100, 8000, 10, 2000), slider('Attack', 'attack', 0.01, 2, 0.01, 0.01), slider('Release', 'release', 0.1, 4, 0.01, 0.3), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  fmsynth:      [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Filter', 'filter', 100, 8000, 10, 2000), slider('Attack', 'attack', 0.01, 2, 0.01, 0.01), slider('Release', 'release', 0.1, 4, 0.01, 0.3), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  pad:          [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Filter', 'filter', 100, 8000, 10, 2000), slider('Attack', 'attack', 0.01, 2, 0.01, 0.3),  slider('Release', 'release', 0.1, 4, 0.01, 1.0),  slider('Reverb', 'reverb', 0, 1, 0.01, 0.2)],
  pluck:        [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Filter', 'filter', 100, 8000, 10, 2000), slider('Attack', 'attack', 0.01, 2, 0.01, 0.005), slider('Release', 'release', 0.1, 4, 0.01, 0.4), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
  rhodes:       [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Attack', 'attack', 0.01, 0.5, 0.01, 0.01), slider('Release', 'release', 0.1, 4, 0.01, 0.8), slider('Reverb', 'reverb', 0, 1, 0.01, 0.15), slider('Chorus', 'chorus', 0, 1, 0.01, 0.2)],
  theremin:     [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Vibrato', 'vibrato', 0, 1, 0.01, 0.3), slider('Reverb', 'reverb', 0, 1, 0.01, 0.2)],
  sax:          [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Filter', 'filter', 100, 4000, 10, 1200), slider('Attack', 'attack', 0.01, 0.5, 0.01, 0.02), slider('Release', 'release', 0.05, 2, 0.01, 0.15), slider('Reverb', 'reverb', 0, 1, 0.01, 0.1)],
  arp:          [slider('Volume', 'volume', 0, 1, 0.01, 0.6), slider('Attack', 'attack', 0.01, 0.3, 0.01, 0.01), slider('Release', 'release', 0.05, 1, 0.01, 0.1), slider('Reverb', 'reverb', 0, 1, 0.01, 0)],
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  panel: {
    display: 'flex', flexDirection: 'row' as const, alignItems: 'center',
    gap: 12, padding: '6px 10px', background: '#111', borderTop: '1px solid #222',
    minHeight: 48,
  },
  nameSection: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start',
    gap: 4, minWidth: 64,
  },
  trackName: {
    fontSize: 10, color: '#aaa', fontFamily: 'monospace', whiteSpace: 'nowrap' as const,
    overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60,
  },
  muteBtn: (muted: boolean) => ({
    width: 28, height: 18, fontSize: 9, fontFamily: 'monospace',
    background: muted ? '#ffcc00' : '#222', color: muted ? '#000' : '#aaa',
    border: '1px solid #333', borderRadius: 2, cursor: 'pointer', padding: 0,
  }),
  controlsRow: {
    display: 'flex', flexDirection: 'row' as const, alignItems: 'center',
    gap: 10, flexWrap: 'wrap' as const,
  },
  control: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', gap: 2,
  },
  label: { fontSize: 9, color: '#666', fontFamily: 'monospace', userSelect: 'none' as const },
  value: { fontSize: 9, color: '#888', fontFamily: 'monospace', minWidth: 32 },
  slider: {
    width: 60, height: 16, accentColor: '#4a8fff',
  },
  checkboxRow: {
    display: 'flex', flexDirection: 'row' as const, alignItems: 'center', gap: 4,
  },
  select: {
    fontSize: 9, fontFamily: 'monospace', background: '#181818', color: '#aaa',
    border: '1px solid #333', borderRadius: 2, padding: '1px 2px', cursor: 'pointer',
  },
  universalDivider: {
    width: '1px', height: '28px', background: '#222', flexShrink: 0,
  },
} as const

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Per-track instrument parameter panel.
 *
 * Renders instrument-type-specific controls: labeled sliders and toggles.
 * Each control fires `onChange(method, value)` — the consumer wires this
 * to `patchChainMethod` from `codePatcher.ts` to update the live code.
 *
 * @example
 * ```tsx
 * <InstrumentPanel
 *   trackIndex={0}
 *   instrumentType="kick"
 *   trackName="Kick"
 *   params={{}}
 *   muted={false}
 *   onChange={(method, value) => patchChainMethod(code, 0, method, value)}
 *   onMute={() => toggleMute(0)}
 * />
 * ```
 */
const renderControl = (
  ctrl: Control,
  trackIndex: number,
  params: Record<string, number | string>,
  onChange: (method: string, value: number | string) => void,
): React.JSX.Element => {
  const inputId = `panel-${String(trackIndex)}-${ctrl.method}`

  if (ctrl.kind === 'select') {
    const current = typeof params[ctrl.method] === 'string' ? params[ctrl.method] as string : (ctrl.options[0]?.value ?? '')
    return (
      <div key={ctrl.method} style={styles.control}>
        <label htmlFor={inputId} style={styles.label}>{ctrl.label}</label>
        <select
          id={inputId}
          aria-label={ctrl.label}
          style={styles.select}
          value={current}
          onChange={e => { onChange(ctrl.method, e.target.value) }}
        >
          {ctrl.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }

  if (ctrl.kind === 'checkbox') {
    const checked = Boolean(params[ctrl.method] ?? 0)
    return (
      <div key={ctrl.method} style={styles.control}>
        <div style={styles.checkboxRow}>
          <input
            id={inputId}
            type="checkbox"
            aria-label={ctrl.label}
            checked={checked}
            onChange={e => { onChange(ctrl.method, e.target.checked ? 1 : 0) }}
          />
          <label htmlFor={inputId} style={styles.label}>{ctrl.label}</label>
        </div>
      </div>
    )
  }

  const val = typeof params[ctrl.method] === 'number'
    ? params[ctrl.method] as number
    : ctrl.default

  return (
    <div key={ctrl.method} style={styles.control}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
        <label htmlFor={inputId} style={styles.label}>{ctrl.label}</label>
        <span style={styles.value}>{val.toFixed(ctrl.step < 1 ? 2 : 0)}</span>
      </div>
      <input
        id={inputId}
        type="range"
        aria-label={ctrl.label}
        style={styles.slider}
        min={ctrl.min}
        max={ctrl.max}
        step={ctrl.step}
        value={val}
        onChange={e => { onChange(ctrl.method, parseFloat(e.target.value)) }}
      />
    </div>
  )
}

export const InstrumentPanel = (props: InstrumentPanelProps): React.JSX.Element => {
  const { trackIndex, instrumentType, trackName, params, muted, onChange, onMute } = props
  const typeControls = CONTROLS[instrumentType] ?? FALLBACK_CONTROLS

  return (
    <div style={styles.panel} data-testid={`instrument-panel-${String(trackIndex)}`}>

      {/* Track name + mute */}
      <div style={styles.nameSection}>
        <span style={styles.trackName}>{trackName}</span>
        <button
          style={styles.muteBtn(muted)}
          aria-label={`Mute ${trackName}`}
          aria-pressed={muted}
          onClick={onMute}
        >
          {muted ? 'M' : 'm'}
        </button>
      </div>

      {/* Instrument-specific controls */}
      <div style={styles.controlsRow}>
        {typeControls.map(ctrl => renderControl(ctrl, trackIndex, params, onChange))}
      </div>

      {/* Universal controls — pan, swing, humanize, degrade, stutter, octave */}
      <div style={styles.universalDivider} aria-hidden="true" />
      <div style={styles.controlsRow}>
        {UNIVERSAL_CONTROLS.map(ctrl => renderControl(ctrl, trackIndex, params, onChange))}
      </div>
    </div>
  )
}
