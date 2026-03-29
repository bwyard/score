// sequences
export { fibonacci, fibonacciRhythm, padovan, tribonacci } from './fibonacci.js'
// analysis
export { entropy, isMusical, density } from './entropy.js'
// rhythm
export { lcm, polyrhythm, patternOr, patternAnd, patternXor, patternNot, tile } from './polyrhythm.js'
// transforms
export { range, normalize, clip, smooth, quantize, interp } from './transforms.js'
// stochastic
export { drunk, markov } from './stochastic.js'
// harmony
export { circleOfFifths } from './harmony/circle.js'
export { just, pythagorean, meantone, edo19, edo31 } from './harmony/tuning.js'
// rk4 — generic form (Score); concrete scalar/3D forms from @prime/prime-dynamics
export { rk4 } from './rk4.js'
export type { DerivFn, AddFn, ScaleFn } from './rk4.js'
// @prime/prime-dynamics — RK4 + Lorenz (concrete, pure functions)
export { rk4Step, rk4Step3, lorenzStep } from '@prime/prime-dynamics'
// @prime/prime-interp — easing, lerp, smoothstep (additive; Score had none of these)
export {
  lerp, lerpClamped, invLerp, remap,
  smoothstep, smootherstep,
  easeInQuad,    easeOutQuad,    easeInOutQuad,
  easeInCubic,   easeOutCubic,   easeInOutCubic,
  easeInQuart,   easeOutQuart,   easeInOutQuart,
  easeInQuint,   easeOutQuint,   easeInOutQuint,
  easeInSine,    easeOutSine,    easeInOutSine,
  easeInExpo,    easeOutExpo,    easeInOutExpo,
  easeInCirc,    easeOutCirc,    easeInOutCirc,
  easeInBack,    easeOutBack,
  easeInElastic, easeOutElastic, easeInOutElastic,
  easeInBounce,  easeOutBounce,  easeInOutBounce,
} from '@prime/prime-interp'
// chaos
export { createLorenz } from './chaos/lorenz.js'
export type { LorenzState, LorenzParams } from './chaos/lorenz.js'
export { logisticMap, logisticSequence } from './chaos/logistic.js'
export { lyapunovExponent } from './chaos/lyapunov.js'
export { lsystem, lsystemToPattern } from './chaos/lsystem.js'
export type { LRule } from './chaos/lsystem.js'
export { wolframCA, wolframRow } from './chaos/wolfram.js'
// stochastic processes
export { createOUProcess } from './stochastic/ouprocess.js'
