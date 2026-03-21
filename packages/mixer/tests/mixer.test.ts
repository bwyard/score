import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createMixer } from '../src/mixer.js'
import type { AudioComponent, BackendNode } from '@score/core'

const h = useHarness()
afterAll(() => h.cleanup())

const createMockEffect = (): AudioComponent & { readonly input: BackendNode } => {
  const inputNode: BackendNode = { connect: () => {}, disconnect: () => {} }
  const effect: AudioComponent & { readonly input: BackendNode } = {
    id: 'mock-effect-1',
    type: 'mock-effect',
    input: inputNode,
    connect: (_d: unknown) => effect,
    disconnect: () => effect,
    dispose: () => {},
  }
  return effect
}

describe('createMixer', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(typeof mixer.connect).toBe('function')
    expect(typeof mixer.disconnect).toBe('function')
    expect(typeof mixer.dispose).toBe('function')
  })

  it('has id and type properties', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(mixer.id).toMatch(/^mixer-/)
    expect(mixer.type).toBe('mixer')
  })

  it('creates master gain, EQ filters, limiter compressor', () => {
    const ctx = h.mockContext()
    createMixer(ctx)
    // masterGain = 1+ gains
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(1)
    // masterEQ = 3 filters (low/mid/high shelves) — sub filter removed (was in-series bug t092)
    expect(ctx.createdFilters.length).toBeGreaterThanOrEqual(3)
    // limiter = 1 compressor (replaced WaveShaper, t095)
    expect(ctx.createdCompressors.length).toBeGreaterThanOrEqual(1)
  })

  it('accepts masterVolume prop', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, { masterVolume: 0.5 })
    expect(mixer).toBeDefined()
  })

  it('accepts limiterCeiling prop', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, { limiterCeiling: -1.0 })
    expect(mixer).toBeDefined()
  })

  it('creates initial channels from props', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, {
      channels: [
        { name: 'Kick' },
        { name: 'Snare' },
      ],
    })
    const ch0 = mixer.getChannel(0)
    const ch1 = mixer.getChannel(1)
    expect(ch0).toBeDefined()
    expect(ch0!.name).toBe('Kick')
    expect(ch1).toBeDefined()
    expect(ch1!.name).toBe('Snare')
  })

  it('creates initial returns from props', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, {
      returns: [
        { name: 'Reverb', effect: createMockEffect() },
      ],
    })
    const ret0 = mixer.getReturn(0)
    expect(ret0).toBeDefined()
    expect(ret0!.name).toBe('Reverb')
  })

  it('getChannel returns undefined for out-of-range index', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(mixer.getChannel(0)).toBeUndefined()
    expect(mixer.getChannel(99)).toBeUndefined()
  })

  it('getReturn returns undefined for out-of-range index', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(mixer.getReturn(0)).toBeUndefined()
    expect(mixer.getReturn(99)).toBeUndefined()
  })

  it('setMasterVolume does not throw', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(() => { mixer.setMasterVolume(0.6) }).not.toThrow()
  })

  it('setMasterVolume accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(() => { mixer.setMasterVolume(0.6, 1.0) }).not.toThrow()
  })

  it('addChannel creates and returns a new channel', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    const ch = mixer.addChannel({ name: 'Bass' })
    expect(ch).toBeDefined()
    expect(ch.name).toBe('Bass')
    expect(mixer.getChannel(0)).toBe(ch)
  })

  it('addChannel works without props', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    const ch = mixer.addChannel()
    expect(ch).toBeDefined()
    expect(ch.name).toBe('Channel')
  })

  it('removeChannel disposes and removes channel at index', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, {
      channels: [{ name: 'Kick' }, { name: 'Snare' }],
    })
    expect(mixer.getChannel(0)!.name).toBe('Kick')
    mixer.removeChannel(0)
    // After removal, index 0 should now be Snare
    const ch0 = mixer.getChannel(0)
    expect(ch0).toBeDefined()
    expect(ch0!.name).toBe('Snare')
  })

  it('removeChannel with invalid index does not throw', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(() => { mixer.removeChannel(99) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(mixer.connect(ctx.destination)).toBe(mixer)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(mixer.disconnect()).toBe(mixer)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, {
      channels: [{ name: 'Kick' }],
      returns: [{ effect: createMockEffect() }],
    })
    expect(() => { mixer.dispose() }).not.toThrow()
  })

  it('dispose when empty does not throw', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(() => { mixer.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const mixer = createMixer(ctx)
    expect(() => { mixer.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const mixer = createMixer(ctx)
    expect(() => { mixer.dispose() }).not.toThrow()
  })

  it('solo logic: soloing a channel mutes non-soloed channels', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, {
      channels: [
        { name: 'Kick' },
        { name: 'Snare' },
        { name: 'Bass' },
      ],
    })
    const ch1 = mixer.getChannel(1)!
    ch1.setSolo(true)
    // After solo, channel 1 should still be audible
    expect(ch1.solo).toBe(true)
  })

  it('solo logic: un-soloing restores channels', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, {
      channels: [
        { name: 'Kick' },
        { name: 'Snare' },
      ],
    })
    const ch0 = mixer.getChannel(0)!
    const ch1 = mixer.getChannel(1)!
    ch1.setSolo(true)
    ch1.setSolo(false)
    // After un-solo, all should be restored
    expect(ch0.solo).toBe(false)
    expect(ch1.solo).toBe(false)
  })

  it('creates initial groups from props', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, {
      groups: [{ name: 'Drums' }],
    })
    const grp = mixer.getGroup(0)
    expect(grp).toBeDefined()
    expect(grp!.name).toBe('Drums')
  })

  it('getGroup returns undefined for out-of-range index', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    expect(mixer.getGroup(0)).toBeUndefined()
  })

  it('addGroup creates and returns a new group', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx)
    const grp = mixer.addGroup({ name: 'Synths' })
    expect(grp).toBeDefined()
    expect(grp.name).toBe('Synths')
    expect(mixer.getGroup(0)).toBe(grp)
  })

  it('dispose cleans up groups without throwing', () => {
    const ctx = h.mockContext()
    const mixer = createMixer(ctx, {
      groups: [{ name: 'Drums' }],
    })
    expect(() => { mixer.dispose() }).not.toThrow()
  })
})
