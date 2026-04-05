// ScoreEngine — hydrates a SongDefinition into real audio.
//
// Each track gets its own mixer channel. Effects descriptors are hydrated
// into AudioComponents via EFFECTS_REGISTRY and passed to the channel.
// Instrument descriptors are dispatched via INSTRUMENT_REGISTRY lookup
// (replacing the previous 14-case instrument switch — see refactor-audit.md).
//
// Dispatch models (per INSTRUMENT_REGISTRY comment in @score/instruments):
//   A — Percussion   (create-once, trigger per hit):   kick, snare, hihat, kick808 …
//   B — Generic Synth (persistent, triggerNote):        synth
//   B' — Melodic Voice (create per step):               subsynth, fmsynth, pad, rhodes, pluck, bass-303
//   C — Continuous   (boot once, setFrequency per step): theremin, sax
//   D — State machine:                                  arp
//   E — Special      (pre-decoded buffer):              sample

import { readFileSync } from 'node:fs'
import {
  webAudioBackend,
  decodeSample,
  createSamplePlayer,
  createScoreError,
  type SongContext,
} from '@score/core'
import type {
  EffectDescriptor,
  AudioComponent,
  ScoreAudioContext,
  BackendAnalyserNode,
} from '@score/core'
import {
  Theremin as createTheremin,
  Sax as createSax,
  type PercussionComponent,
} from '@score/components'
import {
  INSTRUMENT_REGISTRY,
  EFFECTS_REGISTRY,
  PERCUSSION_INSTRUMENT_TYPES,
  MELODIC_VOICE_INSTRUMENT_TYPES,
  MELODIC_INSTRUMENT_TYPE_SET,
  DEFAULT_KICK_PATTERN,
  type InstrumentType,
  type EffectType,
  type GenericSynthComponent,
} from '@score/instruments'
import { createMixer } from '@score/mixer'
import { createTransport, createStepSequencer } from '@score/sequencer'
import type { PatternInput } from '@score/sequencer'
import { resolveFreq } from '@score/dsl'
import { scaleNotes } from '@score/pattern'
import type {
  SongDefinition, InstrumentDescriptor, PartDescriptor,
  KickProps, SnareProps, HiHatProps, SynthDSLProps, SampleProps,
  ThereminDSLProps, SaxDSLProps, ArpDSLProps,
} from '@score/dsl'

type Context    = ReturnType<typeof webAudioBackend.createContext>
type GainNode   = ReturnType<Context['createGain']>
type CommonProps = Record<string, unknown>

// ── Melodic voice shape (shared by Model B' instruments) ──────────────────────
// All of: subsynth, fmsynth, pad, rhodes, pluck, bass-303 implement this.

type MelodicVoiceComponent = AudioComponent & {
  readonly noteOn:   (time?: number) => void
  readonly noteOff?: (time?: number) => void
}

// ── Effect hydration ──────────────────────────────────────────────────────────
// EFFECTS_REGISTRY replaces the 15-case hydrateEffect switch.
// Unknown types fall through to an EQ pass-through with an error log.

const hydrateEffect = (ctx: ScoreAudioContext, desc: EffectDescriptor): AudioComponent => {
  // Check via 'in' so TypeScript does not narrow out the undefined case
  if (!(desc.effectType in EFFECTS_REGISTRY)) {
    console.error(`[score-engine] unknown effect type: '${desc.effectType}' — skipped`)
    return (EFFECTS_REGISTRY['eq'] as unknown as (ctx: ScoreAudioContext) => AudioComponent)(ctx)
  }
  const factory = EFFECTS_REGISTRY[desc.effectType as EffectType]
  return (factory as unknown as (ctx: ScoreAudioContext, p: unknown) => AudioComponent)(ctx, desc.props)
}

const buildEffectsChain = (
  ctx: ScoreAudioContext,
  descriptors: ReadonlyArray<EffectDescriptor> | undefined,
): AudioComponent[] => {
  if (!descriptors || descriptors.length === 0) return []
  return descriptors.flatMap(d => {
    try {
      return [hydrateEffect(ctx, d)]
    } catch (err) {
      // Effect hydration failure — log and skip. One bad effect must not crash
      // the whole song boot. The channel will have a gap in its effects chain
      // but audio continues uninterrupted.
      console.error(`[score-engine] effect '${d.effectType}' failed to hydrate — skipped`, err)
      return []
    }
  })
}

// ── Type guards ───────────────────────────────────────────────────────────────

export const isInstrumentDescriptor = (comp: unknown): comp is InstrumentDescriptor => {
  if (typeof comp !== 'object' || comp === null) return false
  return (comp as { _type?: unknown })._type === 'InstrumentDescriptor'
}

export const isPartDescriptor = (comp: unknown): comp is PartDescriptor => {
  if (typeof comp !== 'object' || comp === null) return false
  return (comp as { _type?: unknown })._type === 'ChainablePart'
}

// ── Instrument classification ─────────────────────────────────────────────────
// Derived automatically from INSTRUMENT_REGISTRY — no manual maintenance needed.
// When adding a new instrument: add its entry to @score/instruments/src/index.ts.
// These sets update on their own.

// Aliases for local readability — same objects exported by @score/instruments.
const PERCUSSION_REGISTRY_TYPES = PERCUSSION_INSTRUMENT_TYPES
const MELODIC_VOICE_TYPES        = MELODIC_VOICE_INSTRUMENT_TYPES
const PERCUSSION_TYPES           = PERCUSSION_INSTRUMENT_TYPES

// ── Pitch helpers ─────────────────────────────────────────────────────────────

// Snap freq to the nearest note in the given scale across 5 octaves (0–4).
const snapFreqToScale = (freq: number, scale: { name: string; root: string }): number => {
  // Build the key string for scaleNotes: combine root + mode indicator.
  // Examples: { root: 'A', name: 'minor' } → 'Am', { root: 'C', name: 'major' } → 'C'
  const isMinorish = ['minor', 'dorian', 'phrygian', 'locrian'].includes(scale.name.toLowerCase())
  const isMajor    = scale.name.toLowerCase() === 'major'
  const key = isMajor || isMinorish
    ? isMinorish ? `${scale.root}m` : scale.root
    : scale.name  // treat name as full key string (e.g. 'Am', 'F#')
  const notes = scaleNotes(key, 0, 5)
  return notes.reduce((best, note) => {
    const f = resolveFreq(note)
    return f > 0 && Math.abs(f - freq) < Math.abs(best - freq) ? f : best
  }, resolveFreq(notes[0] ?? 'C3') || freq)
}

