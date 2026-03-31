// ── Types ──────────────────────────────────────────────────────────────────────

type Section = {
  readonly title:   string
  readonly items:   ReadonlyArray<{ readonly name: string; readonly desc: string }>
}

type Props = {
  readonly onInsert?:  (snippet: string) => void
  /** When true, the beat indicator dot pulses bright — driven by currentStep === 0. */
  readonly beatPulse?: boolean
}

// ── Data ───────────────────────────────────────────────────────────────────────

const INSTRUMENTS: Section = {
  title: 'Instruments',
  items: [
    { name: 'Kick',     desc: 'pattern, volume, decay, tune' },
    { name: 'Snare',    desc: 'pattern, volume, decay, tone' },
    { name: 'HiHat',    desc: 'pattern, volume, decay, open' },
    { name: 'Synth',    desc: 'wave, frequency, pattern, filter, gain, effects' },
    { name: 'Sample',   desc: 'src, pattern, volume, rate, loop' },
    { name: 'Theremin', desc: 'wave, frequency, vibrato, gain, effects' },
    { name: 'Sax',      desc: 'pattern (notes), wave, gain, effects' },
    { name: 'Arp',      desc: 'notes[], mode, rate, wave, gain, effects' },
  ],
}

const EFFECTS: Section = {
  title: 'Effects',
  items: [
    { name: 'Reverb',        desc: 'decay, mix' },
    { name: 'Delay',         desc: 'time, feedback, mix' },
    { name: 'Filter',        desc: 'type, frequency, Q' },
    { name: 'Compressor',    desc: 'threshold, ratio, attack, release' },
    { name: 'EQ',            desc: 'low, mid, high' },
    { name: 'Distortion',    desc: 'drive, mode, mix' },
    { name: 'Limiter',       desc: 'threshold, release' },
    { name: 'BitCrusher',    desc: 'bits, mix' },
    { name: 'Chorus',        desc: 'rate, depth, mix' },
    { name: 'Phaser',        desc: 'rate, depth, mix' },
    { name: 'Flanger',       desc: 'rate, depth, feedback, mix' },
    { name: 'StereoWidener', desc: 'width' },
    { name: 'Gate',          desc: 'threshold, attack, release' },
    { name: 'Saturation',    desc: 'drive, mix — tanh soft-clip warmth' },
    { name: 'AutoPan',       desc: 'rate, depth, shape — LFO stereo sweep' },
  ],
}

const STRUCTURE: Section = {
  title: 'Structure',
  items: [
    { name: 'Song',   desc: 'bpm, tracks, masterVolume' },
    { name: 'Track',  desc: 'wraps an instrument, volume, mute' },
    { name: 'Intro',  desc: 'section({ bars, tracks })' },
    { name: 'Drop',   desc: 'section({ bars, tracks })' },
    { name: 'Outro',  desc: 'section({ bars, tracks })' },
  ],
}

const PATTERNS: Section = {
  title: 'Patterns',
  items: [
    { name: 'euclidean(hits, steps)', desc: 'Bjorklund rhythm, e.g. euclidean(3,8)' },
    { name: 'pat(string)',            desc: "space-separated pattern, e.g. pat('1 0 1 0')" },
  ],
}

const SHORTCUTS: Section = {
  title: 'Shortcuts',
  items: [
    { name: 'Ctrl+Enter', desc: 'Eval code without playing' },
    { name: '▶ Run',      desc: 'Eval + play (stopped) / hot-swap (playing)' },
    { name: '■ Stop',     desc: 'Stop transport' },
  ],
}

const SECTIONS: ReadonlyArray<Section> = [INSTRUMENTS, EFFECTS, STRUCTURE, PATTERNS, SHORTCUTS]

// ── Insert snippets ────────────────────────────────────────────────────────────

const INSERT_SNIPPETS: Record<string, string> = {
  Kick:     "Track(Kick({  pattern: [1, 0, 0, 0, 1, 0, 0, 0], volume: 0.9 }))",
  Snare:    "Track(Snare({ pattern: [0, 0, 1, 0, 0, 0, 1, 0], volume: 0.7 }))",
  HiHat:    "Track(HiHat({ pattern: [1, 1, 1, 1, 1, 1, 1, 1], volume: 0.4 }))",
  Synth:    "Track(Synth({ wave: 'sawtooth', frequency: 440, pattern: [1, 0, 1, 0], gain: 0.6 }))",
  Sample:   "Track(Sample({ src: './samples/sound.wav', pattern: [1, 0, 0, 0] }))",
  Theremin: "Track(Theremin({ wave: 'sine', frequency: 440, gain: 0.5 }))",
  Sax:      "Track(Sax({ pattern: ['C4', 'E4', 'G4', 'A4'], wave: 'sawtooth', gain: 0.5 }))",
  Arp:      "Track(Arp({ notes: ['C3', 'E3', 'G3', 'B3'], mode: 'up', rate: 2, wave: 'triangle', gain: 0.4 }))",
}

