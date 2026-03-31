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
import { createGenericKick }   from '../src/drums/kick.js'
import { createGenericHihat }  from '../src/drums/cymbal.js'
import { createGenericSnare }  from '../src/drums/snare.js'
import { createGenericSynth }  from '../src/synths/trigger.js'
import { createArp }           from '../src/melodic/sequenced.js'
import type { ScoreAudioContext } from '@score/core'

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

// createMockOscNode / createMockNoiseNode use a getter+setter for `onended` so the
// callback fires synchronously regardless of whether `stop()` is called before or
// after the assignment (real Web Audio fires asynchronously; factories may assign
// onended after calling stop(), so we need the setter approach to cover both orderings).

const createMockOscNode = () => {
  let _onended: ((event: Event) => void) | null = null
  let _stopped = false
  return {
    connect:               (_dest: unknown) => {},
    disconnect:            (_dest?: unknown) => {},
    _connectTo:            () => {},
    frequencyParam:        { connectModulator: () => {}, disconnectModulator: () => {} },
    start:                 () => {},
    stop: () => {
      _stopped = true
      if (typeof _onended === 'function') _onended(new Event('ended'))
    },
    get onended() { return _onended },
    set onended(fn: ((event: Event) => void) | null) {
      _onended = fn
      if (_stopped && typeof fn === 'function') fn(new Event('ended'))
    },
    setFrequency:          () => {},
    setDetune:             () => {},
    schedulePitchEnvelope: () => {},
  }
}

const createMockNoiseNode = () => {
  let _onended: ((event: Event) => void) | null = null
  let _stopped = false
  return {
    connect:    (_dest: unknown) => {},
    disconnect: (_dest?: unknown) => {},
    start: () => {},
    stop: () => {
      _stopped = true
      if (typeof _onended === 'function') _onended(new Event('ended'))
    },
    get onended() { return _onended },
    set onended(fn: ((event: Event) => void) | null) {
      _onended = fn
      if (_stopped && typeof fn === 'function') fn(new Event('ended'))
    },
  }
}

const createMockFilterNode = () => ({
  ...createMockNode(),
  frequencyParam: { connectModulator: () => {}, disconnectModulator: () => {} },
  setFrequency:   () => {},
  setType:        () => {},
})

// ── Throwing variants — exercises catch blocks in try { x.disconnect() } catch {} ──
// All disconnect/connect methods throw, so every catch block in onended/disconnect/dispose
// is exercised when the factory's cleanup code runs.

const createThrowingMockOscNode = () => {
  let _onended: ((event: Event) => void) | null = null
  let _stopped = false
  return {
    connect:               (_dest: unknown) => {},
    disconnect:            () => { throw new Error('already disconnected') },
    _connectTo:            () => {},
    frequencyParam:        { connectModulator: () => {}, disconnectModulator: () => {} },
    start:                 () => {},
    stop: () => {
      _stopped = true
      if (typeof _onended === 'function') _onended(new Event('ended'))
    },
    get onended() { return _onended },
    set onended(fn: ((event: Event) => void) | null) {
      _onended = fn
      if (_stopped && typeof fn === 'function') fn(new Event('ended'))
    },
    setFrequency:          () => {},
    setDetune:             () => {},
    schedulePitchEnvelope: () => {},
  }
}

const createThrowingMockNoiseNode = () => {
  let _onended: ((event: Event) => void) | null = null
  let _stopped = false
  return {
    connect:    (_dest: unknown) => {},
    disconnect: () => { throw new Error('already disconnected') },
    start: () => {},
    stop: () => {
      _stopped = true
      if (typeof _onended === 'function') _onended(new Event('ended'))
    },
    get onended() { return _onended },
    set onended(fn: ((event: Event) => void) | null) {
      _onended = fn
      if (_stopped && typeof fn === 'function') fn(new Event('ended'))
    },
  }
}

const createThrowingMockGainNode = () => ({
  ...createMockGainNode(),
  disconnect: () => { throw new Error('already disconnected') },
})

const createThrowingMockFilterNode = () => ({
  ...createMockFilterNode(),
  disconnect: () => { throw new Error('already disconnected') },
})