// Apply pitch/octave/scale transforms to a base frequency.
const applyPitchTransforms = (
  freq: number,
  props: { pitchOffset?: number; octave?: number; scale?: { name: string; root: string } },
): number => {
  const semitones = (props.pitchOffset ?? 0) + (props.octave ?? 0) * 12
  const shifted = semitones !== 0 ? freq * Math.pow(2, semitones / 12) : freq
  return props.scale ? snapFreqToScale(shifted, props.scale) : shifted
}

// ── Pattern transform helpers ─────────────────────────────────────────────────
// Applied once at descriptor resolution (bar=0). Only works for static array patterns;
// function patterns are passed through as-is and evaluated per-tick in the sequencer.

const rotatePattern = (pattern: number[], phase: number): number[] => {
  const offset = ((Math.round(phase * pattern.length) % pattern.length) + pattern.length) % pattern.length
  return offset === 0 ? pattern : [...pattern.slice(offset), ...pattern.slice(0, offset)]
}

const repeatPattern = (pattern: number[], times: number): number[] => {
  const n = Math.max(1, Math.round(times))
  return pattern.flatMap(step => Array<number>(n).fill(step))
}

// ── Normalize helpers — split from partToInstrumentDescriptor ─────────────────

/**
 * Map chain-API `_volume` to `gain` (melodic instruments) or `volume` (percussion).
 * Percussion factories convert `volume` → `gain` internally at dispatch time.
 */
const normalizeVolumeField = (
  instrumentType: string,
  volume: number | undefined,
): { readonly gain: number } | { readonly volume: number } | Record<never, never> => {
  if (volume === undefined) return {}
  return MELODIC_INSTRUMENT_TYPE_SET.has(instrumentType) ? { gain: volume } : { volume }
}

/**
 * Resolve static pattern transforms: phase → repeat → applyFn.
 * Function patterns pass through unchanged — they are evaluated per-tick.
 */
const normalizePatternTransforms = (
  part: PartDescriptor,
  songCtx: SongContext,
): PatternInput | undefined => {
  if (part._pattern === undefined) return undefined
  if (!Array.isArray(part._pattern)) return part._pattern  // function pattern — skip
  const hasTransforms = part._phase !== undefined || part._repeat !== undefined || part._applyFn !== undefined
  if (!hasTransforms) return part._pattern
  const ctx = { bar: 0, bpm: songCtx.bpm, steps: part._pattern.length, seed: songCtx.seed }
  const phased   = part._phase   !== undefined ? rotatePattern(part._pattern as number[], part._phase)          : part._pattern as number[]
  const repeated = part._repeat  !== undefined ? repeatPattern(phased, part._repeat)                            : phased
  return part._applyFn !== undefined ? part._applyFn(repeated, ctx) : repeated
}

/**
 * Resolve notes transform: mapNotesFn applied once at startup (bar = 0).
 */
const normalizeNoteTransforms = (
  part: PartDescriptor,
  songCtx: SongContext,
): (string | number)[] | undefined => {
  if (part._notes === undefined) return undefined
  if (part._mapNotesFn === undefined) return part._notes as (string | number)[]
  const ctx = { bar: 0, bpm: songCtx.bpm, steps: (part._notes as unknown[]).length, seed: songCtx.seed }
  return part._mapNotesFn(part._notes as (string | number)[], ctx)
}

/**
 * Convert a chain-API {@link PartDescriptor} to an {@link InstrumentDescriptor} the engine can hydrate.
 *
 * @param part    - The chain-API part descriptor to hydrate.
 * @param songCtx - Song context (bpm, seed, bars, timeSignature) threaded from createScoreEngine.
 */
