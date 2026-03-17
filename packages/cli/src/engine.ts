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

export const createScoreEngine = (song: SongDefinition): ScoreEngine => {
  const ctx = webAudioBackend.createContext()
  const transport = createTransport(ctx, { bpm: song.bpm, ticksPerBeat: 4 })

  const step16thSec = (): number => 60 / (transport.bpm * 4)

  // Build a sustained oscillator for synth tracks
  type SynthVoice = { setFrequency: (f: number, t?: number) => void; setGain: (g: number, t?: number) => void; dispose: () => void }

  const synthVoices: SynthVoice[] = []

  const makeSynthVoice = (props: SynthDSLProps): SynthVoice => {
    const osc  = ctx.createOscillator({ type: props.wave ?? 'sawtooth', frequency: props.frequency ?? 110 })
    const gain = ctx.createGain({ gain: 0.0 })
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    return {
      setFrequency: (f, t) => { osc.setFrequency(f, t); },
      setGain:      (g, t) => { gain.setGain(g, t); },
      dispose: () => {
        try { osc.stop() } catch { /* already stopped */ }
        try { osc.disconnect() } catch { /* already disconnected */ }
        try { gain.disconnect() } catch { /* already disconnected */ }
      },
    }
  }

  // Validate at boundary — song files are plain JS, component may not be a descriptor
  const descriptors = song.tracks
    .map(t => t.component)
    .filter(isInstrumentDescriptor)

  for (const comp of descriptors) {
    switch (comp.instrumentType) {
      case 'kick': {
        const props = comp.props as KickProps
        const pattern = props.pattern ?? DEFAULT_KICK_PATTERN
        createStepSequencer(transport, { pattern }, (hit) => {
          if (hit) triggerKick(ctx, ctx.currentTime + step16thSec() * 0.5, props)
        })
        break
      }
      case 'snare': {
        const props = comp.props as SnareProps
        const pattern = props.pattern ?? DEFAULT_SNARE_PATTERN
        createStepSequencer(transport, { pattern }, (hit) => {
          if (hit) triggerSnare(ctx, ctx.currentTime + step16thSec() * 0.5, props)
        })
        break
      }
      case 'hihat': {
        const props = comp.props as HiHatProps
        const pattern = props.pattern ?? DEFAULT_HIHAT_PATTERN
        createStepSequencer(transport, { pattern }, (hit) => {
          if (hit) triggerHiHat(ctx, ctx.currentTime + step16thSec() * 0.5, props)
        })
        break
      }
      case 'synth': {
        const props = comp.props as SynthDSLProps
        const pattern = props.pattern ?? props.sequence ?? DEFAULT_SYNTH_PATTERN
        const voice = makeSynthVoice(props)
        synthVoices.push(voice)
        createStepSequencer(transport, { pattern: pattern as number[] }, (val) => {
          if (val > 0) {
            voice.setFrequency(val, ctx.currentTime)
            voice.setGain(props.gain ?? 0.25, ctx.currentTime)
            voice.setGain(0.0, ctx.currentTime + step16thSec() * 0.75)
          }
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
      for (const v of synthVoices) v.dispose()
      ctx.close().catch(() => {})
    },
  }
}
