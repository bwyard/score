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

const DRUMS: Section = {
  title: 'Drums',
  items: [
    { name: 'Kick()',           desc: 'euclidean hits arg, or .pattern([…])' },
    { name: 'Kick808()',        desc: '808 sine kick — .volume() .decay()' },
    { name: 'Kick909()',        desc: '909 click kick — .volume() .decay()' },
    { name: 'KickHardstyle()',  desc: 'reverse-bass + tanh distortion' },
    { name: 'KickHardcore()',   desc: 'hard-clip gabber, 160–200 BPM' },
    { name: 'Snare()',          desc: '.volume() .decay()' },
    { name: 'Snare909()',       desc: '909 tone+noise snare' },
    { name: 'Clap909()',        desc: '4-layer staggered noise burst' },
    { name: 'Cowbell808()',     desc: 'TR-808 cowbell — metallic bell, two square oscs' },
    { name: 'HiHat()',          desc: 'euclidean hits arg, or .pattern([…])' },
    { name: 'Hihat808()',       desc: '6 detuned square oscs, closed' },
    { name: 'HihatOpen808()',   desc: 'same as 808 with longer decay' },
  ],
}

const MELODIC: Section = {
  title: 'Melodic',
  items: [
    { name: 'Synth(wave)',      desc: "'sine'|'sawtooth'|'square'|'triangle'" },
    { name: 'SubSynth(pitch)',  desc: '.unison(2) .detune(8) .filter(800, 1.2)' },
    { name: 'FMSynth(pitch)',   desc: '.ratio(1.273) .modIndex(3) .feedback(0)' },
    { name: 'Bass303(pitch)',   desc: '.cutoff(600) .resonance(2) .accent([0,4])' },
    { name: 'SuperSaw(pitch)',  desc: '7 detuned saws — trance / big room' },
    { name: 'WobbleBass(pitch)',desc: 'LFO filter sweep — dubstep / brostep' },
    { name: 'Pad(pitch)',       desc: 'long attack, sustained, gentle filter' },
    { name: 'Pluck(pitch)',     desc: 'fast attack, fast decay' },
    { name: 'Rhodes(pitch)',    desc: 'FM tine electric piano' },
    { name: 'Theremin(pitch)',  desc: '.vibrato(rate, depth) — continuous' },
    { name: 'Sax(pitch)',       desc: 'bandpass saw, reedy character' },
    { name: 'Arp(notes[])',     desc: '.notes([…]) cycles through array each step' },
    { name: 'Sample(path)',     desc: '.pattern([…]) .volume() .rate() .loop()' },
  ],
}

const CHAIN: Section = {
  title: 'Chain methods (all instruments)',
  items: [
    { name: '.volume(0–1)',          desc: 'output level' },
    { name: '.pattern([1,0,…])',     desc: '16-step binary/note array' },
    { name: '.notes([…])',           desc: 'pitch array — note names or MIDI' },
    { name: '.euclidean(hits, 16)',  desc: 'Bjorklund rhythm shorthand' },
    { name: '.reverb(wet)',          desc: 'room reverb 0–1' },
    { name: '.delay(time, fb)',      desc: 'echo: time in beats, feedback 0–1' },
    { name: '.filter(freq, Q?)',     desc: 'lowpass filter cutoff + resonance' },
    { name: '.swing(amount)',        desc: 'shuffle 0–1' },
    { name: '.humanize(ms)',         desc: 'random timing offset in seconds' },
    { name: '.degrade(prob)',        desc: 'probability each step plays (0–1)' },
    { name: '.pan(−1–1)',            desc: 'stereo position' },
    { name: '.mute()',               desc: 'mute this track at boot' },
    { name: '.decay(s)',             desc: 'amp envelope decay time in seconds' },
    { name: '.pitch(semitones)',     desc: 'transpose by semitones' },
    { name: '.octave(n)',            desc: 'octave offset ±n' },
    { name: '.dur(0–1)',             desc: 'note duration as fraction of step' },
    { name: '.glide(s)',             desc: 'portamento time in seconds' },
    { name: '.send(bus, wet)',       desc: "send to effects bus: 'reverb'|'delay'" },
    { name: '.chokeGroup(name)',     desc: 'cuts off other members on trigger' },
  ],
}

const EFFECTS: Section = {
  title: 'Effects (as .reverb() / .delay() / or props.effects)',
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
    { name: 'Song',       desc: 'bpm, tracks[], masterVolume, seed' },
    { name: 'Track',      desc: 'wraps an instrument, volume, mute, pan' },
    { name: 'Intro',      desc: '{ bars, tracks[] }' },
    { name: 'Buildup',    desc: '{ bars, tracks[] }' },
    { name: 'Drop',       desc: '{ bars, tracks[] }' },
    { name: 'Breakdown',  desc: '{ bars, tracks[] }' },
    { name: 'Outro',      desc: '{ bars, tracks[] }' },
  ],
}