export const partToInstrumentDescriptor = (
  part: PartDescriptor,
  songCtx?: { bpm?: number; seed?: number },
): InstrumentDescriptor => {
  const fullSongCtx: SongContext = {
    bpm:           songCtx?.bpm  ?? 120,
    seed:          songCtx?.seed ?? 0,
    bars:          0,
    timeSignature: [4, 4],
  }

  const resolvedPattern = normalizePatternTransforms(part, fullSongCtx)
  const resolvedNotes   = normalizeNoteTransforms(part, fullSongCtx)

  return {
    _type:          'InstrumentDescriptor',
    instrumentType: part.instrumentType as InstrumentDescriptor['instrumentType'],
    id:             part.id,
    type:           part.type,
    connect:        part.connect,
    disconnect:     part.disconnect,
    dispose:        part.dispose,
    ...(part._fromBar     !== undefined ? { _fromBar:     part._fromBar     } : {}),
    ...(part._untilBar    !== undefined ? { _untilBar:    part._untilBar    } : {}),
    ...(part._fadeInBars  !== undefined ? { _fadeInBars:  part._fadeInBars  } : {}),
    ...(part._fadeOutBars !== undefined ? { _fadeOutBars: part._fadeOutBars } : {}),
    ...(part._chokeGroup  !== undefined ? { _chokeGroup:  part._chokeGroup  } : {}),
    ...(part._mute        !== undefined ? { _mute:        part._mute        } : {}),
    ...(part._solo        !== undefined ? { _solo:        part._solo        } : {}),
    props: {
      ...normalizeVolumeField(part.instrumentType, part._volume),
      ...(resolvedPattern !== undefined ? { pattern:  resolvedPattern } : {}),
      ...(resolvedNotes   !== undefined ? { notes:    resolvedNotes   } : {}),
      ...(part._adsr      !== undefined ? { envelope: part._adsr      } : {}),
      // For percussion, also spread _adsr fields directly into props so .decay() / .pitch() etc.
      // from the chain API reach the component factory (which reads props.decay, not props.envelope.decay).
      ...(part._adsr !== undefined && PERCUSSION_TYPES.has(part.instrumentType as InstrumentType) ? part._adsr : {}),
      ...(part._effects   !== undefined ? { effects:  part._effects   } : {}),
      ...(part._swing     !== undefined ? { swing:    part._swing     } : {}),
      ...(part._humanize  !== undefined ? { humanize: part._humanize  } : {}),
      ...(part._degrade   !== undefined ? { degrade:  part._degrade   } : {}),
      ...(part._pan       !== undefined ? { pan:      part._pan       } : {}),
      ...(part._model        !== undefined ? { model:       part._model        } : {}),
      ...(part._pitchOffset  !== undefined ? { pitchOffset: part._pitchOffset  } : {}),
      ...(part._octave       !== undefined ? { octave:      part._octave       } : {}),
      ...(part._scale        !== undefined ? { scale:       part._scale        } : {}),
      ...(part._glide        !== undefined ? { glide:       part._glide        } : {}),
      ...(part._dur          !== undefined ? { dur:         part._dur          } : {}),
      ...(part._seed         !== undefined ? { seed:        part._seed         } : {}),
      // Fix: map _filter chain method → props.filter (SubSynth, Synth, Pad, etc.)
      ...(part._filter !== undefined ? { filter: part._filter } : {}),
      // Fix: bass-303 engine reads props.cutoff/resonance not props.filter — also map for it
      ...(part._filter !== undefined && part.instrumentType === 'bass-303'
        ? { cutoff: part._filter.frequency, resonance: part._filter.Q ?? 1 }
        : {}),
      // Runtime sequencer extras — mask/stepProb gate steps; every transforms per cycle; stretch slows rate
      ...(part._mask     !== undefined ? { mask:     part._mask     } : {}),
      ...(part._stepProb !== undefined ? { stepProb: part._stepProb } : {}),
      ...(part._every    !== undefined ? { every: { n: part._every.n, transform: part._every.fn } } : {}),
      ...(part._stretch  !== undefined ? { stretch:  part._stretch  } : {}),
      ...(part._stutter  !== undefined ? { stutter:  part._stutter  } : {}),
      ...part.props,
    },
  }
}

// ── Sequencer timing helper ───────────────────────────────────────────────────

// Extracts swing/humanize/degrade/seed from a hydrated instrument props object
// and returns only the fields accepted by StepSequencerProps.
const seqExtras = (
  props: CommonProps,
  seed?: number,
): { swing?: number; humanize?: number; degrade?: number; seed?: number } => ({
  ...(typeof props.swing    === 'number' ? { swing:    props.swing    } : {}),
  ...(typeof props.humanize === 'number' ? { humanize: props.humanize } : {}),
  ...(typeof props.degrade  === 'number' ? { degrade:  props.degrade  } : {}),
  ...(seed !== undefined ? { seed } : {}),
})

// ── Default patterns ──────────────────────────────────────────────────────────
// Percussion defaults live in INSTRUMENT_REGISTRY entries (defaultPattern field).
// DEFAULT_KICK_PATTERN is imported above as the fallback for unknown percussion types.
// DEFAULT_SYNTH_PATTERN is local — only the synth/melodic dispatchers use it.

const DEFAULT_SYNTH_PATTERN = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0]

// Per-type default patterns come from INSTRUMENT_REGISTRY entries (.defaultPattern).
// DEFAULT_KICK_PATTERN stays here as the fallback for unknown percussion types.

// ── seqPatternExtras — thread pattern-transform props into createStepSequencer ─
// Reads mask/stepProb/every/stretch from comp.props and returns the subset that
// is non-undefined, ready to spread into StepSequencerProps.

type EveryTransform = { readonly n: number; readonly transform: (p: number[]) => number[] }

const seqPatternExtras = (props: CommonProps) => ({
  ...(props['mask']     !== undefined ? { mask:     props['mask']     as PatternInput } : {}),
  ...(props['stepProb'] !== undefined ? { stepProb: props['stepProb'] as ReadonlyArray<number> } : {}),
  ...(props['every']    !== undefined ? { every:    props['every']    as EveryTransform } : {}),
  ...(props['stretch']  !== undefined ? { stretch:  props['stretch']  as number } : {}),
  ...(props['stutter']  !== undefined ? { stutter:  props['stutter']  as number } : {}),
})

// ── computeNoteDur — note duration for Model B' melodic voice instruments ──────
// Returns undefined for pluck (Karplus-Strong — natural decay, no noteOff).

const computeNoteDur = (instrumentType: InstrumentType, props: CommonProps): number | undefined => {
  if (instrumentType === 'pluck') return undefined

  const dur = props.dur as number | undefined
  if (dur !== undefined) return dur

  // bass-303 and FM-family use ampAdsr; subtractive-family uses adsr
  const adsrKey = (instrumentType === 'fmsynth' || instrumentType === 'rhodes' || instrumentType === 'bass-303')
    ? 'ampAdsr' : 'adsr'
  const adsr = (props[adsrKey] as { attack?: number; decay?: number; release?: number } | undefined) ?? {}

  const defaultsByType: Record<string, { attack: number; decay: number; release: number }> = {
    pad:      { attack: 0.3,   decay: 0.2, release: 1.2 },
    rhodes:   { attack: 0.005, decay: 0.9, release: 0.5 },
    'bass-303': { attack: 0.003, decay: 0.2, release: 0.1 },
  }
  const defaults = defaultsByType[instrumentType] ?? { attack: 0.01, decay: 0.1, release: 0.3 }

  const attack  = adsr.attack  ?? defaults.attack
  const decay   = adsr.decay   ?? defaults.decay
  const release = adsr.release ?? defaults.release
  return attack + decay + release + 0.02
}

// ── Instrument trigger functions ──────────────────────────────────────────────
// Kept as exports for use by the offline renderer (renderer.ts).
// The live engine now dispatches via INSTRUMENT_REGISTRY (see dispatch functions below).

