// ScoreEngine — hydrates a SongDefinition into real audio.
//
// Interprets InstrumentDescriptor tracks by building oscillator-based
// synth voices. No sample files required — everything is synthesis.
//
// Synthesis models:
//   kick  — sine sweep (freq→30 Hz over pitchDrop sec)
//   snare — band-pass filtered noise burst + sine transient
//   hihat — high-pass filtered noise burst (short decay)
//   synth — oscillator with ADSR envelope + optional filter

import { webAudioBackend } from '@score/core'
import { createTransport, createStepSequencer } from '@score/sequencer'
import { resolveFreq } from '@score/dsl'
import type { SongDefinition, InstrumentDescriptor, KickProps, SnareProps, HiHatProps, SynthDSLProps } from '@score/dsl'

type Context = ReturnType<typeof webAudioBackend.createContext>

// Type guard — validates at the JS/TS boundary (song files are plain JS)
const isInstrumentDescriptor = (comp: unknown): comp is InstrumentDescriptor => {
  if (typeof comp !== 'object' || comp === null) return false
  return (comp as { _type?: unknown })._type === 'InstrumentDescriptor'
}

const DEFAULT_KICK_PATTERN  = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
const DEFAULT_SNARE_PATTERN = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
const DEFAULT_HIHAT_PATTERN = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
const DEFAULT_SYNTH_PATTERN = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0]

const triggerKick = (ctx: Context, time: number, props: KickProps, dest: ReturnType<Context['createGain']>): void => {
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

const triggerSnare = (ctx: Context, time: number, props: SnareProps, dest: ReturnType<Context['createGain']>): void => {
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

const triggerHiHat = (ctx: Context, time: number, props: HiHatProps, dest: ReturnType<Context['createGain']>): void => {
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

// Per-note synth — fresh osc + ADSR envelope per event
const triggerSynth = (ctx: Context, time: number, props: SynthDSLProps, freq: number, dest: ReturnType<Context['createGain']>): void => {
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

export type ScoreEngine = {
  readonly start: () => void
  readonly stop: () => void
  readonly dispose: () => void
}

export const createScoreEngine = (song: SongDefinition): ScoreEngine => {
  const ctx = webAudioBackend.createContext()
  const transport = createTransport(ctx, { bpm: song.bpm, ticksPerBeat: 4 })

  // Master gain — all instruments route through here before ctx.destination
  const master = ctx.createGain({ gain: 0.85 })
  master.connect(ctx.destination)

  // Song authors pass InstrumentDescriptors directly as tracks (no Track() wrapper needed).
  // Validate at the JS boundary — t may be a bare InstrumentDescriptor or a TrackComponent.
  const descriptors = song.tracks
    .map(t => isInstrumentDescriptor(t) ? t : t.component)
    .filter(isInstrumentDescriptor)

  for (const comp of descriptors) {
    switch (comp.instrumentType) {
      case 'kick': {
        const props = comp.props as KickProps
        const pattern = props.pattern ?? DEFAULT_KICK_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerKick(ctx, pos.time, props, master)
        })
        break
      }
      case 'snare': {
        const props = comp.props as SnareProps
        const pattern = props.pattern ?? DEFAULT_SNARE_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerSnare(ctx, pos.time, props, master)
        })
        break
      }
      case 'hihat': {
        const props = comp.props as HiHatProps
        const pattern = props.pattern ?? DEFAULT_HIHAT_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerHiHat(ctx, pos.time, props, master)
        })
        break
      }
      case 'synth': {
        const props = comp.props as SynthDSLProps
        const rawPattern = props.pattern ?? props.sequence ?? DEFAULT_SYNTH_PATTERN
        const pattern: (number | string)[] = Array.isArray(rawPattern) ? rawPattern : DEFAULT_SYNTH_PATTERN
        createStepSequencer(transport, { pattern }, (val: number | string, _step, pos) => {
          const freq = resolveFreq(val)
          if (freq > 0) triggerSynth(ctx, pos.time, props, freq, master)
        })
        break
      }
    }
  }

  return {
    start:   () => { transport.play() },
    stop:    () => { transport.stop() },
    dispose: () => {
      transport.dispose()
      ctx.close().catch(() => {})
    },
  }
}
