// @score/modulation
// LFO, ADSR, and pattern value sources for modulating audio parameters over time

export { createLFO } from './lfo.js'
export type { LFOProps, LFOShape, LFOComponent } from './lfo.js'
export { createADSR } from './adsr.js'
export type { ADSRProps } from './adsr.js'
export { ramp, sine, cosine } from './sources.js'
