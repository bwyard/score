// ScoreEngine — hydrates a SongDefinition into real audio.
//
// Interprets InstrumentDescriptor tracks by building oscillator-based
// synth voices. No sample files required — everything is synthesis.
//
// Synthesis models:
//   kick  — sine sweep (80→30 Hz, 250ms) — classic electronic kick
//   snare — band-pass filtered noise burst + sine transient
//   hihat — high-pass filtered noise burst (short decay)
//   synth — sawtooth / square / sine / triangle oscillator

import { webAudioBackend } from '@score/core'
import { createTransport, createStepSequencer } from '@score/sequencer'
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

const triggerKick = (ctx: Context, time: number, props: KickProps): void => {
  const freq = props.synth?.frequency ?? 80
  const drop = props.synth?.pitchDrop ?? 0.1
  const gain = props.volume ?? 0.85
  const osc  = ctx.createOscillator({ type: 'sine', frequency: freq })
  const vol  = ctx.createGain({ gain })
  osc.connect(vol)
  vol.connect(ctx.destination)
  osc.start(time)
  osc.setFrequency(30, time + drop)
  osc.stop(time + drop + 0.15)
}

const triggerSnare = (ctx: Context, time: number, props: SnareProps): void => {
  const gain = props.volume ?? 0.5
  // Sine transient (body)
  const body  = ctx.createOscillator({ type: 'sine', frequency: 185 })
  const bGain = ctx.createGain({ gain: gain * 0.7 })
  body.connect(bGain)
  bGain.connect(ctx.destination)
  body.start(time)
  body.setFrequency(100, time + 0.05)
  body.stop(time + 0.08)
  // Noise (snappy)
  const noise  = ctx.createNoise({ type: 'white' })
  const filter = ctx.createFilter({ type: 'bandpass', frequency: 5000, Q: 0.8 })
  const nGain  = ctx.createGain({ gain: gain * 0.5 })
  noise.connect(filter)
  filter.connect(nGain)
  nGain.connect(ctx.destination)
  noise.start(time)
  noise.stop(time + 0.12)
}

const triggerHiHat = (ctx: Context, time: number, props: HiHatProps): void => {
  const gain = props.volume ?? 0.25
  const dur  = props.open ? 0.3 : 0.06
  const noise  = ctx.createNoise({ type: 'white' })
  const filter = ctx.createFilter({ type: 'highpass', frequency: 8000 })
  const vol    = ctx.createGain({ gain })
  noise.connect(filter)
  filter.connect(vol)
  vol.connect(ctx.destination)
  noise.start(time)
  noise.stop(time + dur)
}

export type ScoreEngine = {
  readonly start: () => void
  readonly stop: () => void
  readonly dispose: () => void
}

// Per-note synth trigger — fresh oscillator per event, avoids gain scheduling conflicts
const triggerSynth = (ctx: Context, time: number, props: SynthDSLProps, freq: number): void => {
  const noteDur = 0.18  // note duration in seconds
  const osc  = ctx.createOscillator({ type: props.wave ?? 'sawtooth', frequency: freq })
  const gain = ctx.createGain({ gain: props.gain ?? 0.25 })
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + noteDur)
}

export const createScoreEngine = (song: SongDefinition): ScoreEngine => {
  const ctx = webAudioBackend.createContext()
  const transport = createTransport(ctx, { bpm: song.bpm, ticksPerBeat: 4 })

  // Validate at boundary — song files are plain JS, component may not be a descriptor
  const descriptors = song.tracks
    .map(t => t.component)
    .filter(isInstrumentDescriptor)

  for (const comp of descriptors) {
    switch (comp.instrumentType) {
      case 'kick': {
        const props = comp.props as KickProps
        const pattern = props.pattern ?? DEFAULT_KICK_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerKick(ctx, pos.time, props)
        })
        break
      }
      case 'snare': {
        const props = comp.props as SnareProps
        const pattern = props.pattern ?? DEFAULT_SNARE_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerSnare(ctx, pos.time, props)
        })
        break
      }
      case 'hihat': {
        const props = comp.props as HiHatProps
        const pattern = props.pattern ?? DEFAULT_HIHAT_PATTERN
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerHiHat(ctx, pos.time, props)
        })
        break
      }
      case 'synth': {
        const props = comp.props as SynthDSLProps
        const pattern = props.pattern ?? props.sequence ?? DEFAULT_SYNTH_PATTERN
        createStepSequencer(transport, { pattern: pattern as number[] }, (val, _step, pos) => {
          if (val > 0) triggerSynth(ctx, pos.time, props, val)
        })
        break
      }
    }
  }

  return {
    start:   () => { transport.play(); },
    stop:    () => { transport.stop(); },
    dispose: () => {
      transport.dispose()
      ctx.close().catch(() => {})
    },
  }
}
