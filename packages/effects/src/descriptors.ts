// Effect descriptor factories — pure data, no AudioContext required.
// Use these in song files. The ScoreEngine hydrates them at play time.
//
// Song file usage:
//   import { Delay, Reverb, Filter } from '@score/effects'
//   const bass = Synth({ effects: [Delay({ time: 0.375 }), Reverb({ decay: 2 })] })

import type { EffectDescriptor } from '@score/core'
import type { DelayProps } from './delay.js'
import type { ReverbProps } from './reverb.js'
import type { FilterProps } from './filter.js'
import type { CompressorProps } from './compressor.js'
import type { EQProps } from './eq.js'
import type { DistortionProps } from './distortion.js'
import type { LimiterProps } from './limiter.js'
import type { SaturationProps } from './saturation.js'
import type { AutoPanProps } from './autopan.js'

const makeDescriptor = (effectType: string, props: Record<string, unknown>): EffectDescriptor => ({
  _type: 'EffectDescriptor',
  effectType,
  props,
})

/**
 * Create a Delay descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Sync `time` to your BPM for musical echo — quarter note at 120 BPM = `0.5s`.
 *
 * @param props - Effect configuration. See {@link DelayProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const lead = Synth({ effects: [Delay({ time: 0.375, feedback: 0.4, mix: 0.3 })] })
 * ```
 *
 * @see {@link createDelay} — runtime factory that instantiates the effect with an AudioContext
 */
export const Delay  = (props?: DelayProps):      EffectDescriptor => makeDescriptor('delay',      (props ?? {}) as Record<string, unknown>)
/**
 * Create a Reverb descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Longer `decay` values simulate larger acoustic spaces — rooms to cathedrals.
 *
 * @param props - Effect configuration. See {@link ReverbProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const pad = Synth({ effects: [Reverb({ decay: 4.0, mix: 0.4 })] })
 * ```
 *
 * @see {@link createReverb} — runtime factory that instantiates the effect with an AudioContext
 */
export const Reverb = (props?: ReverbProps):     EffectDescriptor => makeDescriptor('reverb',     (props ?? {}) as Record<string, unknown>)
/**
 * Create a Filter descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Covers lowpass, highpass, bandpass, notch, allpass, peaking, and shelf types.
 *
 * @param props - Effect configuration. See {@link FilterProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const bass = Synth({ effects: [Filter({ type: 'lowpass', frequency: 800, Q: 2 })] })
 * ```
 *
 * @see {@link createFilter} — runtime factory that instantiates the effect with an AudioContext
 */
export const Filter = (props?: FilterProps):     EffectDescriptor => makeDescriptor('filter',     (props ?? {}) as Record<string, unknown>)
/**
 * Create a Compressor descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Controls dynamic range — glue compression at 4:1, aggressive limiting at 20:1+.
 *
 * @param props - Effect configuration. See {@link CompressorProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const drums = DrumGroup({ effects: [Compressor({ threshold: -18, ratio: 4, attack: 0.01 })] })
 * ```
 *
 * @see {@link createCompressor} — runtime factory that instantiates the effect with an AudioContext
 */
export const Compressor = (props?: CompressorProps): EffectDescriptor => makeDescriptor('compressor', (props ?? {}) as Record<string, unknown>)
/**
 * Create an EQ descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Three fixed bands: low shelf at 320 Hz, peaking mid at 1 kHz, high shelf at 3.2 kHz.
 *
 * @param props - Effect configuration. See {@link EQProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const lead = Synth({ effects: [EQ({ low: 2, mid: -4, high: 3 })] })
 * ```
 *
 * @see {@link createEQ} — runtime factory that instantiates the effect with an AudioContext
 */
export const EQ     = (props?: EQProps):         EffectDescriptor => makeDescriptor('eq',         (props ?? {}) as Record<string, unknown>)
/**
 * Create a Distortion descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Choose `'soft'` for tube warmth, `'hard'` for aggressive clipping, or `'foldback'` for industrial chaos.
 *
 * @param props - Effect configuration. See {@link DistortionProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const kick = Kick({ effects: [Distortion({ amount: 0.3, mode: 'soft', mix: 0.4 })] })
 * ```
 *
 * @see {@link createDistortion} — runtime factory that instantiates the effect with an AudioContext
 */
export const Distortion = (props?: DistortionProps): EffectDescriptor => makeDescriptor('distortion', (props ?? {}) as Record<string, unknown>)
/**
 * Create a Limiter descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Uses look-ahead gain reduction — no waveform clipping. Place last in the mastering chain.
 *
 * @param props - Effect configuration. See {@link LimiterProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const master = Song({ effects: [Limiter({ ceiling: -0.3, lookahead: 0.005 })] })
 * ```
 *
 * @see {@link createLimiter} — runtime factory that instantiates the effect with an AudioContext
 */
