// ScoreEngine — hydrates a SongDefinition into real audio.
//
// Each track gets its own mixer channel. Effects descriptors are hydrated
// into AudioComponents and passed to the channel. Arrangement execution
// mutes/unmutes channels at section boundaries.
//
// Synthesis models:
//   kick     — sine sweep (freq→30 Hz over pitchDrop sec)
//   snare    — band-pass filtered noise burst + sine transient
//   hihat    — high-pass filtered noise burst (short decay)
//   synth    — oscillator with ADSR envelope + optional filter
//   sample   — decoded audio file played back on each hit
//   kick808  — createKick808: pure sine + pitch envelope
//   kick909  — createKick909: sine body + noise click transient
//   hihat808 — createHihat808: 6 detuned sq oscs → BP/HP filter chain
//   snare909 — createSnare909: 2 triangle oscs + white noise HPF
//   subsynth — createSubtractiveSynth: saw/sq → resonant LP → ADSR VCA
//   fmsynth  — createFMSynth: 2-op FM (DX7 Rhodes / metallic leads)
//   pad      — createPad: SubtractiveSynth with slow attack / long release defaults
//   rhodes   — createRhodes: FMSynth with DX7 Rhodes defaults
//   pluck    — createPluck: Karplus-Strong string model
//   bass-303 — createBass303: TB-303 acid bass (saw/sq → high-Q LP → MEG/VEG)

import { readFileSync } from 'node:fs'
import { webAudioBackend, decodeSample, createSamplePlayer } from '@score/core'
import type { EffectDescriptor, AudioComponent, ScoreAudioContext, BackendAnalyserNode } from '@score/core'
import {
  Theremin as ThereminComponent,
  Sax as SaxComponent,
  createKick808,
  createKick909,
  createHihat808,
  createSnare909,
  createSubtractiveSynth,
  createFMSynth,
  createPad,
  createRhodes,
  createPluck,
  createBass303,
} from '@score/components'
import { createMixer } from '@score/mixer'
import {
  createDelay, createReverb, createFilter, createCompressor, createEQ,
  createDistortion, createLimiter, createBitCrusher, createChorus,
  createPhaser, createFlanger, createStereoWidener, createGate,
  createSaturation, createAutoPan,
} from '@score/effects'
import { createTransport, createStepSequencer } from '@score/sequencer'
import { resolveFreq } from '@score/dsl'
import type {
  SongDefinition, InstrumentDescriptor, PartDescriptor,
  KickProps, SnareProps, HiHatProps, SynthDSLProps, SampleProps, ThereminDSLProps, SaxDSLProps, ArpDSLProps,
  Kick808DSLProps, Kick909DSLProps, Hihat808DSLProps, Snare909DSLProps, SubSynthDSLProps,
  FMSynthDSLProps,
} from '@score/dsl'

type Context = ReturnType<typeof webAudioBackend.createContext>
type GainNode = ReturnType<Context['createGain']>

// ── Effect hydration ──────────────────────────────────────────────────────────

const hydrateEffect = (ctx: ScoreAudioContext, desc: EffectDescriptor): AudioComponent => {
  const p = desc.props
  switch (desc.effectType) {
    case 'delay':         return createDelay(ctx, p as Parameters<typeof createDelay>[1])
    case 'reverb':        return createReverb(ctx, p as Parameters<typeof createReverb>[1])
    case 'filter':        return createFilter(ctx, p as Parameters<typeof createFilter>[1])
    case 'compressor':    return createCompressor(ctx, p as Parameters<typeof createCompressor>[1])
    case 'eq':            return createEQ(ctx, p as Parameters<typeof createEQ>[1])
    case 'distortion':    return createDistortion(ctx, p as Parameters<typeof createDistortion>[1])
    case 'limiter':       return createLimiter(ctx, p as Parameters<typeof createLimiter>[1])
    case 'bitcrusher':    return createBitCrusher(ctx, p as Parameters<typeof createBitCrusher>[1])
    case 'chorus':        return createChorus(ctx, p as Parameters<typeof createChorus>[1])
    case 'phaser':        return createPhaser(ctx, p as Parameters<typeof createPhaser>[1])
    case 'flanger':       return createFlanger(ctx, p as Parameters<typeof createFlanger>[1])
    case 'stereo-widener':return createStereoWidener(ctx, p as Parameters<typeof createStereoWidener>[1])
    case 'gate':          return createGate(ctx, p as Parameters<typeof createGate>[1])
    case 'saturation':    return createSaturation(ctx, p as Parameters<typeof createSaturation>[1])
    case 'autopan':       return createAutoPan(ctx, p as Parameters<typeof createAutoPan>[1])
    default:
      // Unknown effect type — pass-through (connect input directly to output)
      return createEQ(ctx)
  }
}