export const triggerKick = (ctx: Context, time: number, props: KickProps, dest: GainNode): void => {
  const freq = props.synth?.frequency ?? 80
  const drop = props.synth?.pitchDrop ?? 0.1
  const gain = props.volume ?? 0.85
  const dur  = drop + 0.15
  const osc  = ctx.createOscillator({ type: 'sine', frequency: freq })
  const vol  = ctx.createGain({ gain: 0 })
  osc.connect(vol)
  vol.connect(dest)
  // 3 ms attack ramp prevents hard-onset click; decay follows the pitch drop
  vol.scheduleEnvelope({ peak: gain, attack: 0.003, decay: dur - 0.003, sustain: 0, release: 0, startTime: time, duration: dur })
  osc.start(time)
  osc.setFrequency(30, time + drop)
  osc.stop(time + dur)
  osc.onended = () => {
    try { osc.disconnect() } catch { /* ok */ }
    try { vol.disconnect() } catch { /* ok */ }
  }
}

export const triggerSnare = (ctx: Context, time: number, props: SnareProps, dest: GainNode): void => {
  const gain  = props.volume ?? 0.5
  const decay = props.decay  ?? 0.12
  const tone  = props.tone   ?? 5000

  // Body — short sine transient (the crack/attack)
  const body  = ctx.createOscillator({ type: 'sine', frequency: 185 })
  const bGain = ctx.createGain({ gain: 0 })
  body.connect(bGain)
  bGain.connect(dest)
  bGain.scheduleEnvelope({ peak: gain * 0.7, attack: 0.002, decay: 0.06, sustain: 0, release: 0, startTime: time, duration: 0.09 })
  body.start(time)
  body.setFrequency(100, time + 0.05)
  body.stop(time + 0.09)
  body.onended = () => {
    try { body.disconnect()  } catch { /* ok */ }
    try { bGain.disconnect() } catch { /* ok */ }
  }

  // Noise — filtered burst (the snare wire rattle)
  const noise  = ctx.createNoise({ type: 'white' })
  const filter = ctx.createFilter({ type: 'bandpass', frequency: tone, Q: 0.8 })
  const nGain  = ctx.createGain({ gain: 0 })
  noise.connect(filter)
  filter.connect(nGain)
  nGain.connect(dest)
  nGain.scheduleEnvelope({ peak: gain * 0.5, attack: 0.001, decay, sustain: 0, release: 0, startTime: time, duration: decay + 0.02 })
  noise.start(time)
  noise.stop(time + decay + 0.02)
  noise.onended = () => {
    try { noise.disconnect()  } catch { /* ok */ }
    try { filter.disconnect() } catch { /* ok */ }
    try { nGain.disconnect()  } catch { /* ok */ }
  }
}

export const triggerHiHat = (ctx: Context, time: number, props: HiHatProps, dest: GainNode): void => {
  const gain = props.volume ?? 0.25
  const dur  = props.open ? 0.3 : 0.06
  const noise  = ctx.createNoise({ type: 'white' })
  const filter = ctx.createFilter({ type: 'highpass', frequency: 8000 })
  const vol    = ctx.createGain({ gain: 0 })
  noise.connect(filter)
  filter.connect(vol)
  vol.connect(dest)
  vol.scheduleEnvelope({ peak: gain, attack: 0.001, decay: dur - 0.001, sustain: 0, release: 0, startTime: time, duration: dur })
  noise.start(time)
  noise.stop(time + dur)
  noise.onended = () => {
    try { noise.disconnect()  } catch { /* ok */ }
    try { filter.disconnect() } catch { /* ok */ }
    try { vol.disconnect()    } catch { /* ok */ }
  }
}

export const triggerSynth = (
  ctx: Context,
  time: number,
  props: SynthDSLProps,
  freq: number,
  dest: GainNode,
): void => {
  const env     = props.envelope ?? {}
  const attack  = env.attack  ?? 0.005
  const decay   = env.decay   ?? 0.08
  const sustain = env.sustain ?? 0.7
  const release = env.release ?? 0.05
  const peak    = props.gain  ?? 0.25
  const noteDur = attack + decay + release + 0.02

  const osc  = ctx.createOscillator({ type: props.wave ?? 'sawtooth', frequency: freq })
  const gain = ctx.createGain({ gain: 0 })

  if (props.filter) {
    const filt = ctx.createFilter({
      type: props.filter.type ?? 'lowpass',
      frequency: props.filter.frequency ?? 2000,
      ...(props.filter.Q !== undefined && { Q: props.filter.Q }),
    })
    osc.connect(filt)
    filt.connect(gain)
    osc.onended = () => {
      try { osc.disconnect()  } catch { /* ok */ }
      try { filt.disconnect() } catch { /* ok */ }
      try { gain.disconnect() } catch { /* ok */ }
    }
  } else {
    osc.connect(gain)
    osc.onended = () => {
      try { osc.disconnect()  } catch { /* ok */ }
      try { gain.disconnect() } catch { /* ok */ }
    }
  }
  gain.connect(dest)
  gain.scheduleEnvelope({ peak, attack, decay, sustain, release, startTime: time, duration: noteDur })
  osc.start(time)
  osc.stop(time + noteDur)
}

// ── muteEnvelope — pure function of time ──────────────────────────────────────
// Computes whether a track should be muted at a given bar.
// Returns true (muted) when the track is not in the active arrangement section.
// If there is no arrangement, always returns false (all tracks play).
//
// Hardware boundary: called from onBar (timer-driven), result feeds setMute.

export const muteEnvelope = (
  bar: number,
  arrangement: SongDefinition['arrangement'],
  trackId: string,
): boolean => {
  if (arrangement.length === 0) return false

  const totalBars = arrangement.reduce((sum, s) => sum + s.bars, 0)
  const currentBar = bar % totalBars

  type SectionRange = { readonly startBar: number; readonly endBar: number } & (typeof arrangement)[number]
  const { sections } = arrangement.reduce<{ readonly sections: SectionRange[]; readonly cursor: number }>(
    ({ sections, cursor }, section) => {
      const endBar = cursor + section.bars
      return { sections: [...sections, { ...section, startBar: cursor, endBar }], cursor: endBar }
    },
    { sections: [], cursor: 0 },
  )

  const active = sections.find(s => currentBar >= s.startBar && currentBar < s.endBar)
  if (!active) return false

  const activeIds = new Set(
    active.tracks
      .map(t => isInstrumentDescriptor(t) ? t : isPartDescriptor(t) ? partToInstrumentDescriptor(t) : t.component)
      .filter(isInstrumentDescriptor)
      .map(d => d.id),
  )
  return !activeIds.has(trackId)
}