/** Context variant where all disconnect() calls throw — covers catch blocks in cleanup code. */
const throwingCtx = {
  currentTime: 0,
  sampleRate:  44100,
  state:       'running' as const,
  destination: createMockNode(),
  createOscillator: () => createThrowingMockOscNode(),
  createGain:       () => createThrowingMockGainNode(),
  createNoise:      () => createThrowingMockNoiseNode(),
  createFilter:     () => createThrowingMockFilterNode(),
  createAnalyser:   () => ({ ...createMockNode(), getFloatTimeDomainData: () => {} }),
  createWaveShaper: () => createMockNode(),
  createDelay:      () => createMockNode(),
  createDynamicsCompressor: () => createMockNode(),
  createCompressor: () => createMockNode(),
  createStereoPanner: () => createMockNode(),
  createBuffer:     () => ({ getChannelData: () => new Float32Array(0) }),
  createBufferSource: () => ({ ...createMockNode(), start: () => {}, stop: () => {} }),
  decodeAudio:      () => Promise.resolve({ getChannelData: () => new Float32Array(0) }),
  suspend:          () => Promise.resolve(),
  resume:           () => Promise.resolve(),
  close:            () => Promise.resolve(),
} as unknown as ScoreAudioContext

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
  createCompressor: () => createMockNode(),
  createStereoPanner: () => createMockNode(),
  createBuffer:     () => ({ getChannelData: () => new Float32Array(0) }),
  createBufferSource: () => ({ ...createMockNode(), start: () => {}, stop: () => {} }),
  decodeAudio:      () => Promise.resolve({ getChannelData: () => new Float32Array(0) }),
  suspend:          () => Promise.resolve(),
  resume:           () => Promise.resolve(),
  close:            () => Promise.resolve(),
} as unknown as ScoreAudioContext

// ── INSTRUMENT_REGISTRY tests ─────────────────────────────────────────────────