// ── Sub-components ─────────────────────────────────────────────────────────────

type SectionProps = { readonly section: Section; readonly onInsert?: ((snippet: string) => void) | undefined }

const RefSection = ({ section, onInsert }: SectionProps) => (
  <div style={styles.section}>
    <div style={styles.sectionTitle}>{section.title}</div>
    {section.items.map(item => {
      const snippet = section.title === 'Instruments' ? INSERT_SNIPPETS[item.name] : undefined
      return (
        <div key={item.name} style={styles.row}>
          {snippet && onInsert ? (
            <button
              style={styles.nameBtn}
              onClick={() => { onInsert(snippet) }}
              title={`Insert ${item.name}`}
            >
              {item.name}
            </button>
          ) : (
            <span style={styles.name}>{item.name}</span>
          )}
          <span style={styles.desc}>{item.desc}</span>
        </div>
      )
    })}
  </div>
)

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ReferencePanel — scrollable DSL cheatsheet for Score Live Code mode.
 *
 * Lists all 8 instruments, 13 effects, Song/Track structure helpers, and
 * keyboard shortcuts. Intended to be mounted inside a {@link DraggablePanel}.
 *
 * @example
 * ```tsx
 * <DraggablePanel title="Reference" ...>
 *   <ReferencePanel />
 * </DraggablePanel>
 * ```
 */
export const ReferencePanel = ({ onInsert, beatPulse = false }: Props) => (
  <div style={styles.root} aria-label="DSL reference panel">
    <div style={styles.header}>
      <span style={styles.headerLabel}>Score DSL</span>
      <span
        aria-hidden="true"
        style={{
          ...styles.beatDot,
          opacity:    beatPulse ? 1 : 0.15,
          transition: 'opacity 150ms ease-out',
        }}
      />
      <span style={styles.headerImport}>
        import {'{'} Song, Track, Kick, … {'}'} from '@score/dsl'
      </span>
      <span style={styles.headerImport}>
        import {'{'} Reverb, Delay, … {'}'} from '@score/effects'
      </span>
    </div>
    <div style={styles.scroll}>
      {SECTIONS.map(s => <RefSection key={s.title} section={s} onInsert={onInsert} />)}
    </div>
  </div>
)

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display:       'flex',
    flexDirection: 'column' as const,
    height:        '100%',
    background:    '#0a0a0d',
    overflow:      'hidden',
  },
  header: {
    flexShrink:    0,
    padding:       '6px 8px 4px',
    borderBottom:  '1px solid #1e1e22',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           '2px',
  },
  headerLabel: {
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      '0.62rem',
    color:         '#6a9fff',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
  headerImport: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize:   '0.6rem',
    color:      '#3a5a7a',
  },
  scroll: {
    flex:       1,
    overflowY:  'auto' as const,
    padding:    '4px 0 8px',
  },
  section: {
    padding:     '4px 0 2px',
    borderBottom: '1px solid #141418',
  },
  sectionTitle: {
    fontFamily:    "'JetBrains Mono', monospace",
    fontSize:      '0.58rem',
    color:         '#3a3a46',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding:       '2px 8px',
    marginBottom:  '2px',
  },
  row: {
    display:   'flex',
    gap:       '6px',
    padding:   '1px 8px',
    alignItems: 'baseline' as const,
  },
  name: {
    fontFamily:  "'JetBrains Mono', monospace",
    fontSize:    '0.68rem',
    color:       '#8ab4d4',
    flexShrink:  0,
    minWidth:    '88px',
  },
  nameBtn: {
    fontFamily:   "'JetBrains Mono', monospace",
    fontSize:     '0.68rem',
    color:        '#8ab4d4',
    flexShrink:   0,
    minWidth:     '88px',
    background:   'none',
    border:       'none',
    padding:      0,
    cursor:       'pointer',
    textAlign:    'left' as const,
    textDecoration: 'underline',
    textDecorationColor: '#3a5a7a',
  },
  desc: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize:   '0.62rem',
    color:      '#4a5a6a',
    overflow:   'hidden' as const,
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis' as const,
  },
  beatDot: {
    display:      'inline-block' as const,
    width:        6,
    height:       6,
    borderRadius: '50%',
    background:   'rgba(74, 143, 255, 0.8)',
    flexShrink:   0,
    alignSelf:    'center' as const,
  },
} as const
