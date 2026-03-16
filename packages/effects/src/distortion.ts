// Distortion effect — wave shaping with dry/wet mix
// Uses WaveShaperNode for nonlinear distortion + gain nodes for mixing

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

export type DistortionMode = 'soft' | 'hard' | 'foldback'

export type DistortionProps = {
  readonly amount?: number
  readonly mode?: DistortionMode
  readonly mix?: number
}

const makeSoftCurve = (amount: number): Float32Array => {
  const samples = 44100
  const curve = new Float32Array(samples)
  const k = amount * 100
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
  }
  return curve
}

const makeHardCurve = (amount: number): Float32Array => {
  const samples = 44100
  const curve = new Float32Array(samples)
  const threshold = 1 - amount * 0.9
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.max(-threshold, Math.min(threshold, x)) / threshold
  }
  return curve
}

const makeFoldbackCurve = (amount: number): Float32Array => {
  const samples = 44100
  const curve = new Float32Array(samples)
  const threshold = 1 - amount * 0.8
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    if (Math.abs(x) > threshold) {
      curve[i] = Math.abs(Math.abs((x - threshold) % (threshold * 4)) - threshold * 2) - threshold
    } else {
      curve[i] = x
    }
  }
  return curve
}

const curveGenerators: Readonly<Record<DistortionMode, (amount: number) => Float32Array>> = {
  soft: makeSoftCurve,
  hard: makeHardCurve,
  foldback: makeFoldbackCurve,
}

export const createDistortion = (
  context: ScoreAudioContext,
  props?: DistortionProps,
) => {
  const amount = Math.max(0, Math.min(props?.amount ?? 0.5, 1.0))
  const mode = props?.mode ?? 'soft'
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1.0))

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const shaper = context.createWaveShaper({ curve: curveGenerators[mode](amount), oversample: '2x' })

  // Dry path: input -> dry -> output
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  // Wet path: input -> shaper -> wet -> output
  inputGain.connect(shaper)
  shaper.connect(wetGain)
  wetGain.connect(outputGain)

  const component: AudioComponent & {
    readonly setAmount: (value: number, mode?: DistortionMode) => void
    readonly setMix: (value: number, time?: number) => void
  } = {
    id: uid('distortion'),
    type: 'distortion' as const,
    setAmount: (value: number, newMode?: DistortionMode) => {
      const clamped = Math.max(0, Math.min(value, 1.0))
      const m = newMode ?? mode
      shaper.setCurve(curveGenerators[m](clamped))
    },
    setMix: (value: number, time?: number) => {
      const clamped = Math.max(0, Math.min(value, 1.0))
      dryGain.setGain(1.0 - clamped, time)
      wetGain.setGain(clamped, time)
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { dryGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { shaper.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
