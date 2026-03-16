// Web Audio API backend — default BackendProvider for Score
// Uses node-web-audio-api for Node.js, native Web Audio in browsers (Phase 13)

import {
  AudioContext,
  OfflineAudioContext,
} from 'node-web-audio-api'
import type {
  AudioNode as WebAudioNode,
  BaseAudioContext,
  AudioBufferSourceNode as WebBufferSourceNode,
  GainNode as WebGainNode,
  OscillatorNode as WebOscillatorNode,
} from 'node-web-audio-api'
import { ScoreError } from '../errors/ScoreError.js'
import type {
  BackendContext,
  BackendGainNode,
  BackendNode,
  BackendNoiseNode,
  BackendOscillatorNode,
  BackendProvider,
  NoiseType,
} from './types.js'

// --- Raw node access ---
// Symbol-keyed property to retrieve the underlying Web Audio node
// when connecting two BackendNodes together

const RAW = Symbol('web-audio-raw')

type WithRaw = { readonly [RAW]: WebAudioNode }

const getRaw = (node: BackendNode): WebAudioNode =>
  (node as unknown as WithRaw)[RAW]

// --- Noise buffer generation (pure functions) ---

const fillWhiteNoise = (data: Float32Array): void => {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1
  }
}

const fillPinkNoise = (data: Float32Array): void => {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
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

const noiseFiller: Readonly<Record<NoiseType, (d: Float32Array) => void>> = {
  white: fillWhiteNoise,
  pink: fillPinkNoise,
  brown: fillBrownNoise,
}

// --- Wrap a raw Web Audio node as a BackendNode ---

const wrapNode = (raw: WebAudioNode): BackendNode & WithRaw => ({
  [RAW]: raw,
  connect: (dest: BackendNode) => {
    raw.connect(getRaw(dest))
  },
  disconnect: (dest?: BackendNode) => {
    if (dest) {
      raw.disconnect(getRaw(dest))
    } else {
      raw.disconnect()
    }
  },
})

// --- Backend context factory ---

const createBackendContext = (ctx: BaseAudioContext): BackendContext => {
  const destination = wrapNode(ctx.destination as unknown as WebAudioNode)

  return {
    get currentTime() { return ctx.currentTime },
    get sampleRate() { return ctx.sampleRate },
    get state() { return ctx.state as 'running' | 'suspended' | 'closed' },
    destination,

    createOscillator: (props) => {
      const osc: WebOscillatorNode = ctx.createOscillator()
      osc.type = props?.type ?? 'sine'
      osc.frequency.value = props?.frequency ?? 440
      osc.detune.value = props?.detune ?? 0
      const base = wrapNode(osc as unknown as WebAudioNode)

      return {
        ...base,
        start: (time?: number) => osc.start(time ?? ctx.currentTime),
        stop: (time?: number) => osc.stop(time ?? ctx.currentTime),
        setFrequency: (value: number, time?: number) =>
          osc.frequency.setValueAtTime(value, time ?? ctx.currentTime),
        setDetune: (value: number, time?: number) =>
          osc.detune.setValueAtTime(value, time ?? ctx.currentTime),
      }
    },

    createGain: (props) => {
      const gainNode: WebGainNode = ctx.createGain()
      gainNode.gain.value = props?.gain ?? 1.0
      const base = wrapNode(gainNode as unknown as WebAudioNode)

      return {
        ...base,
        get gain() { return gainNode.gain.value },
        setGain: (value: number, time?: number) =>
          gainNode.gain.setValueAtTime(value, time ?? ctx.currentTime),
      }
    },

    createNoise: (props) => {
      const noiseType = props?.type ?? 'white'
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      noiseFiller[noiseType](buffer.getChannelData(0))

      const outputGain: WebGainNode = ctx.createGain()
      const outputBase = wrapNode(outputGain as unknown as WebAudioNode)
      let source: WebBufferSourceNode | null = null

      return {
        ...outputBase,
        start: (time?: number) => {
          source = ctx.createBufferSource() as unknown as WebBufferSourceNode
          source.buffer = buffer as unknown as AudioBuffer
          source.loop = true
          source.connect(outputGain as unknown as WebAudioNode)
          source.start(time)
        },
        stop: (time?: number) => {
          if (source) {
            source.stop(time)
            source.disconnect()
            source = null
          }
        },
      }
    },

    suspend: () => (ctx as unknown as { suspend: () => Promise<void> }).suspend(),
    resume: () => (ctx as unknown as { resume: () => Promise<void> }).resume(),
    close: () => (ctx as unknown as { close: () => Promise<void> }).close(),
  }
}
// --- Web Audio BackendProvider ---

export const webAudioBackend: BackendProvider = {
  name: 'web-audio',
  createContext: (options) => {
    try {
      if (options?.offline) {
        const sampleRate = options.sampleRate ?? 44100
        const ctx = new OfflineAudioContext(
          options.offline.numberOfChannels ?? 1,
          options.offline.length,
          sampleRate,
        )
        return createBackendContext(ctx)
      }
      return createBackendContext(new AudioContext(options))
    } catch (err) {
      throw ScoreError('Failed to create AudioContext', {
        fix: 'Ensure node-web-audio-api is installed: pnpm add node-web-audio-api',
        received: err instanceof Error ? err.message : String(err),
      })
    }
  },
}
