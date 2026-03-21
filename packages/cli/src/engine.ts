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
import type { EffectDescriptor, AudioComponent, ScoreAudioContext } from '@score/core'
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
  KickProps, SnareProps, HiHatProps, SynthDSLProps, SampleProps, ThereminDSLProps, SaxDSLProps,
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

const isInstrumentDescriptor = (comp: unknown): comp is InstrumentDescriptor => {
  if (typeof comp !== 'object' || comp === null) return false
  return (comp as { _type?: unknown })._type === 'InstrumentDescriptor'
}

// ── Default patterns ──────────────────────────────────────────────────────────

const DEFAULT_KICK_PATTERN  = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
const DEFAULT_SNARE_PATTERN = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
const DEFAULT_HIHAT_PATTERN = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
const DEFAULT_SYNTH_PATTERN = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0]

// ── Instrument trigger functions ──────────────────────────────────────────────

const triggerKick = (ctx: Context, time: number, props: KickProps, dest: GainNode): void => {
  const freq = props.synth?.frequency ?? 80
  const drop = props.synth?.pitchDrop ?? 0.1
  const gain = props.volume ?? 0.85
  const osc  = ctx.createOscillator({ type: 'sine', frequency: freq })
  const vol  = ctx.createGain({ gain })
  osc.connect(vol)
  vol.connect(dest)
  osc.start(time)
  osc.setFrequency(30, time + drop)
  osc.stop(time + drop + 0.15)
}

const triggerSnare = (ctx: Context, time: number, props: SnareProps, dest: GainNode): void => {
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

const triggerHiHat = (ctx: Context, time: number, props: HiHatProps, dest: GainNode): void => {
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

const triggerSynth = (
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

// ── Engine ────────────────────────────────────────────────────────────────────

export type ScoreEngine = {
  readonly start:   () => void
  readonly stop:    () => void
  readonly dispose: () => void
  readonly bpm:     number
  readonly onBar:   (callback: () => void) => void
}

export const createScoreEngine = async (song: SongDefinition): Promise<ScoreEngine> => {
  const ctx = webAudioBackend.createContext()
  const mixer = createMixer(ctx, { masterVolume: 0.85 })
  const transport = createTransport(ctx, { bpm: song.bpm, ticksPerBeat: 4 })

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

  // Per-track channel + input node — indexed to match descriptors[]
  const channelInputs: GainNode[] = []

  for (const comp of descriptors) {
    const props = comp.props as KickProps & SnareProps & HiHatProps & SynthDSLProps & SampleProps
    const hydratedEffects = buildEffectsChain(ctx, props.effects)

    // Add a mixer channel for this track
    const channel = mixer.addChannel({
      name: comp.instrumentType,
      effects: hydratedEffects,
    })

    // channel.input is the entry point — instrument output routes here
    channelInputs.push(channel.input as unknown as GainNode)
  }

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
    }
  })

  // ── Arrangement execution ───────────────────────────────────────────────────
  // Build a bar→section map and mute/unmute channels on each tick.

  if (song.arrangement.length > 0) {
    let cursor = 0
    const sections = song.arrangement.map(section => {
      const start = cursor
      cursor += section.bars
      return { ...section, startBar: start, endBar: cursor }
    })
    const totalBars = cursor
    let lastSectionIndex = -1

    transport.onTick(position => {
      const currentBar = position.bar % totalBars
      const sectionIndex = sections.findIndex(
        s => currentBar >= s.startBar && currentBar < s.endBar,
      )
      if (sectionIndex === lastSectionIndex) return
      lastSectionIndex = sectionIndex

      const section = sections[sectionIndex]
      if (!section) return

      // Build set of active descriptor ids for this section
      const activeIds = new Set(
        section.tracks
          .map(t => isInstrumentDescriptor(t) ? t : t.component)
          .filter(isInstrumentDescriptor)
          .map(d => d.id),
      )

      descriptors.forEach((desc, i) => {
        const channel = mixer.getChannel(i)
        if (!channel) return
        channel.setMute(!activeIds.has(desc.id))
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
    get bpm() { return transport.bpm },
    onBar: (callback: () => void) => { transport.onBar(callback) },
  }
}
