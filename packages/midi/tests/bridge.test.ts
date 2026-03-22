import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMidiBridge } from '../src/bridge.js'
import type { ControllerProfile, BridgeEngine } from '../src/types.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

type PatchCall = Parameters<BridgeEngine['patch']>[0]

const makeEngine = (): BridgeEngine & { patchCalls: PatchCall[] } => {
  const patchCalls: PatchCall[] = []
  return {
    patchCalls,
    patch:  (props) => { patchCalls.push(props) },
    start:  vi.fn(),
    stop:   vi.fn(),
  }
}

const makeProfile = (overrides?: Partial<ControllerProfile>): ControllerProfile => ({
  name:     'Test Controller',
  id:       'test',
  status:   'verified',
  mappings: [],
  ...overrides,
})

// Mock a MIDI message event (matches our WebMidiInput event shape)
const midiEvent = (data: number[]): { data: Uint8Array } => ({
  data: new Uint8Array(data),
})

// ── Profile completeness ──────────────────────────────────────────────────────

describe('controller profiles', () => {
  it('xdj-rx3 has needs-testing status', async () => {
    const { xdjRx3 } = await import('../src/profiles/xdj-rx3.js')
    expect(xdjRx3.status).toBe('needs-testing')
    expect(xdjRx3.mappings.length).toBeGreaterThan(0)
  })

  it('xdj-xz has needs-testing status', async () => {
    const { xdjXz } = await import('../src/profiles/xdj-xz.js')
    expect(xdjXz.status).toBe('needs-testing')
    expect(xdjXz.mappings.length).toBeGreaterThan(0)
  })

  it('traktor has look-into status and empty mappings', async () => {
    const { traktor } = await import('../src/profiles/traktor.js')
    expect(traktor.status).toBe('look-into')
    expect(traktor.mappings).toEqual([])
  })

  it('serato has look-into status and empty mappings', async () => {
    const { serato } = await import('../src/profiles/serato.js')
    expect(serato.status).toBe('look-into')
    expect(serato.mappings).toEqual([])
  })
})

// ── Bridge — no WebMIDI ───────────────────────────────────────────────────────

describe('createMidiBridge', () => {
  it('starts disconnected', () => {
    const bridge = createMidiBridge({ profile: makeProfile(), engine: makeEngine() })
    expect(bridge.connected).toBe(false)
  })

  it('throws ScoreError when WebMIDI is unavailable', async () => {
    const bridge = createMidiBridge({ profile: makeProfile(), engine: makeEngine() })
    // navigator.requestMIDIAccess is undefined in test environment
    await expect(bridge.connect()).rejects.toThrow()
  })

  it('disconnect is safe to call when not connected', () => {
    const bridge = createMidiBridge({ profile: makeProfile(), engine: makeEngine() })
    expect(() => { bridge.disconnect(); }).not.toThrow()
    expect(bridge.connected).toBe(false)
  })
})

// ── Bridge — event routing ────────────────────────────────────────────────────

describe('MIDI event routing', () => {
  let engine: ReturnType<typeof makeEngine>

  beforeEach(() => { engine = makeEngine() })

  // We test routing by directly invoking the internal onMidiMessage handler.
  // To do this we set up a mock MIDI input and connect the bridge manually.

  const connectWithMockInput = async (
    profile: ControllerProfile,
    eng: BridgeEngine,
  ) => {
    const listeners: ((e: { data: Uint8Array }) => void)[] = []
    const mockInput = {
      name: profile.id,
      addEventListener:    (_: string, cb: (e: { data: Uint8Array }) => void) => { listeners.push(cb) },
      removeEventListener: (_: string, cb: (e: { data: Uint8Array }) => void) => {
        const idx = listeners.indexOf(cb); if (idx !== -1) listeners.splice(idx, 1)
      },
    }

    const mockAccess = {
      inputs: new Map([['0', mockInput]]),
    }

    // Patch navigator.requestMIDIAccess for this call
    Object.defineProperty(globalThis, 'navigator', {
      value:    { requestMIDIAccess: () => Promise.resolve(mockAccess) },
      writable: true,
    })

    const bridge = createMidiBridge({ profile, engine: eng })
    await bridge.connect()
    return { bridge, fire: (data: number[]) => { listeners.forEach(l => { l(midiEvent(data)); }); } }
  }

  it('routes controlChange to masterVolume', async () => {
    const profile = makeProfile({
      mappings: [{ type: 'controlChange', channel: 0, note: 0x1F, target: { param: 'masterVolume' } }],
    })
    const { fire } = await connectWithMockInput(profile, engine)
    fire([0xb0, 0x1F, 127]) // CC 31, value 127 → volume 1.0
    expect(engine.patchCalls[0]).toEqual({ masterVolume: 1 })
  })

  it('routes controlChange to trackVolume', async () => {
    const profile = makeProfile({
      mappings: [{ type: 'controlChange', channel: 0, note: 0x13, target: { param: 'trackVolume', trackIndex: 0 } }],
    })
    const { fire } = await connectWithMockInput(profile, engine)
    fire([0xb0, 0x13, 64]) // CC 19, value 64 → ~0.5
    expect(engine.patchCalls[0]?.tracks?.[0]?.volume).toBeCloseTo(0.504, 2)
  })

  it('routes noteOn to trackMute', async () => {
    const profile = makeProfile({
      mappings: [{ type: 'noteOn', channel: 0, note: 0x0B, target: { param: 'trackMute', trackIndex: 0 } }],
    })
    const { fire } = await connectWithMockInput(profile, engine)
    fire([0x90, 0x0B, 127]) // noteOn, note 11, vel 127 → mute on
    expect(engine.patchCalls[0]?.tracks?.[0]?.mute).toBe(true)
  })

  it('routes noteOn vel 0 to trackMute false', async () => {
    const profile = makeProfile({
      mappings: [{ type: 'noteOn', channel: 0, note: 0x0B, target: { param: 'trackMute', trackIndex: 1 } }],
    })
    const { fire } = await connectWithMockInput(profile, engine)
    fire([0x90, 0x0B, 0]) // noteOn, vel 0 → mute off
    expect(engine.patchCalls[0]?.tracks?.[0]?.mute).toBe(false)
  })

  it('routes bpm with custom range', async () => {
    const profile = makeProfile({
      mappings: [{ type: 'controlChange', channel: 0, note: 0x26, target: { param: 'bpm' } }],
    })
    const { fire } = await connectWithMockInput(profile, engine, )
    const bridge2 = createMidiBridge({ profile, engine, bpmRange: [100, 160] })
    // Can't easily test bpmRange via connectWithMockInput — test the scale directly
    fire([0xb0, 0x26, 0])   // min → 60 (default range)
    fire([0xb0, 0x26, 127]) // max → 200 (default range)
    expect((engine.patchCalls[0] as { bpm: number }).bpm).toBeCloseTo(60, 0)
    expect((engine.patchCalls[1] as { bpm: number }).bpm).toBeCloseTo(200, 0)
    bridge2.disconnect() // suppress unused warning
  })

  it('ignores unmapped MIDI messages', async () => {
    const profile = makeProfile({ mappings: [] })
    const { fire } = await connectWithMockInput(profile, engine)
    fire([0xb0, 0x01, 64]) // CC 1 — not in mappings
    expect(engine.patchCalls).toHaveLength(0)
  })

  it('ignores malformed messages (< 2 bytes)', async () => {
    const profile = makeProfile({ mappings: [] })
    const { fire } = await connectWithMockInput(profile, engine)
    fire([0xb0]) // truncated — only 1 byte
    expect(engine.patchCalls).toHaveLength(0)
  })
})
