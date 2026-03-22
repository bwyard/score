// ScoreEngine — hydrates a SongDefinition into real audio.
//
// Each track gets its own mixer channel. Effects descriptors are hydrated
// into AudioComponents and passed to the channel. Arrangement execution
// mutes/unmutes channels at section boundaries.
//
// Synthesis models:
//   kick   — sine sweep (freq→30 Hz over pitchDrop sec)
//   snare  — band-pass filtered noise burst + sine transient
//   hihat  — high-pass filtered noise burst (short decay)
//   synth  — oscillator with ADSR envelope + optional filter
//   sample — decoded audio file played back on each hit

import { readFileSync } from 'node:fs'
import { webAudioBackend, decodeSample, createSamplePlayer } from '@score/core'
import type { EffectDescriptor, AudioComponent, ScoreAudioContext, BackendAnalyserNode } from '@score/core'
import { Theremin as ThereminComponent, Sax as SaxComponent } from '@score/components'
import { createMixer } from '@score/mixer'
import {
  createDelay, createReverb, createFilter, createCompressor, createEQ,
  createDistortion, createLimiter, createBitCrusher, createChorus,
  createPhaser, createFlanger, createStereoWidener, createGate,
} from '@score/effects'
import { createTransport, createStepSequencer } from '@score/sequencer'
import { resolveFreq } from '@score/dsl'
import type {
  SongDefinition, InstrumentDescriptor,
  KickProps, SnareProps, HiHatProps, SynthDSLProps, SampleProps, ThereminDSLProps, SaxDSLProps, ArpDSLProps,
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
  const gain = props.volume ?? 0.5
  const body  = ctx.createOscillator({ type: 'sine', frequency: 185 })
  const bGain = ctx.createGain({ gain: gain * 0.7 })
  body.connect(bGain)
  bGain.connect(dest)
  body.start(time)
  body.setFrequency(100, time + 0.05)
  body.stop(time + 0.08)
  const noise  = ctx.createNoise({ type: 'white' })
  const filter = ctx.createFilter({ type: 'bandpass', frequency: 5000, Q: 0.8 })
  const nGain  = ctx.createGain({ gain: gain * 0.5 })
  noise.connect(filter)
  filter.connect(nGain)
  nGain.connect(dest)
  noise.start(time)
  noise.stop(time + 0.12)
}

export const triggerHiHat = (ctx: Context, time: number, props: HiHatProps, dest: GainNode): void => {
  const gain = props.volume ?? 0.25
  const dur  = props.open ? 0.3 : 0.06
  const noise  = ctx.createNoise({ type: 'white' })
  const filter = ctx.createFilter({ type: 'highpass', frequency: 8000 })
  const vol    = ctx.createGain({ gain })
  noise.connect(filter)
  filter.connect(vol)
  vol.connect(dest)
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
      .map(t => isInstrumentDescriptor(t) ? t : t.component)
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
  readonly start:   () => void
  readonly stop:    () => void
  readonly dispose: () => void
  readonly bpm:     number
  /** Current bar count (absolute, resets on stop). */
  readonly bars:    number
  readonly onBar:   (callback: () => void) => void
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
  const mixer = createMixer(ctx, { masterVolume: 0.85 })
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
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerKick(ctx, pos.time, props, dest)
        })
        break
      }
      case 'snare': {
        const props = comp.props as SnareProps
        const pattern = props.pattern ?? DEFAULT_SNARE_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerSnare(ctx, pos.time, props, dest)
        })
        break
      }
      case 'hihat': {
        const props = comp.props as HiHatProps
        const pattern = props.pattern ?? DEFAULT_HIHAT_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerHiHat(ctx, pos.time, props, dest)
        })
        break
      }
      case 'synth': {
        const props = comp.props as SynthDSLProps
        const rawPattern = props.pattern ?? props.sequence ?? DEFAULT_SYNTH_PATTERN
        const pattern: (number | string)[] = Array.isArray(rawPattern) ? rawPattern : DEFAULT_SYNTH_PATTERN
        createStepSequencer(transport, { pattern }, (val: number | string, _step, pos) => {
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
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) player.start(pos.time)
        })
        break
      }
      case 'theremin': {
        const props = comp.props as ThereminDSLProps
        const t = ThereminComponent(ctx, {
          ...(props.note         !== undefined && { note:         props.note }),
          ...(props.vibratoRate  !== undefined && { vibratoRate:  props.vibratoRate }),
          ...(props.vibratoDepth !== undefined && { vibratoDepth: props.vibratoDepth }),
          ...(props.gain         !== undefined && { gain:         props.gain }),
        })
        t.connect(dest)
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
        createStepSequencer(transport, { pattern: rawPattern }, (val: number | string, _step, pos) => {
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
        createStepSequencer(transport, { pattern: rawPattern }, (val: number | string, _step, pos) => {
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

  return {
    start:   () => { transport.play() },
    stop:    () => { transport.stop() },
    dispose: () => {
      transport.dispose()
      mixer.dispose()
      ctx.close().catch(() => {})
    },
    get bpm()  { return transport.bpm },
    get bars() { return transport.position.bar },
    onBar: (callback: () => void) => { transport.onBar(callback) },
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
        .map(t => isInstrumentDescriptor(t) ? t : t.component)
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