// ── Patch props ───────────────────────────────────────────────────────────────

/** Surgical parameter updates applied to a running {@link ScoreEngine}. */
export type PatchProps = {
  /** New BPM. Applied immediately via the transport clock. */
  readonly bpm?: number
  /** New master volume in `[0, 1]`. Applied to the mixer master gain. */
  readonly masterVolume?: number
  /** Per-track updates. Each entry targets a track by its zero-based index. */
  readonly tracks?: ReadonlyArray<{
    readonly index: number
    readonly volume?: number
    readonly mute?: boolean
    readonly solo?: boolean
  }>
}

// ── Engine ────────────────────────────────────────────────────────────────────

export type ScoreEngine = {
  readonly start:     () => void
  readonly stop:      () => void
  readonly dispose:   () => void
  readonly bpm:       number
  /** Current bar count (absolute, resets on stop). */
  readonly bars:      number
  readonly onBar:     (callback: () => void) => void
  /**
   * Fires on every sequencer step with the zero-based step index and the
   * total step count for the cursor pattern. Use this for punchcard cursor
   * and per-step visualiser updates — much finer-grained than `onBar`.
   *
   * @example
   * ```ts
   * engine.onStep((step, stepCount) => { cursor = step / stepCount })
   * ```
   */
  readonly onStep:    (callback: (step: number, stepCount: number) => void) => void
  /** Number of steps in the cursor pattern (max pattern length across all tracks). */
  readonly stepCount: number
  /**
   * Apply surgical parameter updates to the running engine without reload.
   * Supports: `bpm`, `masterVolume`, per-track `volume` and `mute`.
   */
  readonly patch:   (props: PatchProps) => void
  /**
   * Apply a new song definition to the running engine, updating what is
   * possible without a full teardown. BPM and track volumes/mutes are applied
   * live. Pattern or track structure changes are logged as warnings — use
   * `--watch` for full reload on those changes.
   */
  readonly update:  (song: SongDefinition) => void
  /**
   * AnalyserNode tapped from the master output — use to read waveform or
   * frequency data in real time. Connected in parallel with the destination
   * so analysis does not alter the audible signal path.
   *
   * @example
   * ```ts
   * const buf = new Float32Array(engine.analyser.frequencyBinCount)
   * engine.analyser.getFloatTimeDomainData(buf)
   * ```
   */
  readonly analyser: BackendAnalyserNode
}

// ── Instrument dispatch functions ─────────────────────────────────────────────
// These replace the 14-case switch in createScoreEngine.
// Each function handles one dispatch model. All share the same signature shape.

// Model A — Percussion: create-once, trigger per hit
// Covers: kick, snare, hihat, kick808, kick909, hihat808, snare909
const dispatchPercussion = (
  instrumentType: InstrumentType,
  ctx: Context,
  comp: InstrumentDescriptor,
  dest: GainNode,
  channelIndex: number,
  transport: ReturnType<typeof createTransport>,
  timing: ReturnType<typeof seqExtras>,
  applyChoke: (idx: number, group: string) => void,
): void => {
  const props = comp.props as CommonProps

  // Percussion factories use 'gain'; DSL chain .volume() writes 'volume'
  const factoryProps: CommonProps = {
    ...props,
    ...(props.volume !== undefined ? { gain: props.volume } : {}),
  }

  const factory = INSTRUMENT_REGISTRY[instrumentType].factory as unknown as (
    ctx: Context,
    props: CommonProps,
  ) => PercussionComponent

  const component = factory(ctx, factoryProps)
  component.connect(dest)

  const defaultPattern = (INSTRUMENT_REGISTRY[instrumentType] as { defaultPattern?: readonly number[] }).defaultPattern ?? DEFAULT_KICK_PATTERN
  const pattern = (props.pattern ?? defaultPattern) as PatternInput

  createStepSequencer(transport, { pattern, ...timing, ...seqPatternExtras(props) }, (hit, _step, pos) => {
    if (!hit) return
    if (comp._chokeGroup) applyChoke(channelIndex, comp._chokeGroup)
    component.trigger(pos.time)
  })
}

// Model B — Generic Synth: persistent component, triggerNote per active step
const dispatchSynth = (
  ctx: Context,
  comp: InstrumentDescriptor,
  dest: GainNode,
  transport: ReturnType<typeof createTransport>,
  timing: ReturnType<typeof seqExtras>,
): void => {
  const props = comp.props as CommonProps

  const rawPattern = (props.pattern ?? props.sequence ?? DEFAULT_SYNTH_PATTERN) as PatternInput
  const pattern = (Array.isArray(rawPattern) ? rawPattern : DEFAULT_SYNTH_PATTERN) as (number | string)[]

  const synthComponent = (INSTRUMENT_REGISTRY['synth'].factory as unknown as (ctx: Context, props: CommonProps) => GenericSynthComponent)(ctx, props)
  synthComponent.connect(dest)

  createStepSequencer(transport, { pattern, ...timing, ...seqPatternExtras(props) }, (val, _step, pos) => {
    const baseFreq = resolveFreq(val)
    const freq = baseFreq > 0 ? applyPitchTransforms(baseFreq, props as { pitchOffset?: number; octave?: number; scale?: { name: string; root: string } }) : 0
    if (freq > 0) synthComponent.triggerNote(freq, pos.time)
  })
}

