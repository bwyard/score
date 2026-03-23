// @score/effects — Audio effects for the Score EDM framework

export { createFilter } from './filter.js'
export type { FilterProps } from './filter.js'

export { createDelay } from './delay.js'
export type { DelayProps } from './delay.js'

export { createReverb } from './reverb.js'
export type { ReverbProps } from './reverb.js'

export { createCompressor } from './compressor.js'
export type { CompressorProps } from './compressor.js'

export { createEQ } from './eq.js'
export type { EQProps } from './eq.js'

export { createSidechain } from './sidechain.js'
export type { SidechainProps } from './sidechain.js'

export { createDistortion } from './distortion.js'
export type { DistortionProps, DistortionMode } from './distortion.js'

export { createLimiter } from './limiter.js'
export type { LimiterProps } from './limiter.js'

export { createStereoWidener } from './stereo-widener.js'
export type { StereoWidenerProps } from './stereo-widener.js'

export { createGate } from './gate.js'
export type { GateProps } from './gate.js'

export { createChorus } from './chorus.js'
export type { ChorusProps } from './chorus.js'

export { createFlanger } from './flanger.js'
export type { FlangerProps } from './flanger.js'

export { createPhaser } from './phaser.js'
export type { PhaserProps } from './phaser.js'

export { createBitCrusher } from './bitcrusher.js'
export type { BitCrusherProps } from './bitcrusher.js'

export { createEffectsChain } from './chain.js'

export { createMultibandCompressor } from './multiband-compressor.js'
export type { MultibandCompressorProps, MultibandCompressorBandLow, MultibandCompressorBandMid, MultibandCompressorBandHigh } from './multiband-compressor.js'

export { createSaturation } from './saturation.js'
export type { SaturationProps } from './saturation.js'

export { createAutoPan } from './autopan.js'
export type { AutoPanProps, AutoPanShape } from './autopan.js'

// Descriptor factories — use these in song files (no AudioContext required)
export {
  Delay, Reverb, Filter, Compressor, EQ, Distortion, Limiter,
  BitCrusher, Chorus, Phaser, Flanger, StereoWidener, Gate,
  Saturation, AutoPan,
} from './descriptors.js'
