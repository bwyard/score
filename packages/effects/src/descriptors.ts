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

const makeDescriptor = (effectType: string, props: Record<string, unknown>): EffectDescriptor => ({
  _type: 'EffectDescriptor',
  effectType,
  props,
})

/** Feedback delay — echo and rhythmic repetition. */
export const Delay  = (props?: DelayProps):      EffectDescriptor => makeDescriptor('delay',      (props ?? {}) as Record<string, unknown>)
/** Reverb — simulated acoustic space. */
export const Reverb = (props?: ReverbProps):     EffectDescriptor => makeDescriptor('reverb',     (props ?? {}) as Record<string, unknown>)
/** Biquad filter — lowpass, highpass, bandpass, notch. */
export const Filter = (props?: FilterProps):     EffectDescriptor => makeDescriptor('filter',     (props ?? {}) as Record<string, unknown>)
/** Dynamics compressor — threshold, ratio, attack, release. */
export const Compressor = (props?: CompressorProps): EffectDescriptor => makeDescriptor('compressor', (props ?? {}) as Record<string, unknown>)
/** 3-band EQ — low shelf, peaking mid, high shelf. */
export const EQ     = (props?: EQProps):         EffectDescriptor => makeDescriptor('eq',         (props ?? {}) as Record<string, unknown>)
/** Distortion — waveshaper overdrive. */
export const Distortion = (props?: DistortionProps): EffectDescriptor => makeDescriptor('distortion', (props ?? {}) as Record<string, unknown>)
/** Brick-wall limiter — ceiling never exceeded. */
export const Limiter = (props?: LimiterProps):   EffectDescriptor => makeDescriptor('limiter',    (props ?? {}) as Record<string, unknown>)
/** Bit crusher — sample rate + bit depth reduction. */
export const BitCrusher = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('bitcrusher', props ?? {})
/** Chorus — modulated delay voices for thickness. */
export const Chorus = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('chorus',     props ?? {})
/** Phaser — allpass filter chain with LFO. */
export const Phaser = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('phaser',     props ?? {})
/** Flanger — short modulated delay + feedback. */
export const Flanger = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('flanger',    props ?? {})
/** Stereo widener — mid/side processing. */
export const StereoWidener = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('stereo-widener', props ?? {})
/** Noise gate — silence signal below threshold. */
export const Gate   = (props?: Record<string, unknown>): EffectDescriptor => makeDescriptor('gate',       props ?? {})