const buildEffectsChain = (
  ctx: ScoreAudioContext,
  descriptors: ReadonlyArray<EffectDescriptor> | undefined,
): AudioComponent[] => {
  if (!descriptors || descriptors.length === 0) return []
  return descriptors.map(d => hydrateEffect(ctx, d))
}

// ── Type guard ────────────────────────────────────────────────────────────────

export const isInstrumentDescriptor = (comp: unknown): comp is InstrumentDescriptor => {
  if (typeof comp !== 'object' || comp === null) return false
  return (comp as { _type?: unknown })._type === 'InstrumentDescriptor'
}

export const isPartDescriptor = (comp: unknown): comp is PartDescriptor => {
  if (typeof comp !== 'object' || comp === null) return false
  return (comp as { _type?: unknown })._type === 'ChainablePart'
}

// Melodic instruments use 'gain' for amplitude; percussion uses 'volume'
const MELODIC_INSTRUMENT_TYPES = new Set([
  'synth', 'subsynth', 'fmsynth', 'arp', 'theremin', 'sax', 'sample',
  'pad', 'rhodes', 'pluck', 'bass-303',
])

/** Convert a chain-API {@link PartDescriptor} to an {@link InstrumentDescriptor} the engine can hydrate. */
const partToInstrumentDescriptor = (part: PartDescriptor): InstrumentDescriptor => ({
  _type: 'InstrumentDescriptor',
  instrumentType: part.instrumentType as InstrumentDescriptor['instrumentType'],
  id: part.id,
  type: part.type,
  connect: part.connect,
  disconnect: part.disconnect,
  dispose: part.dispose,
  props: {
    ...(part._volume !== undefined
      ? MELODIC_INSTRUMENT_TYPES.has(part.instrumentType)
        ? { gain: part._volume }
        : { volume: part._volume }
      : {}),
    ...(part._pattern  !== undefined ? { pattern:  part._pattern  } : {}),
    ...(part._notes    !== undefined ? { notes:    part._notes    } : {}),
    ...(part._adsr     !== undefined ? { envelope: part._adsr     } : {}),
    ...(part._effects  !== undefined ? { effects:  part._effects  } : {}),
    ...(part._swing    !== undefined ? { swing:    part._swing    } : {}),
    ...(part._humanize !== undefined ? { humanize: part._humanize } : {}),
    ...(part._pan      !== undefined ? { pan:      part._pan      } : {}),
    ...(part._model    !== undefined ? { model:    part._model    } : {}),
    ...part.props,
  },
})

// ── Default patterns ──────────────────────────────────────────────────────────

const DEFAULT_KICK_PATTERN  = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
const DEFAULT_SNARE_PATTERN = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
const DEFAULT_HIHAT_PATTERN = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
const DEFAULT_SYNTH_PATTERN = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0]

// ── Instrument trigger functions ──────────────────────────────────────────────
// Exported for use by the offline renderer (renderer.ts).

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
}