// Model B' — Melodic Voice: new voice instance per active step (noteOn / noteOff)
// Covers: subsynth, fmsynth, pad, rhodes, pluck, bass-303
const dispatchMelodicVoice = (
  instrumentType: InstrumentType,
  ctx: Context,
  comp: InstrumentDescriptor,
  dest: GainNode,
  transport: ReturnType<typeof createTransport>,
  timing: ReturnType<typeof seqExtras>,
): void => {
  const props = comp.props as CommonProps

  const rawPattern = (props.pattern ?? props.notes ?? DEFAULT_SYNTH_PATTERN) as PatternInput
  const pattern = (Array.isArray(rawPattern) ? rawPattern : DEFAULT_SYNTH_PATTERN) as (number | string)[]
  const noteDur = computeNoteDur(instrumentType, props)

  const factory = INSTRUMENT_REGISTRY[instrumentType].factory as unknown as (
    ctx: Context,
    props: CommonProps,
  ) => MelodicVoiceComponent

  createStepSequencer(transport, { pattern, ...timing, ...seqPatternExtras(props) }, (val, _step, pos) => {
    const baseFreq = resolveFreq(val)
    const freq = baseFreq > 0 ? applyPitchTransforms(baseFreq, props as { pitchOffset?: number; octave?: number; scale?: { name: string; root: string } }) : 0
    if (freq <= 0) return

    const voiceProps: CommonProps = {
      ...props,
      frequency: freq,
      // bass-303 reads slideTime, not glide — map here so the factory receives the correct field
      ...(instrumentType === 'bass-303' && props.glide !== undefined
        ? { slideTime: props.glide as number }
        : {}),
    }

    const voice = factory(ctx, voiceProps)
    voice.connect(dest)
    voice.noteOn(pos.time)
    if (noteDur !== undefined) voice.noteOff?.(pos.time + noteDur)
  })
}

// Model C — Theremin: boot once, continuous, no step sequencer
const dispatchTheremin = (
  ctx: Context,
  comp: InstrumentDescriptor,
  dest: GainNode,
): void => {
  const props = comp.props as ThereminDSLProps
  // Fade-in wrapper — starts at 0, ramps to 1.0 over 30ms so the theremin
  // oscillator's hard start is inaudible.
  const fadeIn = ctx.createGain({ gain: 0 })
  fadeIn.connect(dest)
  fadeIn.scheduleEnvelope({
    peak: 1.0, attack: 0.03, decay: 0, sustain: 1,
    release: 0, startTime: ctx.currentTime, duration: 3600,
  })
  const t = createTheremin(ctx, {
    ...(props.note         !== undefined && { note:         props.note }),
    ...(props.vibratoRate  !== undefined && { vibratoRate:  props.vibratoRate }),
    ...(props.vibratoDepth !== undefined && { vibratoDepth: props.vibratoDepth }),
    ...(props.gain         !== undefined && { gain:         props.gain }),
  })
  t.connect(fadeIn)
  t.start()
}

// Model C — Sax: persistent voice, setFrequency + trigger per step
const dispatchSax = (
  ctx: Context,
  comp: InstrumentDescriptor,
  dest: GainNode,
  transport: ReturnType<typeof createTransport>,
  timing: ReturnType<typeof seqExtras>,
): void => {
  const props = comp.props as SaxDSLProps & { pitchOffset?: number; octave?: number; scale?: { name: string; root: string }; dur?: number; seed?: number }
  const s = createSax(ctx, {
    ...(props.note !== undefined && { note: props.note }),
    ...(props.gain !== undefined && { gain: props.gain }),
  })
  s.connect(dest)
  s.start()
  const rawPattern = props.pattern ?? ['A4', 0, 0, 0, 'A4', 0, 0, 0, 'A4', 0, 0, 0, 'A4', 0, 0, 0]
  createStepSequencer(transport, { pattern: rawPattern, ...timing, ...seqPatternExtras(props as CommonProps) }, (val: number | string, _step, pos) => {
    const baseFreq = resolveFreq(val)
    const freq = baseFreq > 0 ? applyPitchTransforms(baseFreq, props) : 0
    if (freq > 0) {
      s.setFrequency(freq)
      s.trigger(pos.time, props.dur ?? (props as { duration?: number }).duration ?? 0.35)
    }
  })
}

// Model D — Arp: internal step-counter state machine cycling through props.notes
const dispatchArp = (
  ctx: Context,
  comp: InstrumentDescriptor,
  dest: GainNode,
  transport: ReturnType<typeof createTransport>,
  timing: ReturnType<typeof seqExtras>,
): void => {
  const props = comp.props as ArpDSLProps & { pitchOffset?: number; octave?: number; scale?: { name: string; root: string }; seed?: number }
  const notes = props.notes
  const mode  = props.mode ?? 'up'
  const rate  = props.rate ?? 1

  // HARDWARE BOUNDARY: mutable step counter — sequential arpeggio state across callbacks
  const arpState = { noteIndex: 0, pingDir: 1 }

  const defaultPattern = Array.from({ length: 16 }, () => 1)
  const rawPattern = props.pattern ?? defaultPattern
  createStepSequencer(transport, { pattern: rawPattern, ...timing, ...seqPatternExtras(props as CommonProps) }, (val: number | string, _step, pos) => {
    const active = typeof val === 'number' ? val : resolveFreq(val)
    if (active <= 0) return
    const idx  = Math.floor(arpState.noteIndex / rate) % notes.length
    const note = notes[idx] ?? notes[0] ?? 'C4'
    const baseFreq = resolveFreq(note)
    const freq = baseFreq > 0 ? applyPitchTransforms(baseFreq, props) : 0
    if (freq > 0) triggerSynth(ctx, pos.time, {
      wave:     props.wave ?? 'triangle',
      gain:     props.gain ?? 0.3,
      envelope: props.envelope,
    } as SynthDSLProps, freq, dest)
    // Advance note index based on mode
    if (mode === 'up') {
      arpState.noteIndex += 1
    } else if (mode === 'down') {
      arpState.noteIndex -= 1
    } else if (mode === 'pingpong') {
      arpState.noteIndex += arpState.pingDir
      const realIdx = Math.floor(arpState.noteIndex / rate) % notes.length
      if (realIdx >= notes.length - 1 || realIdx <= 0) {
        arpState.pingDir *= -1
      }
    } else {
      // random — deterministic hash (no Math.random — thesis compliance)
      const seed = (arpState.noteIndex * 7919) >>> 0
      arpState.noteIndex = seed % notes.length
    }
  })
}

// ── createScoreEngine ─────────────────────────────────────────────────────────