const PATTERNS: Section = {
  title: 'Pattern helpers',
  items: [
    { name: 'euclidean(hits, steps)', desc: 'Bjorklund — e.g. euclidean(3,8)' },
    { name: 'pat(string)',            desc: "space-separated — pat('1 0 C4 E4')" },
    { name: 'fast(n, part)',          desc: 'speed up pattern by n' },
    { name: 'slow(n, part)',          desc: 'slow down pattern by n' },
    { name: 'rev(part)',              desc: 'reverse pattern' },
    { name: 'every(n, fn, part)',     desc: 'apply fn every nth cycle' },
    { name: 'degrade(prob, part)',    desc: 'drop steps randomly' },
    { name: 'shift(n, part)',         desc: 'rotate pattern by n steps' },
  ],
}

const SHORTCUTS: Section = {
  title: 'Shortcuts',
  items: [
    { name: 'Ctrl+Enter', desc: 'Eval code without playing' },
    { name: '▶ Run',      desc: 'Eval + play (stopped) / hot-swap (playing)' },
    { name: '■ Stop',     desc: 'Stop transport' },
    { name: 'Escape',     desc: 'Close panels / dialogs' },
  ],
}

const SECTIONS: ReadonlyArray<Section> = [DRUMS, MELODIC, CHAIN, EFFECTS, STRUCTURE, PATTERNS, SHORTCUTS]

// ── Insert snippets (chain API) ────────────────────────────────────────────────

const INSERT_SNIPPETS: Record<string, string> = {
  'Kick()':           'Kick808().volume(0.9)',
  'Kick808()':        'Kick808().volume(0.9)',
  'Kick909()':        'Kick909().volume(0.85)',
  'KickHardstyle()':  'KickHardstyle().volume(0.95)',
  'KickHardcore()':   'KickHardcore().volume(0.9)',
  'Snare()':          'Snare909().volume(0.75)',
  'Snare909()':       'Snare909().volume(0.75)',
  'Clap909()':        'Clap909().volume(0.8)',
  'Cowbell808()':     'Cowbell808().pattern([0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0]).decay(0.4).volume(0.5)',
  'HiHat()':          'Hihat808(8).volume(0.5)',
  'Hihat808()':       'Hihat808(8).volume(0.5)',
  'HihatOpen808()':   'HihatOpen808().pattern([0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0]).volume(0.6)',
  'Synth(wave)':      "Synth('sawtooth').notes(['C3','E3','G3']).volume(0.5)",
  'SubSynth(pitch)':  "SubSynth('C2').unison(2).detune(8).filter(600, 1.2).volume(0.6)",
  'FMSynth(pitch)':   "FMSynth('A3').ratio(1.273).modIndex(3).reverb(0.3).volume(0.5)",
  'Bass303(pitch)':   "Bass303('C2').cutoff(600).resonance(2.0).accent([0, 4, 8]).volume(0.7)",
  'SuperSaw(pitch)':  "SuperSaw('C4').notes(['C4','E4','G4']).reverb(0.4).volume(0.6)",
  'WobbleBass(pitch)':"WobbleBass('A1').notes(['A1','C2','D2']).volume(0.8)",
  'Pad(pitch)':       "Pad('C4').notes(['C4','E4','G4']).reverb(0.5).volume(0.5)",
  'Pluck(pitch)':     "Pluck('C4').notes(['C4','D4','E4','G4']).dur(0.2).volume(0.6)",
  'Rhodes(pitch)':    "Rhodes('A3').notes(['A3','C4','E4']).reverb(0.3).volume(0.5)",
  'Theremin(pitch)':  "Theremin('A4').volume(0.4)",
  'Sax(pitch)':       "Sax('A4').notes(['A4','B4','C5','D5']).dur(0.35).reverb(0.2)",
  'Arp(notes[])':     "Arp(['C4','E4','G4','B4']).euclidean(8, 16).volume(0.5).delay(0.375, 0.3)",
  'Sample(path)':     "Sample('./samples/sound.wav').pattern([1,0,0,0]).volume(0.7)",
}

// ── Sub-components ─────────────────────────────────────────────────────────────

type SectionProps = { readonly section: Section; readonly onInsert?: ((snippet: string) => void) | undefined }

const RefSection = ({ section, onInsert }: SectionProps) => (
  <div style={styles.section}>
    <div style={styles.sectionTitle}>{section.title}</div>
    {section.items.map(item => {
      const snippet = (section.title === 'Drums' || section.title === 'Melodic')
        ? INSERT_SNIPPETS[item.name]
        : undefined
      return (
        <div key={item.name} style={styles.row}>
          {snippet && onInsert ? (
            <button
              style={styles.nameBtn}
              onClick={() => { onInsert(snippet) }}
              title={`Insert ${item.name}`}
              aria-label={`Insert ${item.name} snippet`}
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
 * Lists all instruments (drums + melodic), chain methods, effects, Song/Track
 * structure helpers, pattern utilities, and keyboard shortcuts. Instrument names
 * are clickable and insert a working chain API snippet into the editor.
 *
 * Intended to be mounted inside a {@link DraggablePanel}.
 *
 * @example
 * ```tsx
 * <DraggablePanel title="Reference" ...>
 *   <ReferencePanel onInsert={snippet => editor.insert(snippet)} />
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
        import {'{'} Song, Track, Kick808, Bass303, … {'}'} from '@score/dsl'
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
    minWidth:    '120px',
  },
  nameBtn: {
    fontFamily:   "'JetBrains Mono', monospace",
    fontSize:     '0.68rem',
    color:        '#8ab4d4',
    flexShrink:   0,
    minWidth:     '120px',
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