export const triggerSnare = (ctx: Context, time: number, props: SnareProps, dest: GainNode): void => {
  const gain  = props.volume ?? 0.5
  const decay = props.decay  ?? 0.12
  const tone  = props.tone   ?? 5000

  // Body — short sine transient (the crack/attack)
  // 2 ms attack prevents the hard-onset click; decays to silence by ~80 ms
  const body  = ctx.createOscillator({ type: 'sine', frequency: 185 })
  const bGain = ctx.createGain({ gain: 0 })
  body.connect(bGain)
  bGain.connect(dest)
  bGain.scheduleEnvelope({ peak: gain * 0.7, attack: 0.002, decay: 0.06, sustain: 0, release: 0, startTime: time, duration: 0.09 })
  body.start(time)
  body.setFrequency(100, time + 0.05)
  body.stop(time + 0.09)

  // Noise — filtered burst (the snare wire rattle)
  // 1 ms attack snaps the rattle in immediately; decay controlled by props.decay
  const noise  = ctx.createNoise({ type: 'white' })
  const filter = ctx.createFilter({ type: 'bandpass', frequency: tone, Q: 0.8 })
  const nGain  = ctx.createGain({ gain: 0 })
  noise.connect(filter)
  filter.connect(nGain)
  nGain.connect(dest)
  nGain.scheduleEnvelope({ peak: gain * 0.5, attack: 0.001, decay, sustain: 0, release: 0, startTime: time, duration: decay + 0.02 })
  noise.start(time)
  noise.stop(time + decay + 0.02)
}

