// Limiter effect — hard ceiling with lookahead
// Uses WaveShaperNode for hard clipping + DelayNode for lookahead

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

export type LimiterProps = {
  readonly ceiling?: number
  readonly lookahead?: number
  readonly release?: number
}

const makeHardClipCurve = (ceilingLinear: number): Float32Array => {
  const samples = 44100
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = Math.max(-ceilingLinear, Math.min(ceilingLinear, x))
  }
  return curve
}

const dbToLinear = (db: number): number => Math.pow(10, db / 20)

export const createLimiter = (
  context: ScoreAudioContext,
  props?: LimiterProps,
) => {
  const ceilingDb = props?.ceiling ?? -0.3
  const lookaheadTime = props?.lookahead ?? 0.005
  const ceilingLinear = dbToLinear(ceilingDb)

  const inputGain = context.createGain({ gain: 1.0 })
  const lookaheadDelay = context.createDelay({ delayTime: lookaheadTime, maxDelayTime: 0.05 })
  const shaper = context.createWaveShaper({ curve: makeHardClipCurve(ceilingLinear), oversample: '4x' })
  const outputGain = context.createGain({ gain: 1.0 })

  // Route: input -> lookahead delay -> shaper -> output
  inputGain.connect(lookaheadDelay)
  lookaheadDelay.connect(shaper)
  shaper.connect(outputGain)

  const component: AudioComponent & {
    readonly setCeiling: (value: number) => void
    readonly setLookahead: (value: number, time?: number) => void
  } = {
    id: uid('limiter'),
    type: 'limiter' as const,
    setCeiling: (value: number) => {
      shaper.setCurve(makeHardClipCurve(dbToLinear(value)))
    },
    setLookahead: (value: number, time?: number) => {
      lookaheadDelay.setDelayTime(value, time)
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
      try { lookaheadDelay.disconnect() } catch { /* already disconnected */ }
      try { shaper.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