const EXPECTED_INSTRUMENT_TYPES: ReadonlyArray<InstrumentType> = [
  // Drums
  'kick', 'snare', 'hihat',
  'kick808', 'kick909', 'hihat808', 'hihatopen808', 'snare909',
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
      expect(typeof INSTRUMENT_REGISTRY[instrumentType].factory).toBe('function')
    },
  )

  it.each([
    ['kick',     {},                    ],
    ['snare',    {},                    ],
    ['hihat',    {},                    ],
    ['synth',    {},                    ],
    ['kick808',      {},                    ],
    ['kick909',      {},                    ],
    ['hihat808',     {},                    ],
    ['hihatopen808', {},                    ],
    ['snare909',     {},                    ],
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
      const { factory } = INSTRUMENT_REGISTRY[instrumentType]
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

// ── Local factory component-method coverage ───────────────────────────────────
// These tests exercise the method bodies inside each locally-defined factory:
// createGenericKick, createGenericHihat, createGenericSnare, createGenericSynth, createArp.
// Coverage target: each component's trigger/connect/disconnect/dispose/step body.

describe('createGenericKick — component methods', () => {
  it('trigger() runs without throwing', () => {
    const kick = createGenericKick(mockCtx)
    expect(() => { kick.trigger(0); }).not.toThrow()
  })

  it('trigger() with default time runs without throwing', () => {
    const kick = createGenericKick(mockCtx)
    expect(() => { kick.trigger(); }).not.toThrow()
  })

  it('connect() returns component', () => {
    const kick = createGenericKick(mockCtx)
    expect(kick.connect(mockCtx.destination)).toBe(kick)
  })

  it('disconnect() returns component', () => {
    const kick = createGenericKick(mockCtx)
    expect(kick.disconnect()).toBe(kick)
  })

  it('dispose() runs without throwing', () => {
    const kick = createGenericKick(mockCtx)
    expect(() => { kick.dispose(); }).not.toThrow()
  })

  it('accepts props override', () => {
    const kick = createGenericKick(mockCtx, { frequency: 60, pitchDrop: 0.05, gain: 0.7 })
    expect(() => { kick.trigger(0); }).not.toThrow()
  })
})

describe('createGenericHihat — component methods', () => {
  it('trigger() runs without throwing', () => {
    const hihat = createGenericHihat(mockCtx)
    expect(() => { hihat.trigger(0); }).not.toThrow()
  })

  it('connect() returns component', () => {
    const hihat = createGenericHihat(mockCtx)
    expect(hihat.connect(mockCtx.destination)).toBe(hihat)
  })

  it('disconnect() returns component', () => {
    const hihat = createGenericHihat(mockCtx)
    expect(hihat.disconnect()).toBe(hihat)
  })

  it('dispose() runs without throwing', () => {
    const hihat = createGenericHihat(mockCtx)
    expect(() => { hihat.dispose(); }).not.toThrow()
  })

  it('has type hihat', () => {
    expect(createGenericHihat(mockCtx).type).toBe('hihat')
  })
})

describe('createGenericSnare — component methods', () => {
  it('trigger() runs without throwing', () => {
    const snare = createGenericSnare(mockCtx)
    expect(() => { snare.trigger(0); }).not.toThrow()
  })

  it('connect() returns component', () => {
    const snare = createGenericSnare(mockCtx)
    expect(snare.connect(mockCtx.destination)).toBe(snare)
  })

  it('disconnect() returns component', () => {
    const snare = createGenericSnare(mockCtx)
    expect(snare.disconnect()).toBe(snare)
  })

  it('dispose() runs without throwing', () => {
    const snare = createGenericSnare(mockCtx)
    expect(() => { snare.dispose(); }).not.toThrow()
  })

  it('has type snare', () => {
    expect(createGenericSnare(mockCtx).type).toBe('snare')
  })
})

describe('createGenericSynth — component methods', () => {
  it('triggerNote() runs without throwing', () => {
    const synth = createGenericSynth(mockCtx)
    expect(() => { synth.triggerNote(440, 0); }).not.toThrow()
  })

  it('triggerNote() with filter prop runs without throwing', () => {
    const synth = createGenericSynth(mockCtx, { filter: { type: 'lowpass', frequency: 800 } })
    expect(() => { synth.triggerNote(220, 0); }).not.toThrow()
  })

  it('connect() returns component', () => {
    const synth = createGenericSynth(mockCtx)
    expect(synth.connect(mockCtx.destination)).toBe(synth)
  })

  it('disconnect() returns component', () => {
    const synth = createGenericSynth(mockCtx)
    expect(synth.disconnect()).toBe(synth)
  })

  it('dispose() runs without throwing', () => {
    const synth = createGenericSynth(mockCtx)
    expect(() => { synth.dispose(); }).not.toThrow()
  })

  it('has type synth', () => {
    expect(createGenericSynth(mockCtx).type).toBe('synth')
  })
})

describe('createArp — component methods', () => {
  it('step() runs without throwing', () => {
    const arp = createArp(mockCtx, { notes: ['C4', 'E4', 'G4'] })
    expect(() => { arp.step(1, 0); }).not.toThrow()
  })

  it('step() advances through notes without throwing', () => {
    const arp = createArp(mockCtx, { notes: ['C4', 'E4', 'G4'] })
    expect(() => {
      arp.step(1, 0)
      arp.step(1, 0.25)
      arp.step(1, 0.5)
      arp.step(1, 0.75)
    }).not.toThrow()
  })

  it('step() with active = 0 (rest) runs without throwing', () => {
    const arp = createArp(mockCtx, { notes: ['C4', 'E4'] })
    expect(() => { arp.step(0, 0); }).not.toThrow()
  })

  it('connect() returns component', () => {
    const arp = createArp(mockCtx, { notes: ['C4'] })
    expect(arp.connect(mockCtx.destination)).toBe(arp)
  })

  it('disconnect() returns component', () => {
    const arp = createArp(mockCtx, { notes: ['C4'] })
    expect(arp.disconnect()).toBe(arp)
  })

  it('dispose() runs without throwing', () => {
    const arp = createArp(mockCtx, { notes: ['C4'] })
    expect(() => { arp.dispose(); }).not.toThrow()
  })

  it('has type arp', () => {
    expect(createArp(mockCtx, { notes: [] }).type).toBe('arp')
  })

  it('mode:down advances index backwards without throwing', () => {
    const arp = createArp(mockCtx, { notes: ['C4', 'E4', 'G4'], mode: 'down' })
    expect(() => { arp.step(1, 0); arp.step(1, 0.25) }).not.toThrow()
  })

  it('mode:pingpong advances with direction reversal without throwing', () => {
    const arp = createArp(mockCtx, { notes: ['C4', 'E4', 'G4'], mode: 'pingpong' })
    expect(() => {
      arp.step(1, 0); arp.step(1, 0.25); arp.step(1, 0.5); arp.step(1, 0.75)
    }).not.toThrow()
  })

  it('mode:random (else branch) advances deterministically without throwing', () => {
    const arp = createArp(mockCtx, { notes: ['C4', 'E4', 'G4'], mode: 'random' as never })
    expect(() => { arp.step(1, 0); arp.step(1, 0.25) }).not.toThrow()
  })
})

// ── Catch-block coverage — throwingCtx exercises try/catch cleanup paths ──────
// Each factory has try { x.disconnect() } catch { /* ok */ } in onended/disconnect/dispose.
// throwingCtx makes all disconnect() calls throw so the catch blocks execute.

describe('createGenericKick — catch-block cleanup paths', () => {
  it('trigger() onended catch blocks run without throwing (disconnect throws)', () => {
    const kick = createGenericKick(throwingCtx)
    expect(() => { kick.trigger(0); }).not.toThrow()
  })
  it('disconnect() catch block runs without throwing', () => {
    const kick = createGenericKick(throwingCtx)
    expect(() => kick.disconnect()).not.toThrow()
  })
  it('dispose() catch block runs without throwing', () => {
    const kick = createGenericKick(throwingCtx)
    expect(() => { kick.dispose(); }).not.toThrow()
  })
})

describe('createGenericHihat — catch-block cleanup paths', () => {
  it('trigger() onended catch blocks run without throwing', () => {
    const hihat = createGenericHihat(throwingCtx)
    expect(() => { hihat.trigger(0); }).not.toThrow()
  })
  it('disconnect() catch block runs without throwing', () => {
    const hihat = createGenericHihat(throwingCtx)
    expect(() => hihat.disconnect()).not.toThrow()
  })
  it('dispose() catch block runs without throwing', () => {
    const hihat = createGenericHihat(throwingCtx)
    expect(() => { hihat.dispose(); }).not.toThrow()
  })
})

describe('createGenericSnare — catch-block cleanup paths', () => {
  it('trigger() onended catch blocks run without throwing', () => {
    const snare = createGenericSnare(throwingCtx)
    expect(() => { snare.trigger(0); }).not.toThrow()
  })
  it('disconnect() catch block runs without throwing', () => {
    const snare = createGenericSnare(throwingCtx)
    expect(() => snare.disconnect()).not.toThrow()
  })
  it('dispose() catch block runs without throwing', () => {
    const snare = createGenericSnare(throwingCtx)
    expect(() => { snare.dispose(); }).not.toThrow()
  })
})

describe('createGenericSynth — catch-block cleanup paths', () => {
  it('triggerNote() onended catch blocks run without throwing (no filter)', () => {
    const synth = createGenericSynth(throwingCtx)
    expect(() => { synth.triggerNote(440, 0); }).not.toThrow()
  })
  it('triggerNote() onended catch blocks run without throwing (with filter)', () => {
    const synth = createGenericSynth(throwingCtx, { filter: { frequency: 800 } })
    expect(() => { synth.triggerNote(440, 0); }).not.toThrow()
  })
  it('disconnect() catch block runs without throwing', () => {
    const synth = createGenericSynth(throwingCtx)
    expect(() => synth.disconnect()).not.toThrow()
  })
  it('dispose() catch block runs without throwing', () => {
    const synth = createGenericSynth(throwingCtx)
    expect(() => { synth.dispose(); }).not.toThrow()
  })
})

describe('createArp — catch-block cleanup paths', () => {
  it('step() onended catch blocks run without throwing', () => {
    const arp = createArp(throwingCtx, { notes: ['C4', 'E4'] })
    expect(() => { arp.step(1, 0); }).not.toThrow()
  })
  it('disconnect() catch block runs without throwing', () => {
    const arp = createArp(throwingCtx, { notes: ['C4'] })
    expect(() => arp.disconnect()).not.toThrow()
  })
  it('dispose() catch block runs without throwing', () => {
    const arp = createArp(throwingCtx, { notes: ['C4'] })
    expect(() => { arp.dispose(); }).not.toThrow()
  })
})
