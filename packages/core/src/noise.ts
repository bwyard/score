import { ScoreError } from './errors/ScoreError.js'
import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'

export type NoiseType = 'white' | 'pink' | 'brown'

const VALID_TYPES: ReadonlyArray<NoiseType> = ['white', 'pink', 'brown']

const fillWhiteNoise = (data: Float32Array): void => {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1
  }
}

const fillPinkNoise = (data: Float32Array): void => {
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }
}

const fillBrownNoise = (data: Float32Array): void => {
  let lastOut = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + white * 0.02) / 1.02
    data[i] = lastOut * 3.5
  }
}

const fillBuffer = (data: Float32Array, type: NoiseType): void => {
  const fillers: Record<NoiseType, (d: Float32Array) => void> = {
    white: fillWhiteNoise,
    pink: fillPinkNoise,
    brown: fillBrownNoise,
  }
  fillers[type](data)
}

export const createNoise = (
  context: ScoreAudioContext,
  props?: { type?: NoiseType },
): AudioComponent & {
  readonly start: (time?: number) => void
  readonly stop: (time?: number) => void
} => {
  const noiseType = props?.type ?? 'white'

  if (!VALID_TYPES.includes(noiseType)) {
    throw ScoreError(`Invalid noise type: ${noiseType}`, {
      received: noiseType,
      fix: `Use one of: ${VALID_TYPES.join(', ')}`,
    })
  }

  const bufferSize = context.sampleRate * 2
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)
  fillBuffer(data, noiseType)

  const gainNode = context.createGain()
  let source: AudioBufferSourceNode | null = null

  const component: AudioComponent & {
    readonly start: (time?: number) => void
    readonly stop: (time?: number) => void
  } = {
    start: (time?: number) => {
      source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gainNode)
      source.start(time)
    },
    stop: (time?: number) => {
      if (source) {
        source.stop(time)
        source.disconnect()
        source = null
      }
    },
    connect: (destination: ScoreAudioNode) => {
      gainNode.connect(destination)
      return component
    },
    disconnect: () => {
      gainNode.disconnect()
      return component
    },
    dispose: () => {
      if (source) {
        try {
          source.stop()
        } catch {
          /* already stopped */
        }
        source.disconnect()
        source = null
      }
      gainNode.disconnect()
    },
  }

  return component
}