export const createScoreEngine = async (song: SongDefinition): Promise<ScoreEngine> => {
  const ctx = webAudioBackend.createContext({ seed: song.seed })
  // masterVolume: 0.72 — leaves headroom so simultaneous hits don't push the
  // limiter into heavy pumping. limiterCeiling -1.5 dBFS gives the compressor
  // more range before onset, reducing audible pump artifacts at pattern repeats.
  const mixer     = createMixer(ctx, { masterVolume: 0.72, limiterCeiling: -1.5 })
  const transport = createTransport(ctx, { bpm: song.bpm, ticksPerBeat: 4 })

  // ── AnalyserNode — taps master output for visualisation ─────────────────────
  // fftSize 2048 → frequencyBinCount 1024 samples; sufficient for ~20fps waveform reads.
  // Inserted in series: mixer (limiter) → analyser → ctx.destination.
  // The analyser node is transparent to audio — no coloration of the signal.
  const analyser = ctx.createAnalyser({ fftSize: 2048 })
  mixer.connect(analyser)
  analyser.connect(ctx.destination)

  // Resolve track descriptors — handles InstrumentDescriptor, ChainablePart, and TrackComponent
  const songCtx: SongContext = { bpm: song.bpm, seed: song.seed, bars: 0, timeSignature: [4, 4] }
  const descriptors = song.tracks
    .map(t => isInstrumentDescriptor(t) ? t : isPartDescriptor(t) ? partToInstrumentDescriptor(t, songCtx) : t.component)
    .filter(isInstrumentDescriptor)

  // Pre-decode all sample buffers before wiring sequencers
  // Keys: descriptor id → decoded BackendBuffer
  type BackendBuffer = Awaited<ReturnType<typeof decodeSample>>
  const sampleBuffers = new Map<string, BackendBuffer>()

  await Promise.all(
    descriptors
      .filter(d => d.instrumentType === 'sample')
      .map(async (d) => {
        const props = d.props as SampleProps
        const raw = readFileSync(props.path)
        const arrayBuffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
        const buf = await decodeSample(ctx, arrayBuffer)
        sampleBuffers.set(d.id, buf)
      }),
  )

  // Per-track channel + input node — pure map, no push
  const channelInputs: GainNode[] = descriptors.map(comp => {
    const props = comp.props as KickProps & SnareProps & HiHatProps & SynthDSLProps & SampleProps
    const hydratedEffects = buildEffectsChain(ctx, props.effects)
    const channelPan = (comp.props as { pan?: number }).pan
    const channel = mixer.addChannel({
      name: comp.instrumentType,
      effects: hydratedEffects,
      ...(channelPan !== undefined ? { pan: channelPan } : {}),
    })
    if (comp._mute) channel.setMute(true)
    if (comp._solo) channel.setSolo(true)
    return channel.input as unknown as GainNode
  })

  // ── Choke group registry ─────────────────────────────────────────────────────
  // Hardware-boundary exception: mutable Map — built once at engine startup, never replaced.
  // Maps chokeGroup name → array of channel indices in that group.
  const chokeGroupMap = new Map<string, number[]>()
  descriptors.forEach((desc, i) => {
    if (!desc._chokeGroup) return
    const peers = chokeGroupMap.get(desc._chokeGroup) ?? []
    chokeGroupMap.set(desc._chokeGroup, [...peers, i])
  })

  // When a track in a choke group fires: mute all peers, unmute self.
  // This cuts off the current decay of any peer that is sustaining (e.g. open → closed hihat).
  const applyChoke = (myIndex: number, groupName: string): void => {
    for (const idx of chokeGroupMap.get(groupName) ?? []) {
      if (idx === myIndex) continue
      mixer.getChannel(idx)?.setMute(true)
    }
    mixer.getChannel(myIndex)?.setMute(false)
  }

  // ── Wire step sequencers per track ─────────────────────────────────────────
  // INSTRUMENT_REGISTRY dispatch replaces the previous 14-case switch.
  // Unknown instrument types throw createScoreError (guard at top of loop body).

  descriptors.forEach((comp, i) => {
    const dest = channelInputs[i]
    if (!dest) return

    const timing = seqExtras(comp.props as CommonProps, song.seed)
    const instrumentType = comp.instrumentType

    // ── sample — pre-decoded buffer path (not in INSTRUMENT_REGISTRY) ─────────
    if (instrumentType === 'sample') {
      const props = comp.props as SampleProps & { seed?: number }
      const buf = sampleBuffers.get(comp.id)
      if (!buf) return
      const player = createSamplePlayer(ctx, buf, {
        loop: props.loop ?? false,
        playbackRate: props.rate ?? 1.0,
        gain: props.volume ?? 1.0,
      })
      player.connect(dest)
      const pattern = props.pattern ?? [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      createStepSequencer(transport, { pattern, ...timing, ...seqPatternExtras(props as CommonProps) }, (hit, _step, pos) => {
        if (hit) {
          if (comp._chokeGroup) applyChoke(i, comp._chokeGroup)
          player.start(pos.time)
        }
      })
      return
    }

    // ── Unknown instrument guard ───────────────────────────────────────────────
    if (!(instrumentType in INSTRUMENT_REGISTRY)) {
      throw createScoreError(`Unknown instrument type: '${instrumentType}'. Check spelling or registry.`)
    }

    // ── Model A — Percussion ─────────────────────────────────────────────────
    if (PERCUSSION_REGISTRY_TYPES.has(instrumentType)) {
      dispatchPercussion(instrumentType, ctx, comp, dest, i, transport, timing, applyChoke)
      return
    }

    // ── Model B — Generic Synth ──────────────────────────────────────────────
    if (instrumentType === 'synth') {
      dispatchSynth(ctx, comp, dest, transport, timing)
      return
    }

    // ── Model B' — Melodic Voice (new voice per step) ────────────────────────
    if (MELODIC_VOICE_TYPES.has(instrumentType)) {
      dispatchMelodicVoice(instrumentType, ctx, comp, dest, transport, timing)
      return
    }

    // ── Model C — Theremin (continuous, no step sequencer) ───────────────────
    if (instrumentType === 'theremin') {
      dispatchTheremin(ctx, comp, dest)
      return
    }

    // ── Model C — Sax (persistent voice + per-step trigger) ──────────────────
    if (instrumentType === 'sax') {
      dispatchSax(ctx, comp, dest, transport, timing)
      return
    }

    // ── Model D — Arp (state machine cycling through notes) ──────────────────
    if (instrumentType === 'arp') {
      dispatchArp(ctx, comp, dest, transport, timing)
      return
    }
  })

  // ── Arrangement execution — pure muteEnvelope per bar ───────────────────────
  // muteEnvelope(bar, arrangement, trackId) is a pure function of time.
  // No stored sectionIndex — mute state is recomputed on each bar boundary.

  if (song.arrangement.length > 0) {
    transport.onBar(position => {
      descriptors.forEach((desc, i) => {
        const channel = mixer.getChannel(i)
        if (!channel) return
        channel.setMute(muteEnvelope(position.bar, song.arrangement, desc.id))
      })
    })
  }

  // ── Per-track bar gating: fromBar / untilBar / fadeIn / fadeOut ──────────────
  // Independent of arrangement sections — applies per-track timing constraints
  // threaded from chain API (_fromBar / _untilBar / _fadeInBars / _fadeOutBars).
  // barDuration = (60 / bpm) * 4 beats/bar (assumes 4/4 time signature).

  const tracksWithGating = descriptors.filter(
    d => d._fromBar !== undefined || d._untilBar !== undefined,
  )
  if (tracksWithGating.length > 0) {
    transport.onBar(position => {
      const barDuration = (60 / transport.bpm) * 4
      descriptors.forEach((desc, i) => {
        if (desc._fromBar === undefined && desc._untilBar === undefined) return
        const channel = mixer.getChannel(i)
        if (!channel) return

        const fromBar  = desc._fromBar  ?? 0
        const untilBar = desc._untilBar ?? Infinity
        const inRange  = position.bar >= fromBar && position.bar < untilBar

        channel.setMute(!inRange)

        if (inRange && position.bar === fromBar) {
          // Track enters active range — handle fade-in or restore volume
          if (desc._fadeInBars !== undefined) {
            channel.scheduleFade(0, 1, position.time, position.time + desc._fadeInBars * barDuration)
          } else {
            // Restore volume to 1 in case a previous fade-out left it at 0
            channel.setVolume(1, position.time)
          }
        }

        if (
          desc._untilBar !== undefined &&
          desc._fadeOutBars !== undefined &&
          position.bar === desc._untilBar - desc._fadeOutBars
        ) {
          // Track is approaching its end — schedule fade-out
          channel.scheduleFade(1, 0, position.time, position.time + desc._fadeOutBars * barDuration)
        }
      })
    })
  }

  // ── Cursor step sequencer — fires per step for punchcard + visualiser sync ───
  // Uses max pattern length across tracks (min 8) so the cursor covers all tracks.
  // All-ones pattern means every step triggers the callback regardless of track hits.
  const cursorStepCount = Math.max(
    ...descriptors.map(d => {
      const p = (d.props as { pattern?: ReadonlyArray<unknown> }).pattern
      return p ? p.length : 0
    }),
    8,
  )
  const cursorPattern = Array.from({ length: cursorStepCount }, () => 1)
  const stepCallbacks: Array<(step: number, stepCount: number) => void> = []
  createStepSequencer(transport, { pattern: cursorPattern }, (_val, step, _pos) => {
    stepCallbacks.forEach(cb => { cb(step, cursorStepCount); })
  })

  return {
    start:     () => { transport.play() },
    stop:      () => { transport.stop() },
    dispose:   () => {
      transport.dispose()
      mixer.dispose()
      ctx.close().catch(() => {})
    },
    get bpm()  { return transport.bpm },
    get bars() { return transport.position.bar },
    onBar:  (callback: () => void) => { transport.onBar(callback) },
    onStep: (callback: (step: number, stepCount: number) => void) => {
      stepCallbacks.push(callback)
    },
    get stepCount() { return cursorStepCount },
    analyser,

    patch: (props: PatchProps): void => {
      if (props.bpm !== undefined) transport.setBPM(props.bpm)
      if (props.masterVolume !== undefined) mixer.setMasterVolume(props.masterVolume)
      if (props.tracks) {
        for (const t of props.tracks) {
          const channel = mixer.getChannel(t.index)
          if (!channel) continue
          if (t.volume !== undefined) channel.setVolume(t.volume)
          if (t.mute   !== undefined) channel.setMute(t.mute)
          if (t.solo   !== undefined) channel.setSolo(t.solo)
        }
      }
    },

    update: (nextSong: SongDefinition): void => {
      // Apply BPM diff
      if (nextSong.bpm !== transport.bpm) transport.setBPM(nextSong.bpm)

      // Cancel any in-progress fade ramps before applying the new song's parameters.
      // Without this, a stale linearRampToValueAtTime from a previous fadeIn/fadeOut
      // persists on the channel's volumeGain AudioParam and overrides the new volume.
      descriptors.forEach((_desc, i) => {
        mixer.getChannel(i)?.cancelFade()
      })

      // Apply per-track volume/mute diffs
      const nextDescriptors = nextSong.tracks
        .map(t => isInstrumentDescriptor(t) ? t : isPartDescriptor(t) ? partToInstrumentDescriptor(t, { bpm: nextSong.bpm, seed: nextSong.seed }) : t.component)
        .filter(isInstrumentDescriptor)

      nextDescriptors.forEach((nextDesc, i) => {
        const curDesc = descriptors[i]
        if (!curDesc || curDesc.instrumentType !== nextDesc.instrumentType) {
          // Track structure changed — cannot patch live
          return
        }
        const channel = mixer.getChannel(i)
        if (!channel) return
        const nextProps = nextDesc.props as KickProps & SnareProps & HiHatProps & SynthDSLProps & SampleProps
        const curProps  = curDesc.props  as KickProps & SnareProps & HiHatProps & SynthDSLProps & SampleProps
        if (nextProps.volume !== curProps.volume && nextProps.volume !== undefined) {
          channel.setVolume(nextProps.volume)
        }
      })
    },
  }
}
