import type { AudioComponent, EffectDescriptor } from '@score/core'

// ── Instrument descriptors ────────────────────────────────────────────────────
// Pure data — no AudioContext. The engine hydrates these at play time.

export type KickProps = {
  readonly pattern?: number[]
  readonly volume?: number
  readonly synth?: { frequency?: number; pitchDrop?: number }
  /** Effects chain — use descriptor factories from the effects package (e.g. Delay, Reverb). */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

export type SnareProps = {
  readonly pattern?: number[]
  readonly volume?: number
  /** Effects chain — use descriptor factories from the effects package (e.g. Delay, Reverb). */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

export type HiHatProps = {
  readonly pattern?: number[]
  readonly volume?: number
  readonly open?: boolean
  /** Effects chain — use descriptor factories from the effects package (e.g. Delay, Reverb). */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

export type SynthDSLProps = {
  readonly wave?: 'sine' | 'square' | 'sawtooth' | 'triangle'
  readonly frequency?: number
  readonly gain?: number
  readonly pattern?: (number | string)[]
  readonly sequence?: string[]  // parsed Sequence output
  readonly envelope?: {
    readonly attack?: number   // seconds, default 0.005 — short=punchy, long=pad
    readonly decay?: number    // seconds, default 0.08
    readonly sustain?: number  // 0-1, default 0.7
    readonly release?: number  // seconds, default 0.05
  }
  readonly filter?: {
    readonly type?: 'lowpass' | 'highpass' | 'bandpass'
    readonly frequency?: number  // Hz cutoff
    readonly Q?: number          // resonance, default 1
  }
  /** Effects chain — use descriptor factories from the effects package (e.g. Delay, Reverb). */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

export type SampleProps = {
  /** Path to the audio file — absolute or relative to the song file. WAV, MP3, OGG, FLAC. */
  readonly path: string
  /** Trigger pattern — 1 = play, 0 = rest. Loops. Default: one-shot on step 0. */
  readonly pattern?: number[]
  /** Playback volume 0–1. Default: 1.0 */
  readonly volume?: number
  /** Playback rate multiplier. 1.0 = original pitch, 2.0 = octave up. Default: 1.0 */
  readonly rate?: number
  /** Loop the sample continuously. Default: false */
  readonly loop?: boolean
  /** Effects chain — use descriptor factories from the effects package (e.g. Delay, Reverb). */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

export type ThereminDSLProps = {
  /** Initial note name (e.g. `'A4'`) or frequency in Hz. Default: `'A4'`. */
  readonly note?: string
  /** Vibrato rate in Hz. Default: 5. */
  readonly vibratoRate?: number
  /** Vibrato depth in Hz. Default: 8. */
  readonly vibratoDepth?: number
  /** Output gain 0–1. Default: 0.4. */
  readonly gain?: number
  /** Effects chain. */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

export type SaxDSLProps = {
  /** Initial note name (e.g. `'A4'`). Default: `'A4'`. */
  readonly note?: string
  /** Peak output gain 0–1. Default: 0.4. */
  readonly gain?: number
  /** Note pattern — string note names (e.g. `'A3'`) or `0` for rest. */
  readonly pattern?: (number | string)[]
  /** Note duration in seconds. Default: 0.35. */
  readonly duration?: number
  /** Effects chain. */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

export type InstrumentDescriptor = {
  readonly _type: 'InstrumentDescriptor'
  readonly instrumentType: 'kick' | 'snare' | 'hihat' | 'synth' | 'sample' | 'theremin' | 'sax'
  readonly props: KickProps | SnareProps | HiHatProps | SynthDSLProps | SampleProps | ThereminDSLProps | SaxDSLProps
  // Minimal AudioComponent shape so Track() accepts it
  readonly id: string
  readonly type: string
  readonly connect: AudioComponent['connect']
  readonly disconnect: AudioComponent['disconnect']
  readonly dispose: AudioComponent['dispose']
}

export type SongProps = {
  readonly bpm: number
  readonly key?: string
  readonly genre?: string
  readonly tracks: TrackComponent[]
  readonly arrangement?: SectionDefinition[]
  readonly backend?: 'web-audio' | 'scsynth' | 'jack'
  readonly xdj?: { mode: 'score-mixer' | 'hardware-mixer' | 'hybrid' }
}

export type SongDefinition = {
  readonly _type: 'SongDefinition'
  readonly bpm: number
  readonly key?: string
  readonly genre?: string
  readonly tracks: TrackComponent[]
  readonly arrangement: SectionDefinition[]
  readonly backend?: string
  readonly xdj?: { mode: 'score-mixer' | 'hardware-mixer' | 'hybrid' }
}

export type SectionType = 'intro' | 'buildup' | 'drop' | 'breakdown' | 'outro'

export type SectionDefinition = {
  readonly _type: 'SectionDefinition'
  readonly sectionType: SectionType
  readonly bars: number
  readonly tracks: TrackComponent[]
}

export type TrackProps = {
  readonly volume?: number
  readonly pan?: number
  readonly mute?: boolean
  readonly solo?: boolean
}

export type TrackComponent = TrackProps & {
  readonly _type: 'TrackComponent'
  readonly component: AudioComponent
}