export const Limiter = (props?: LimiterProps):   EffectDescriptor => makeDescriptor('limiter',    (props ?? {}) as Record<string, unknown>)
/**
 * Create a BitCrusher descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Reduces bit depth for vintage sampler crunch, game console aesthetics, or lo-fi noise.
 *
 * @param props - Effect configuration (`bits`, `mix`). See `BitCrusherProps` for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const drums = DrumGroup({ effects: [BitCrusher({ bits: 8, mix: 0.6 })] })
 * ```
 *
 * @see {@link createBitCrusher} — runtime factory that instantiates the effect with an AudioContext
 */
export const BitCrusher = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('bitcrusher', props ?? {})
/**
 * Create a Chorus descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Thickens a signal by layering multiple slightly-delayed copies — ensemble character.
 *
 * @param props - Effect configuration (`voices`, `depth`, `mix`). See `ChorusProps` for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const pad = Synth({ effects: [Chorus({ voices: 3, depth: 0.004, mix: 0.5 })] })
 * ```
 *
 * @see {@link createChorus} — runtime factory that instantiates the effect with an AudioContext
 */
export const Chorus = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('chorus',     props ?? {})
/**
 * Create a Phaser descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Produces sweeping, whooshing phase notches — from subtle shimmer to dramatic sweeps.
 *
 * @param props - Effect configuration (`stages`, `feedback`). See `PhaserProps` for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const chord = Synth({ effects: [Phaser({ stages: 4, feedback: 0.5 })] })
 * ```
 *
 * @see {@link createPhaser} — runtime factory that instantiates the effect with an AudioContext
 */
export const Phaser = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('phaser',     props ?? {})
/**
 * Create a Flanger descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Comb-filter sweeps with metallic character — from subtle jet-plane shimmer to industrial resonance.
 *
 * @param props - Effect configuration (`depth`, `feedback`, `mix`). See `FlangerProps` for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const lead = Synth({ effects: [Flanger({ depth: 0.003, feedback: 0.6, mix: 0.4 })] })
 * ```
 *
 * @see {@link createFlanger} — runtime factory that instantiates the effect with an AudioContext
 */
export const Flanger = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('flanger',    props ?? {})
/**
 * Create a StereoWidener descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Controls stereo width via mid/side gain — `0` = mono, `1` = unity, `2` = extra wide.
 *
 * @param props - Effect configuration (`width`). See `StereoWidenerProps` for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const pad = Synth({ effects: [StereoWidener({ width: 1.8 })] })
 * ```
 *
 * @see {@link createStereoWidener} — runtime factory that instantiates the effect with an AudioContext
 */
export const StereoWidener = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('stereo-widener', props ?? {})
/**
 * Create a Gate descriptor — pure data, no AudioContext required.
 * Pass to {@link Song} tracks' `effects` array; the engine hydrates it at play time.
 * Silences signal below the threshold — essential for noise floors and creative rhythmic gating.
 *
 * @param props - Effect configuration (`threshold`, `attack`, `release`). See `GateProps` for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const vox = Vocal({ effects: [Gate({ threshold: -50, attack: 0.002, release: 0.1 })] })
 * ```
 *
 * @see {@link createGate} — runtime factory that instantiates the effect with an AudioContext
 */
export const Gate   = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('gate',       props ?? {})
/**
 * Create a Saturation descriptor — pure data, no AudioContext required.
 * Adds musical harmonic warmth via a tanh soft-clip transfer curve.
 * Lower `drive` (0.1–0.3) for subtle analog warmth; higher (0.6–0.9) for heavy saturation.
 *
 * @param props - Effect configuration. See {@link SaturationProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const bass = Synth({ effects: [Saturation({ drive: 0.3, mix: 0.5 })] })
 * ```
 */
export const Saturation = (props?: SaturationProps): EffectDescriptor => makeDescriptor('saturation', (props ?? {}) as Record<string, unknown>)
/**
 * Create an AutoPan descriptor — pure data, no AudioContext required.
 * LFO-driven stereo panning — creates rhythmic left/right movement.
 * Sync `rate` to BPM for musical panning: 120 BPM = 2 Hz (1 cycle per bar).
 *
 * @param props - Effect configuration. See {@link AutoPanProps} for all options.
 * @returns An {@link EffectDescriptor} for use in song files.
 *
 * @example
 * ```ts
 * const lead = Arp({ effects: [AutoPan({ rate: 0.5, depth: 0.7, shape: 'sine' })] })
 * ```
 */
export const AutoPan   = (props?: AutoPanProps): EffectDescriptor => makeDescriptor('autopan', (props ?? {}) as Record<string, unknown>)