export const triggerHiHat = (ctx: Context, time: number, props: HiHatProps, dest: GainNode): void => {
  const gain = props.volume ?? 0.25
  const dur  = props.open ? 0.3 : 0.06
  const noise  = ctx.createNoise({ type: 'white' })
  const filter = ctx.createFilter({ type: 'highpass', frequency: 8000 })
  // Start at gain: 0 — 1ms attack ramp prevents hard-onset click (same contract as kick/snare).
  // Hi-hat is very short so keep attack minimal (1ms) to preserve the crisp transient.
  const vol    = ctx.createGain({ gain: 0 })
  noise.connect(filter)
  filter.connect(vol)
  vol.connect(dest)
  vol.scheduleEnvelope({ peak: gain, attack: 0.001, decay: dur - 0.001, sustain: 0, release: 0, startTime: time, duration: dur })
  noise.start(time)
  noise.stop(time + dur)
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
  } else {
    osc.connect(gain)
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

export const createScoreEngine = async (song: SongDefinition): Promise<ScoreEngine> => {
  const ctx = webAudioBackend.createContext()
  // masterVolume: 0.72 — leaves headroom so simultaneous hits don't push the
  // limiter into heavy pumping. limiterCeiling -1.5 dBFS gives the compressor
  // more range before onset, reducing audible pump artifacts at pattern repeats.
  const mixer = createMixer(ctx, { masterVolume: 0.72, limiterCeiling: -1.5 })
  const transport = createTransport(ctx, { bpm: song.bpm, ticksPerBeat: 4 })

  // ── AnalyserNode — taps master output for visualisation ─────────────────────
  // fftSize 2048 → frequencyBinCount 1024 samples; sufficient for ~20fps waveform reads.
  // Inserted in series: mixer (limiter) → analyser → ctx.destination.
  // The analyser node is transparent to audio — no coloration of the signal.
  const analyser = ctx.createAnalyser({ fftSize: 2048 })
  mixer.connect(analyser)
  analyser.connect(ctx.destination)

  // Resolve track descriptors
  const descriptors = song.tracks
    .map(t => isInstrumentDescriptor(t) ? t : t.component)
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
    const channel = mixer.addChannel({
      name: comp.instrumentType,
      effects: hydratedEffects,
    })
    return channel.input as unknown as GainNode
  })

  // Wire step sequencers per track
  descriptors.forEach((comp, i) => {
    const dest = channelInputs[i]
    if (!dest) return

    switch (comp.instrumentType) {
      case 'kick': {
        const props = comp.props as KickProps
        const pattern = props.pattern ?? DEFAULT_KICK_PATTERN
        createStepSequencer(transport, { pattern, seed: song.seed }, (hit, _step, pos) => {
          if (hit) triggerKick(ctx, pos.time, props, dest)
        })
        break
      }
      case 'snare': {
        const props = comp.props as SnareProps
        const pattern = props.pattern ?? DEFAULT_SNARE_PATTERN
        createStepSequencer(transport, { pattern, seed: song.seed }, (hit, _step, pos) => {
          if (hit) triggerSnare(ctx, pos.time, props, dest)
        })
        break
      }
      case 'hihat': {
        const props = comp.props as HiHatProps
        const pattern = props.pattern ?? DEFAULT_HIHAT_PATTERN
        createStepSequencer(transport, { pattern, seed: song.seed }, (hit, _step, pos) => {
          if (hit) triggerHiHat(ctx, pos.time, props, dest)
        })
        break
      }
      case 'synth': {
        const props = comp.props as SynthDSLProps
        const rawPattern = props.pattern ?? props.sequence ?? DEFAULT_SYNTH_PATTERN
        const pattern: (number | string)[] = Array.isArray(rawPattern) ? rawPattern : DEFAULT_SYNTH_PATTERN
        createStepSequencer(transport, { pattern, seed: song.seed }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) triggerSynth(ctx, pos.time, props, freq, dest)
        })
        break
      }
      case 'sample': {
        const props = comp.props as SampleProps
        const buf = sampleBuffers.get(comp.id)
        if (!buf) break
        const player = createSamplePlayer(ctx, buf, {
          loop: props.loop ?? false,
          playbackRate: props.rate ?? 1.0,
          gain: props.volume ?? 1.0,
        })
        player.connect(dest)
        const pattern = props.pattern ?? [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        createStepSequencer(transport, { pattern, seed: song.seed }, (hit, _step, pos) => {
          if (hit) player.start(pos.time)
        })
        break
      }
      case 'theremin': {
        const props = comp.props as ThereminDSLProps
        // Fade-in wrapper — starts at 0, ramps to 1.0 over 30ms so the theremin
        // oscillator's hard start is inaudible. The theremin's own gain prop sets
        // the final amplitude; this node only prevents the startup click.
        const fadeIn = ctx.createGain({ gain: 0 })
        fadeIn.connect(dest)
        fadeIn.scheduleEnvelope({
          peak: 1.0, attack: 0.03, decay: 0, sustain: 1,
          release: 0, startTime: ctx.currentTime, duration: 3600,
        })
        const t = ThereminComponent(ctx, {
          ...(props.note         !== undefined && { note:         props.note }),
          ...(props.vibratoRate  !== undefined && { vibratoRate:  props.vibratoRate }),
          ...(props.vibratoDepth !== undefined && { vibratoDepth: props.vibratoDepth }),
          ...(props.gain         !== undefined && { gain:         props.gain }),
        })
        t.connect(fadeIn)
        t.start()
        break
      }
      case 'sax': {
        const props = comp.props as SaxDSLProps
        const s = SaxComponent(ctx, {
          ...(props.note !== undefined && { note: props.note }),
          ...(props.gain !== undefined && { gain: props.gain }),
        })
        s.connect(dest)
        s.start()
        const rawPattern = props.pattern ?? ['A4', 0, 0, 0,  'A4', 0, 0, 0,  'A4', 0, 0, 0,  'A4', 0, 0, 0]
        createStepSequencer(transport, { pattern: rawPattern, seed: song.seed }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) {
            s.setFrequency(freq)
            s.trigger(pos.time, props.duration ?? 0.35)
          }
        })
        break
      }
      case 'arp': {
        const props = comp.props as ArpDSLProps
        const notes = props.notes
        const mode = props.mode ?? 'up'
        const rate = props.rate ?? 1
        // Hardware-boundary exception: arp step counter — sequential, const-bound state
        const arpState = { noteIndex: 0, pingDir: 1 }
        const defaultPattern = Array.from({ length: 16 }, () => 1)
        const rawPattern = props.pattern ?? defaultPattern
        createStepSequencer(transport, { pattern: rawPattern, seed: song.seed }, (val: number | string, _step, pos) => {
          const active = typeof val === 'number' ? val : resolveFreq(val)
          if (active <= 0) return
          const idx = Math.floor(arpState.noteIndex / rate) % notes.length
          const note = notes[idx] ?? notes[0] ?? 'C4'
          const freq = resolveFreq(note)
          if (freq > 0) triggerSynth(ctx, pos.time, {
            wave: props.wave ?? 'triangle',
            gain: props.gain ?? 0.3,
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
            // random — deterministic based on noteIndex+time
            const seed = (arpState.noteIndex * 7919) >>> 0
            arpState.noteIndex = seed % notes.length
          }
        })
        break
      }
      case 'kick808': {
        const props = comp.props as Kick808DSLProps
        const kick = createKick808(ctx, {
          ...(props.startFreq !== undefined && { startFreq: props.startFreq }),
          ...(props.endFreq   !== undefined && { endFreq:   props.endFreq }),
          ...(props.pitchFall !== undefined && { pitchFall: props.pitchFall }),
          ...(props.decay     !== undefined && { decay:     props.decay }),
          gain: props.volume ?? 0.85,
        })
        kick.connect(dest)
        const pattern = props.pattern ?? DEFAULT_KICK_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) kick.trigger(pos.time)
        })
        break
      }
      case 'kick909': {
        const props = comp.props as Kick909DSLProps
        const kick = createKick909(ctx, {
          ...(props.startFreq  !== undefined && { startFreq:  props.startFreq }),
          ...(props.endFreq    !== undefined && { endFreq:    props.endFreq }),
          ...(props.pitchFall  !== undefined && { pitchFall:  props.pitchFall }),
          ...(props.decay      !== undefined && { decay:      props.decay }),
          ...(props.clickLevel !== undefined && { clickLevel: props.clickLevel }),
          ...(props.clickDecay !== undefined && { clickDecay: props.clickDecay }),
          gain: props.volume ?? 0.85,
        })
        kick.connect(dest)
        const pattern = props.pattern ?? DEFAULT_KICK_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) kick.trigger(pos.time)
        })
        break
      }
      case 'hihat808': {
        const props = comp.props as Hihat808DSLProps
        const hat = createHihat808(ctx, {
          ...(props.decay !== undefined && { decay: props.decay }),
          ...(props.open  !== undefined && { open:  props.open }),
          gain: props.volume ?? 0.65,
        })
        hat.connect(dest)
        const pattern = props.pattern ?? DEFAULT_HIHAT_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) hat.trigger(pos.time)
        })
        break
      }
      case 'snare909': {
        const props = comp.props as Snare909DSLProps
        const snare = createSnare909(ctx, {
          ...(props.toneDecay      !== undefined && { toneDecay:      props.toneDecay }),
          ...(props.noiseDecay     !== undefined && { noiseDecay:     props.noiseDecay }),
          ...(props.toneNoiseRatio !== undefined && { toneNoiseRatio: props.toneNoiseRatio }),
          gain: props.volume ?? 0.8,
        })
        snare.connect(dest)
        const pattern = props.pattern ?? DEFAULT_SNARE_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) snare.trigger(pos.time)
        })
        break
      }
      case 'subsynth': {
        const props = comp.props as SubSynthDSLProps
        const rawPattern = props.pattern ?? DEFAULT_SYNTH_PATTERN
        const pattern: (number | string)[] = Array.isArray(rawPattern) ? rawPattern : DEFAULT_SYNTH_PATTERN
        const adsr = props.adsr ?? {}
        const attack  = adsr.attack  ?? 0.01
        const decay   = adsr.decay   ?? 0.1
        const release = adsr.release ?? 0.3
        const noteDur = attack + decay + release + 0.02
        createStepSequencer(transport, { pattern }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) {
            const voice = createSubtractiveSynth(ctx, {
              ...(props.wave   !== undefined && { wave:   props.wave }),
              ...(props.filter !== undefined && { filter: props.filter }),
              ...(props.adsr   !== undefined && { adsr:   props.adsr }),
              frequency: freq,
              gain:      props.volume ?? 0.7,
            })
            voice.connect(dest)
            voice.noteOn(pos.time)
            voice.noteOff(pos.time + noteDur)
          }
        })
        break
      }
      case 'fmsynth': {
        const props = comp.props as FMSynthDSLProps
        const rawPattern = props.pattern ?? DEFAULT_SYNTH_PATTERN
        const pattern: (number | string)[] = Array.isArray(rawPattern) ? rawPattern : DEFAULT_SYNTH_PATTERN
        const ampAdsr = props.ampAdsr ?? {}
        const attack  = ampAdsr.attack  ?? 0.01
        const decay   = ampAdsr.decay   ?? 0.2
        const release = ampAdsr.release ?? 0.4
        const noteDur = attack + decay + release + 0.02
        createStepSequencer(transport, { pattern }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) {
            const voice = createFMSynth(ctx, {
              frequency: freq,
              ...(props.modRatio  !== undefined && { modRatio:  props.modRatio }),
              ...(props.modIndex  !== undefined && { modIndex:  props.modIndex }),
              ...(props.ampAdsr   !== undefined && { ampAdsr:   props.ampAdsr }),
              ...(props.modAdsr   !== undefined && { modAdsr:   props.modAdsr }),
              gain: props.volume ?? 0.7,
            })
            voice.connect(dest)
            voice.noteOn(pos.time)
            voice.noteOff(pos.time + noteDur)
          }
        })
        break
      }
      case 'pad': {
        // Pad — SubtractiveSynth with slow attack / long release defaults
        const props = comp.props as { pattern?: readonly (number | string)[]; notes?: readonly (number | string)[]; adsr?: { attack?: number; decay?: number; release?: number }; filter?: Record<string, unknown>; volume?: number }
        const pattern = (props.pattern ?? props.notes ?? DEFAULT_SYNTH_PATTERN) as (number | string)[]
        const adsr    = props.adsr ?? {}
        const attack  = adsr.attack  ?? 0.3
        const decay   = adsr.decay   ?? 0.2
        const release = adsr.release ?? 1.2
        const noteDur = attack + decay + release + 0.02
        createStepSequencer(transport, { pattern }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) {
            const voice = createPad(ctx, {
              frequency: freq,
              ...(props.adsr   !== undefined && { adsr:   props.adsr }),
              ...(props.filter !== undefined && { filter: props.filter }),
              gain: props.volume ?? 0.6,
            })
            voice.connect(dest)
            voice.noteOn(pos.time)
            voice.noteOff(pos.time + noteDur)
          }
        })
        break
      }
      case 'rhodes': {
        // Rhodes — FMSynth with DX7 Rhodes defaults (modRatio 1.273, fast attack, long decay)
        const props = comp.props as { pattern?: readonly (number | string)[]; notes?: readonly (number | string)[]; ampAdsr?: { attack?: number; decay?: number; release?: number }; modRatio?: number; modIndex?: number; modAdsr?: Record<string, unknown>; volume?: number }
        const pattern = (props.pattern ?? props.notes ?? DEFAULT_SYNTH_PATTERN) as (number | string)[]
        const ampAdsr = props.ampAdsr ?? {}
        const attack  = ampAdsr.attack  ?? 0.005
        const decay   = ampAdsr.decay   ?? 0.9
        const release = ampAdsr.release ?? 0.5
        const noteDur = attack + decay + release + 0.02
        createStepSequencer(transport, { pattern }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) {
            const voice = createRhodes(ctx, {
              frequency: freq,
              ...(props.modRatio !== undefined && { modRatio: props.modRatio }),
              ...(props.modIndex !== undefined && { modIndex: props.modIndex }),
              ...(props.ampAdsr  !== undefined && { ampAdsr:  props.ampAdsr }),
              ...(props.modAdsr  !== undefined && { modAdsr:  props.modAdsr }),
              gain: props.volume ?? 0.65,
            })
            voice.connect(dest)
            voice.noteOn(pos.time)
            voice.noteOff(pos.time + noteDur)
          }
        })
        break
      }
      case 'pluck': {
        // Pluck — Karplus-Strong: trigger on any non-zero note, natural decay
        const props = comp.props as { pattern?: readonly (number | string)[]; notes?: readonly (number | string)[]; feedback?: number; burstDuration?: number; volume?: number }
        const pattern = (props.pattern ?? props.notes ?? DEFAULT_SYNTH_PATTERN) as (number | string)[]
        createStepSequencer(transport, { pattern }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) {
            const voice = createPluck(ctx, {
              frequency: freq,
              ...(props.feedback      !== undefined && { feedback:      props.feedback }),
              ...(props.burstDuration !== undefined && { burstDuration: props.burstDuration }),
              gain: props.volume ?? 0.7,
            })
            voice.connect(dest)
            voice.noteOn(pos.time)
            // noteOff is a no-op for Karplus-Strong — decay is natural
          }
        })
        break
      }
      case 'bass-303': {
        // Bass303 — TB-303 acid bass: saw/sq → high-Q LP filter → MEG/VEG envelopes
        const props = comp.props as { pattern?: readonly (number | string)[]; notes?: readonly (number | string)[]; wave?: 'sawtooth' | 'square'; cutoff?: number; resonance?: number; envDepth?: number; filterAdsr?: { attack?: number; decay?: number; release?: number }; ampAdsr?: { attack?: number; decay?: number; release?: number }; accentAmount?: number; volume?: number }
        const pattern = (props.pattern ?? props.notes ?? DEFAULT_SYNTH_PATTERN) as (number | string)[]
        const ampAdsr = props.ampAdsr ?? {}
        const attack  = ampAdsr.attack  ?? 0.003
        const decay   = ampAdsr.decay   ?? 0.2
        const release = ampAdsr.release ?? 0.1
        const noteDur = attack + decay + release + 0.02
        createStepSequencer(transport, { pattern }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) {
            const voice = createBass303(ctx, {
              frequency: freq,
              ...(props.wave        !== undefined && { wave:        props.wave }),
              ...(props.cutoff      !== undefined && { cutoff:      props.cutoff }),
              ...(props.resonance   !== undefined && { resonance:   props.resonance }),
              ...(props.envDepth    !== undefined && { envDepth:    props.envDepth }),
              ...(props.filterAdsr  !== undefined && { filterAdsr:  props.filterAdsr }),
              ...(props.ampAdsr     !== undefined && { ampAdsr:     props.ampAdsr }),
              ...(props.accentAmount !== undefined && { accentAmount: props.accentAmount }),
              gain: props.volume ?? 0.7,
            })
            voice.connect(dest)
            voice.noteOn(pos.time)
            voice.noteOff(pos.time + noteDur)
          }
        })
        break
      }
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
          if (t.mute  !== undefined) channel.setMute(t.mute)
        }
      }
    },

    update: (nextSong: SongDefinition): void => {
      // Apply BPM diff
      if (nextSong.bpm !== transport.bpm) transport.setBPM(nextSong.bpm)

      // Apply per-track volume/mute diffs
      const nextDescriptors = nextSong.tracks
        .map(t => isInstrumentDescriptor(t) ? t : isPartDescriptor(t) ? partToInstrumentDescriptor(t) : t.component)
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
