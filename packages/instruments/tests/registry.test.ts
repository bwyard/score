// @score/instruments — registry.test.ts
// Verifies that INSTRUMENT_REGISTRY and EFFECTS_REGISTRY have all expected keys
// and that each factory produces a valid AudioComponent (connect / disconnect / dispose).

import { describe, it, expect } from 'vitest'
import {
  INSTRUMENT_REGISTRY,
  EFFECTS_REGISTRY,
  type InstrumentType,
  type EffectType,
} from '../src/index.js'

// ── Mock BackendContext ───────────────────────────────────────────────────────
// Minimal mock — just enough to instantiate factories without a real AudioContext.

const createMockNode = () => ({
  connect:    (_dest: unknown) => {},
  disconnect: (_dest?: unknown) => {},
})

const createMockGainNode = () => ({
  ...createMockNode(),
  gainParam: { connectModulator: () => {}, disconnectModulator: () => {} },
  gain:      1.0,
  setGain:        () => {},
  cancelScheduledValues: () => {},
  scheduleFade:   () => {},
  scheduleEnvelope: () => {},
})

const createMockOscNode = () => ({
  ...createMockNode(),
  _connectTo:           () => {},
  frequencyParam:       { connectModulator: () => {}, disconnectModulator: () => {} },
  start:                () => {},
  stop:                 () => {},
  onended:              null as ((event: Event) => void) | null,
  setFrequency:         () => {},
  setDetune:            () => {},
  schedulePitchEnvelope: () => {},
})

const createMockNoiseNode = () => ({
  ...createMockNode(),
  start: () => {},
  stop:  () => {},
  onended: null as ((event: Event) => void) | null,
})

const createMockFilterNode = () => ({
  ...createMockNode(),
  frequencyParam: { connectModulator: () => {}, disconnectModulator: () => {} },
  setFrequency:   () => {},
  setType:        () => {},
})

const mockCtx = {
  currentTime: 0,
  sampleRate:  44100,
  state:       'running' as const,
  destination: createMockNode(),
  createOscillator: () => createMockOscNode(),
  createGain:       () => createMockGainNode(),
  createNoise:      () => createMockNoiseNode(),
  createFilter:     () => createMockFilterNode(),
  createAnalyser:   () => ({ ...createMockNode(), getFloatTimeDomainData: () => {} }),
  createWaveShaper: () => createMockNode(),
  createDelay:      () => createMockNode(),
  createDynamicsCompressor: () => createMockNode(),
  createStereoPanner: () => createMockNode(),
  createBuffer:     () => ({ getChannelData: () => new Float32Array(0) }),
  createBufferSource: () => ({ ...createMockNode(), start: () => {}, stop: () => {} }),
  decodeAudio:      () => Promise.resolve({ getChannelData: () => new Float32Array(0) }),
  suspend:          () => Promise.resolve(),
  resume:           () => Promise.resolve(),
  close:            () => Promise.resolve(),
}

// ── INSTRUMENT_REGISTRY tests ─────────────────────────────────────────────────

const EXPECTED_INSTRUMENT_TYPES: ReadonlyArray<InstrumentType> = [
  // Drums
  'kick', 'snare', 'hihat',
  'kick808', 'kick909', 'hihat808', 'snare909',
  // Synths
  'synth', 'subsynth', 'pad', 'fmsynth', 'rhodes', 'pluck', 'bass-303',
  // Melodic
  'theremin', 'sax', 'arp',
]

describe('INSTRUMENT_REGISTRY', () => {
  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(INSTRUMENT_REGISTRY)).toBe(true)
  })

  it('contains all expected instrument type keys', () => {
    const keys = Object.keys(INSTRUMENT_REGISTRY) as InstrumentType[]
    for (const expected of EXPECTED_INSTRUMENT_TYPES) {
      expect(keys).toContain(expected)
    }
  })

  it.each(EXPECTED_INSTRUMENT_TYPES)(
    '%s factory is a function',
    (instrumentType) => {
      expect(typeof INSTRUMENT_REGISTRY[instrumentType]).toBe('function')
    },
  )

  it.each([
    ['kick',     {},                    ],
    ['snare',    {},                    ],
    ['hihat',    {},                    ],
    ['synth',    {},                    ],
    ['kick808',  {},                    ],
    ['kick909',  {},                    ],
    ['hihat808', {},                    ],
    ['snare909', {},                    ],
    ['subsynth', {},                    ],
    ['fmsynth',  {},                    ],
    ['pad',      {},                    ],
    ['rhodes',   {},                    ],
    ['pluck',    {},                    ],
    ['bass-303', {},                    ],
    ['theremin', {},                    ],
    ['sax',      {},                    ],
    ['arp',      { notes: ['C4', 'E4'] }],
  ] as const)(
    '%s factory produces a valid AudioComponent (id, type, connect, disconnect, dispose)',
    (instrumentType, props) => {
      const factory = INSTRUMENT_REGISTRY[instrumentType]
      // Cast through unknown — mockCtx satisfies the methods used by each factory but
      // does not implement every BackendContext method (compressor, delay, etc.).
       
      const component = (factory as unknown as (ctx: unknown, props: unknown) => unknown)(mockCtx, props)

      expect(component).toBeDefined()
      expect(typeof (component as { id?: unknown }).id).toBe('string')
      expect(typeof (component as { type?: unknown }).type).toBe('string')
      expect(typeof (component as { connect?: unknown }).connect).toBe('function')
      expect(typeof (component as { disconnect?: unknown }).disconnect).toBe('function')
      expect(typeof (component as { dispose?: unknown }).dispose).toBe('function')
    },
  )
})

// ── EFFECTS_REGISTRY tests ─────────────────────────────────────────────────────

const EXPECTED_EFFECT_TYPES: ReadonlyArray<EffectType> = [
  'delay', 'reverb', 'filter', 'compressor', 'eq',
  'distortion', 'limiter', 'bitcrusher', 'chorus', 'phaser',
  'flanger', 'stereo-widener', 'gate', 'saturation', 'autopan',
]

describe('EFFECTS_REGISTRY', () => {
  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(EFFECTS_REGISTRY)).toBe(true)
  })

  it('contains all 15 expected effect type keys', () => {
    expect(Object.keys(EFFECTS_REGISTRY)).toHaveLength(15)
    const keys = Object.keys(EFFECTS_REGISTRY) as EffectType[]
    for (const expected of EXPECTED_EFFECT_TYPES) {
      expect(keys).toContain(expected)
    }
  })

  it.each(EXPECTED_EFFECT_TYPES)(
    '%s factory is a function',
    (effectType) => {
      expect(typeof EFFECTS_REGISTRY[effectType]).toBe('function')
    },
  )
})

// ── SongContext type smoke test ───────────────────────────────────────────────

import type { SongContext } from '@score/core'

describe('SongContext type', () => {
  it('accepts a valid song context object', () => {
    const ctx: SongContext = {
      bpm:           128,
      seed:          42,
      bars:          0,
      timeSignature: [4, 4],
    }
    expect(ctx.bpm).toBe(128)
    expect(ctx.seed).toBe(42)
    expect(ctx.bars).toBe(0)
    expect(ctx.timeSignature).toEqual([4, 4])
  })
})
