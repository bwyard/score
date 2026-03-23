import type { AudioComponent, EffectDescriptor } from '@score/core'

// ── Instrument descriptors ────────────────────────────────────────────────────
// Pure data — no AudioContext. The engine hydrates these at play time.

/** Configuration props for the {@link Kick} instrument factory. */
export type KickProps = {
  readonly pattern?: number[]
  readonly volume?: number
  readonly synth?: { frequency?: number; pitchDrop?: number }
  /** Effects chain — use descriptor factories from the effects package (e.g. Delay, Reverb). */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/** Configuration props for the {@link Snare} instrument factory. */
export type SnareProps = {
  readonly pattern?: number[]
  readonly volume?: number
  /** Effects chain — use descriptor factories from the effects package (e.g. Delay, Reverb). */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/** Configuration props for the {@link HiHat} instrument factory. */
export type HiHatProps = {
  readonly pattern?: number[]
  readonly volume?: number
  readonly open?: boolean
  /** Effects chain — use descriptor factories from the effects package (e.g. Delay, Reverb). */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/** Configuration props for the {@link Synth} instrument factory. */
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

/** Configuration props for the {@link Sample} instrument factory. */
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

/** Configuration props for the {@link Theremin} instrument factory. */
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

/** Configuration props for the {@link Sax} instrument factory. */
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

/** Configuration props for the {@link Kick808} instrument factory. */
export type Kick808DSLProps = {
  readonly pattern?: number[]
  readonly volume?: number
  /** Initial pitch of the sine body in Hz. Default `60`. */
  readonly startFreq?: number
  /** Final pitch after fall in Hz. Default `45`. */
  readonly endFreq?: number
  /** Duration of pitch fall in seconds. Default `0.15`. */
  readonly pitchFall?: number
  /** Amplitude decay in seconds. Default `0.7`. */
  readonly decay?: number
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/** Configuration props for the {@link Kick909} instrument factory. */
export type Kick909DSLProps = {
  readonly pattern?: number[]
  readonly volume?: number
  /** Initial pitch of the sine body in Hz. Default `65`. */
  readonly startFreq?: number
  /** Final pitch after fall in Hz. Default `48`. */
  readonly endFreq?: number
  /** Duration of pitch fall in seconds. Default `0.12`. */
  readonly pitchFall?: number
  /** Sine body decay in seconds. Default `0.65`. */
  readonly decay?: number
  /** Noise click level relative to body (0–1). Default `0.25` (≈ −12 dB). */
  readonly clickLevel?: number
  /** Noise click decay in seconds. Default `0.03`. */
  readonly clickDecay?: number
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/** Configuration props for the {@link Hihat808} instrument factory. */
export type Hihat808DSLProps = {
  readonly pattern?: number[]
  readonly volume?: number
  /** Amplitude decay in seconds. Default `0.06` (closed) or `0.3` (open). */
  readonly decay?: number
  /** When true, uses longer open hi-hat decay. Default `false`. */
  readonly open?: boolean
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/** Configuration props for the {@link Snare909} instrument factory. */
export type Snare909DSLProps = {
  readonly pattern?: number[]
  readonly volume?: number
  /** Triangle oscillator decay in seconds. Default `0.2`. */
  readonly toneDecay?: number
  /** Noise component decay in seconds. Default `0.3`. */
  readonly noiseDecay?: number
  /** Tone-to-noise ratio (0–1). Default `0.4`. */
  readonly toneNoiseRatio?: number
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/** Configuration props for the {@link SubSynth} instrument factory. */
export type SubSynthDSLProps = {
  readonly pattern?: (number | string)[]
  readonly volume?: number
  /** Oscillator waveform. Default `'sawtooth'`. */
  readonly wave?: 'sine' | 'square' | 'sawtooth' | 'triangle'
  /** Oscillator frequency in Hz. Default `220`. */
  readonly frequency?: number
  readonly filter?: {
    readonly type?: 'lowpass' | 'highpass' | 'bandpass'
    readonly frequency?: number
    readonly Q?: number
  }
  readonly adsr?: {
    readonly attack?: number
    readonly decay?: number
    readonly sustain?: number
    readonly release?: number
  }
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/** Configuration props for the {@link Arp} instrument factory. */
export type ArpDSLProps = {
  /** Note names to arpeggiate in order, e.g. `['C4', 'E4', 'G4', 'B4']`. Required. */
  readonly notes: string[]
  /** Arpeggio traversal mode. Default: `'up'`. */
  readonly mode?: 'up' | 'down' | 'pingpong' | 'random'
  /** Steps per note advance — `1` = change note every step, `2` = every other step. Default: `1`. */
  readonly rate?: number
  /** Oscillator wave type. Default: `'triangle'`. */
  readonly wave?: 'sine' | 'square' | 'sawtooth' | 'triangle'
  /** Peak output gain 0–1. Default: `0.3`. */
  readonly gain?: number
  /** ADSR envelope. */
  readonly envelope?: {
    readonly attack?: number
    readonly decay?: number
    readonly sustain?: number
    readonly release?: number
  }
  /** Trigger pattern — non-zero = play, 0 = rest. Default: all steps active. */
  readonly pattern?: (number | string)[]
  /** Effects chain. */
  readonly effects?: ReadonlyArray<EffectDescriptor>
}

/**
 * Pure data descriptor produced by instrument factories (e.g. {@link Kick}, {@link Synth}).
 *
 * Carries no audio logic — the engine reads this at play time and hydrates it into
 * live audio nodes. The `connect`, `disconnect`, and `dispose` methods are no-ops
 * that satisfy the {@link AudioComponent} interface so `Track()` accepts it directly.
 *
 * @see {@link Kick}, {@link Snare}, {@link HiHat}, {@link Synth}, {@link Sample},
 *   {@link Theremin}, {@link Sax}, {@link Arp} — factories that return this type
 */
export type InstrumentDescriptor = {
  readonly _type: 'InstrumentDescriptor'
  readonly instrumentType: 'kick' | 'snare' | 'hihat' | 'synth' | 'sample' | 'theremin' | 'sax' | 'arp' | 'kick808' | 'kick909' | 'hihat808' | 'snare909' | 'subsynth'
  readonly props: KickProps | SnareProps | HiHatProps | SynthDSLProps | SampleProps | ThereminDSLProps | SaxDSLProps | ArpDSLProps | Kick808DSLProps | Kick909DSLProps | Hihat808DSLProps | Snare909DSLProps | SubSynthDSLProps
  // Minimal AudioComponent shape so Track() accepts it
  readonly id: string
  readonly type: string
  readonly connect: AudioComponent['connect']
  readonly disconnect: AudioComponent['disconnect']
  readonly dispose: AudioComponent['dispose']
}

/**
 * Input props for the {@link Song} factory.
 *
 * `bpm` and `tracks` are required. All other fields are optional.
 * `arrangement` defaults to `[]` — the engine loops all tracks indefinitely.
 */
export type SongProps = {
  readonly bpm: number
  readonly key?: string
  readonly genre?: string
  readonly tracks: TrackComponent[]
  readonly arrangement?: SectionDefinition[]
  readonly backend?: 'web-audio' | 'scsynth' | 'jack'
  readonly xdj?: { mode: 'score-mixer' | 'hardware-mixer' | 'hybrid' }
}

/**
 * The validated output of the {@link Song} factory.
 *
 * Passed to the engine's `play()` or `render()` entry points.
 * `arrangement` is always present (empty array if none was provided).
 *
 * @see {@link Song} — the factory that creates this type
 */
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

/** The recognised section types for EDM arrangement structure. */
export type SectionType = 'intro' | 'buildup' | 'drop' | 'breakdown' | 'outro'

/**
 * Pure data descriptor produced by section factories ({@link Intro}, {@link Drop}, etc.).
 *
 * Describes one named section of a song: its structural role, duration in bars,
 * and the set of tracks active during that section. Passed to `Song.arrangement`.
 *
 * @see {@link Intro}, {@link Buildup}, {@link Drop}, {@link Breakdown}, {@link Outro}
 */
export type SectionDefinition = {
  readonly _type: 'SectionDefinition'
  readonly sectionType: SectionType
  readonly bars: number
  readonly tracks: TrackComponent[]
}

/**
 * Optional mix settings for a track — passed as the second argument to {@link Track}.
 *
 * All fields are optional. Omitting them leaves the instrument at its default levels.
 */
export type TrackProps = {
  readonly volume?: number
  readonly pan?: number
  readonly mute?: boolean
  readonly solo?: boolean
}

/**
 * The output of the {@link Track} factory — an instrument with mix settings attached.
 *
 * Song authors rarely need to reference this type directly; it is inferred from `Track()`.
 *
 * @see {@link Track} — the factory that creates this type
 * @see {@link SongProps} — `tracks` accepts an array of `TrackComponent`
 */
export type TrackComponent = TrackProps & {
  readonly _type: 'TrackComponent'
  readonly component: AudioComponent
}
