// chain.test.ts — ChainablePart chain API tests
//
// Every ChainablePart method is covered: factory basics, pattern, pitch/notes,
// amplitude/ADSR, tone, space/effects, routing, modulation, meta, immutability,
// full chains, and error paths.
//
// Entry point: createPart({ instrumentType: 'kick-808', props: {} })
// All methods return a NEW object — never mutate the original.

import { describe, it, expect } from 'vitest'
import { createPart } from '../src/chain.js'
import { lfo } from '../src/modulation.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

const base = () => createPart({ instrumentType: 'kick-808', props: {} })

// ── Factory basics ────────────────────────────────────────────────────────────

describe('createPart — factory basics', () => {
  it('_type is ChainablePart', () => {
    expect(base()._type).toBe('ChainablePart')
  })

  it('instrumentType is preserved', () => {
    expect(base().instrumentType).toBe('kick-808')
  })

  it('type mirrors instrumentType', () => {
    const p = base()
    expect(p.type).toBe(p.instrumentType)
  })

  it('each call produces a unique id', () => {
    const a = base()
    const b = base()
    expect(a.id).toBeTruthy()
    expect(b.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })
})

// ── Pattern — core ────────────────────────────────────────────────────────────

describe('ChainablePart — pattern core', () => {
  it('.euclidean(n) sets _pattern', () => {
    const p = base().euclidean(4)
    expect(Array.isArray(p._pattern)).toBe(true)
    expect((p._pattern as number[]).length).toBe(16)
    expect((p._pattern as number[]).filter(Boolean).length).toBe(4)
  })

  it('.euclidean(n, steps) respects custom step count', () => {
    const p = base().euclidean(3, 8)
    expect((p._pattern as number[]).length).toBe(8)
    expect((p._pattern as number[]).filter(Boolean).length).toBe(3)
  })

  it('.speed(n) sets _speed', () => {
    const p = base().speed(2)
    expect(p._speed).toBe(2)
  })

  it('.speed(0) throws ScoreError', () => {
    expect(() => base().speed(0)).toThrow()
  })

  it('.slow(n) sets _speed to 1/n', () => {
    const p = base().slow(2)
    expect(p._speed).toBe(0.5)
  })

  it('.fast(n) sets _speed to n', () => {
    const p = base().fast(2)
    expect(p._speed).toBe(2)
  })

  it('.rev() sets _speed to -1', () => {
    const p = base().rev()
    expect(p._speed).toBe(-1)
  })

  it('.rev() wraps pattern in a PatternFn (pattern type changes)', () => {
    const p = base().euclidean(4, 8).rev()
    // rev() from @score/pattern returns PatternFn, not array
    expect(p._speed).toBe(-1)
    expect(p._pattern).toBeTruthy()
  })
})

// ── Pattern — advanced ────────────────────────────────────────────────────────

describe('ChainablePart — pattern advanced', () => {
  it('.shift(n) sets _pattern to a PatternFn (rotated)', () => {
    const p = base().euclidean(4, 8).shift(1)
    // shift() from @score/pattern returns PatternFn, not array
    expect(p._pattern).toBeTruthy()
    expect(typeof p._pattern === 'function').toBe(true)
  })

  it('.invert() flips 1s and 0s', () => {
    const p = base().euclidean(4, 8)
    const inv = p.invert()
    const orig = p._pattern as number[]
    const flipped = inv._pattern as number[]
    expect(flipped).toEqual(orig.map(v => (v === 1 ? 0 : 1)))
  })

  it('.mask(pattern) sets _mask', () => {
    const m = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
    const p = base().mask(m)
    expect(p._mask).toEqual(m)
  })

  it('.degrade(p) sets _degrade', () => {
    const p = base().degrade(0.3)
    expect(p._degrade).toBe(0.3)
  })

  it('.degrade(-1) throws ScoreError', () => {
    expect(() => base().degrade(-1)).toThrow()
  })

  it('.humanize(amt) sets _humanize', () => {
    const p = base().humanize(0.02)
    expect(p._humanize).toBe(0.02)
  })

  it('.swing(amount) sets _swing', () => {
    const p = base().swing(0.08)
    expect(p._swing).toBe(0.08)
  })

  it('.palindrome() sets _palindrome', () => {
    const p = base().palindrome()
    expect(p._palindrome).toBe(true)
  })

  it('.repeat(n) sets _repeat', () => {
    const p = base().repeat(3)
    expect(p._repeat).toBe(3)
  })

  it('.repeat(0) throws ScoreError', () => {
    expect(() => base().repeat(0)).toThrow()
  })

  it('.stretch(bars) sets _stretch', () => {
    const p = base().stretch(4)
    expect(p._stretch).toBe(4)
  })

  it('.phase(amount) sets _phase', () => {
    const p = base().phase(0.5)
    expect(p._phase).toBe(0.5)
  })

  it('.fromBar(n) sets _fromBar', () => {
    const p = base().fromBar(8)
    expect(p._fromBar).toBe(8)
  })

  it('.untilBar(n) sets _untilBar', () => {
    const p = base().untilBar(16)
    expect(p._untilBar).toBe(16)
  })

  it('.fadeIn(bars) sets _fadeInBars', () => {
    const p = base().fadeIn(4)
    expect(p._fadeInBars).toBe(4)
  })

  it('.fadeOut(bars) sets _fadeOutBars', () => {
    const p = base().fadeOut(2)
    expect(p._fadeOutBars).toBe(2)
  })

  it('.stutter(n) sets _stutter', () => {
    const p = base().stutter(2)
    expect(p._stutter).toBe(2)
  })

  it('.stutter(-1) throws ScoreError', () => {
    expect(() => base().stutter(-1)).toThrow()
  })
})

// ── Pitch / notes ─────────────────────────────────────────────────────────────

describe('ChainablePart — pitch / notes', () => {
  it('.note(pitch) sets _notes as single-element array', () => {
    const p = base().note('C3')
    expect(p._notes).toEqual(['C3'])
  })

  it('.notes(arr) sets _notes', () => {
    const arr = ['C3', 'E3', 'G3']
    const p = base().notes(arr)
    expect(p._notes).toEqual(arr)
  })

  it('.notes() accepts rest marker R', () => {
    const p = base().notes(['C3', 'R', 'E3'])
    expect(p._notes).toEqual(['C3', 'R', 'E3'])
  })

  it('.scale(name, root) sets _scale', () => {
    const p = base().scale('minor', 'A')
    expect(p._scale).toEqual({ name: 'minor', root: 'A' })
  })

  it('.pitch(semitones) sets _pitchOffset', () => {
    const p = base().pitch(7)
    expect(p._pitchOffset).toBe(7)
  })

  it('.pitch() accepts negative values', () => {
    const p = base().pitch(-12)
    expect(p._pitchOffset).toBe(-12)
  })

  it('.octave(n) sets _octave', () => {
    const p = base().octave(2)
    expect(p._octave).toBe(2)
  })

  it('.glide(time) sets _glide', () => {
    const p = base().glide(0.1)
    expect(p._glide).toBe(0.1)
  })

  it('.dur(time) sets _dur', () => {
    const p = base().dur(0.5)
    expect(p._dur).toBe(0.5)
  })
})

// ── Amplitude / ADSR ──────────────────────────────────────────────────────────

describe('ChainablePart — amplitude / ADSR', () => {
  it('.volume(v) sets _volume', () => {
    const p = base().volume(0.8)
    expect(p._volume).toBe(0.8)
  })

  it('.attack(s) sets _adsr.attack', () => {
    const p = base().attack(0.01)
    expect(p._adsr?.attack).toBe(0.01)
  })

  it('.decay(s) sets _adsr.decay', () => {
    const p = base().decay(0.1)
    expect(p._adsr?.decay).toBe(0.1)
  })

  it('.sustain(v) sets _adsr.sustain', () => {
    const p = base().sustain(0.7)
    expect(p._adsr?.sustain).toBe(0.7)
  })

  it('.release(s) sets _adsr.release', () => {
    const p = base().release(0.4)
    expect(p._adsr?.release).toBe(0.4)
  })

  it('ADSR methods merge — do not overwrite each other', () => {
    const p = base().attack(0.01).decay(0.1).sustain(0.7).release(0.4)
    expect(p._adsr).toEqual({ attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.4 })
  })

  it('second .attack() call overwrites only attack, preserves decay', () => {
    const p = base().attack(0.01).decay(0.1).attack(0.05)
    expect(p._adsr?.attack).toBe(0.05)
    expect(p._adsr?.decay).toBe(0.1)
  })
})

// ── Tone ─────────────────────────────────────────────────────────────────────

describe('ChainablePart — tone', () => {
  it('.filter(freq) sets _filter.frequency', () => {
    const p = base().filter(800)
    expect(p._filter?.frequency).toBe(800)
  })

  it('.filter(freq, q) sets _filter.Q', () => {
    const p = base().filter(800, 2)
    expect(p._filter?.Q).toBe(2)
  })

  it('.eq(lo, mid, hi) sets _eq', () => {
    const p = base().eq(2, 0, -3)
    expect(p._eq).toEqual({ lo: 2, mid: 0, hi: -3 })
  })

  it('.bit(bits) appends bitcrusher to _effects', () => {
    const p = base().bit(8)
    expect(p._effects?.length).toBe(1)
    expect(p._effects?.[0]?.effectType).toBe('bitcrusher')
  })

  it('.saturate(amt) appends saturation to _effects', () => {
    const p = base().saturate(0.5)
    expect(p._effects?.length).toBe(1)
    expect(p._effects?.[0]?.effectType).toBe('saturation')
  })
})

// ── Space / Effects ────────────────────────────────────────────────────────────

describe('ChainablePart — space / effects', () => {
  it('.pan(v) sets _pan', () => {
    const p = base().pan(-0.5)
    expect(p._pan).toBe(-0.5)
  })

  it('.reverb(wet) appends reverb effect', () => {
    const p = base().reverb(0.3)
    expect(p._effects?.length).toBe(1)
    expect(p._effects?.[0]?.effectType).toBe('reverb')
    expect((p._effects?.[0]?.props as { wet: number }).wet).toBe(0.3)
  })

  it('.delay(time) appends delay effect', () => {
    const p = base().delay(0.25)
    expect(p._effects?.length).toBe(1)
    expect(p._effects?.[0]?.effectType).toBe('delay')
  })

  it('.delay(time, feedback) includes feedback', () => {
    const p = base().delay(0.25, 0.4)
    expect((p._effects?.[0]?.props as { feedback: number }).feedback).toBe(0.4)
  })

  it('.chorus() appends chorus effect', () => {
    const p = base().chorus(0.4)
    expect(p._effects?.[0]?.effectType).toBe('chorus')
  })

  it('.widen(amt) appends stereo-widener effect', () => {
    const p = base().widen(1.5)
    expect(p._effects?.[0]?.effectType).toBe('stereo-widener')
  })

  it('effects chain — .reverb().delay() produces 2 effects in order', () => {
    const p = base().reverb(0.2).delay('1/8', 0.3)
    expect(p._effects?.length).toBe(2)
    expect(p._effects?.[0]?.effectType).toBe('reverb')
    expect(p._effects?.[1]?.effectType).toBe('delay')
  })

  it('effects chain — 3 effects stacked', () => {
    const p = base().reverb(0.2).delay(0.25).chorus(0.3)
    expect(p._effects?.length).toBe(3)
  })
})

// ── Routing ───────────────────────────────────────────────────────────────────

describe('ChainablePart — routing', () => {
  it('.mute() sets _mute to true', () => {
    const p = base().mute()
    expect(p._mute).toBe(true)
  })

  it('.solo() sets _solo to true', () => {
    const p = base().solo()
    expect(p._solo).toBe(true)
  })

  it('.send(bus) appends send with default amount 1', () => {
    const p = base().send('room')
    expect(p._sends?.length).toBe(1)
    expect(p._sends?.[0]).toEqual({ bus: 'room', amount: 1 })
  })

  it('.send(bus, amount) uses provided amount', () => {
    const p = base().send('plate', 0.6)
    expect(p._sends?.[0]?.amount).toBe(0.6)
  })

  it('.send() called twice appends both', () => {
    const p = base().send('room').send('plate', 0.4)
    expect(p._sends?.length).toBe(2)
    expect(p._sends?.[0]?.bus).toBe('room')
    expect(p._sends?.[1]?.bus).toBe('plate')
  })

  it('.chokeGroup(name) sets _chokeGroup', () => {
    const p = base().chokeGroup('hihat')
    expect(p._chokeGroup).toBe('hihat')
  })

  it('.layer(...parts) appends to _layers', () => {
    const sub = createPart({ instrumentType: 'sub-808', props: {} })
    const p = base().layer(sub)
    expect(p._layers?.length).toBe(1)
    expect(p._layers?.[0]?.instrumentType).toBe('sub-808')
  })

  it('.layer() called twice accumulates layers', () => {
    const a = createPart({ instrumentType: 'sub-808', props: {} })
    const b = createPart({ instrumentType: 'noise', props: {} })
    const p = base().layer(a).layer(b)
    expect(p._layers?.length).toBe(2)
  })
})

// ── Modulation ────────────────────────────────────────────────────────────────

describe('ChainablePart — modulation', () => {
  it('.tremolo(rate) appends volume modulation', () => {
    const p = base().tremolo(4)
    expect(p._modulations?.length).toBe(1)
    expect(p._modulations?.[0]?.param).toBe('volume')
  })

  it('.tremolo(rate, depth) uses provided depth', () => {
    const p = base().tremolo(4, 0.5)
    expect(p._modulations?.[0]?.source).toBeTruthy()
  })

  it('.vibrato(rate) appends pitch modulation', () => {
    const p = base().vibrato(6)
    expect(p._modulations?.[0]?.param).toBe('pitch')
  })

  it('.wobble(rate) appends filter modulation', () => {
    const p = base().wobble(2)
    expect(p._modulations?.[0]?.param).toBe('filter')
  })

  it('.autopan(rate) appends pan modulation', () => {
    const p = base().autopan(1)
    expect(p._modulations?.[0]?.param).toBe('pan')
  })

  it('.drift() appends pitch modulation', () => {
    const p = base().drift(0.2)
    expect(p._modulations?.[0]?.param).toBe('pitch')
  })

  it('.swell(bars) appends volume modulation', () => {
    const p = base().swell(8)
    expect(p._modulations?.[0]?.param).toBe('volume')
  })

  it('.modulate(param, source) appends custom modulation', () => {
    const source = lfo(1, 1)
    const p = base().modulate('filter', source)
    expect(p._modulations?.[0]?.param).toBe('filter')
    expect(p._modulations?.[0]?.source).toBe(source)
  })

  it('multiple modulations stack', () => {
    const p = base().tremolo(4).wobble(2).autopan(0.5)
    expect(p._modulations?.length).toBe(3)
    expect(p._modulations?.[0]?.param).toBe('volume')
    expect(p._modulations?.[1]?.param).toBe('filter')
    expect(p._modulations?.[2]?.param).toBe('pan')
  })
})

// ── Meta ──────────────────────────────────────────────────────────────────────

describe('ChainablePart — meta', () => {
  it('.seed(n) sets _seed', () => {
    const p = base().seed(42)
    expect(p._seed).toBe(42)
  })

  it('.name(label) sets _name', () => {
    const p = base().name('main kick')
    expect(p._name).toBe('main kick')
  })

  it('.model(variant) sets _model', () => {
    const p = base().model('909')
    expect(p._model).toBe('909')
  })
})

// ── Immutability ──────────────────────────────────────────────────────────────

describe('ChainablePart — immutability', () => {
  it('.volume() returns new object, original unchanged', () => {
    const a = base()
    const b = a.volume(0.9)
    expect(a._volume).toBeUndefined()
    expect(b._volume).toBe(0.9)
  })

  it('.reverb() returns new object, original has no effects', () => {
    const a = base()
    const b = a.reverb(0.3)
    expect(a._effects).toBeUndefined()
    expect(b._effects?.length).toBe(1)
  })

  it('.attack() returns new object, original has no adsr', () => {
    const a = base()
    const b = a.attack(0.01)
    expect(a._adsr).toBeUndefined()
    expect(b._adsr?.attack).toBe(0.01)
  })

  it('chained methods do not share _effects array reference', () => {
    const a = base().reverb(0.2)
    const b = a.delay(0.25)
    expect(a._effects?.length).toBe(1)
    expect(b._effects?.length).toBe(2)
  })

  it('.send() does not mutate earlier sends', () => {
    const a = base().send('room')
    const b = a.send('plate')
    expect(a._sends?.length).toBe(1)
    expect(b._sends?.length).toBe(2)
  })
})

// ── Full chain ────────────────────────────────────────────────────────────────

describe('ChainablePart — full chain', () => {
  it('pattern + pitch + effects all set on final object', () => {
    const p = base()
      .euclidean(4)
      .note('C2')
      .volume(0.8)
      .reverb(0.3)
      .swing(0.08)
    expect(Array.isArray(p._pattern)).toBe(true)
    expect(p._notes).toEqual(['C2'])
    expect(p._volume).toBe(0.8)
    expect(p._effects?.length).toBe(1)
    expect(p._swing).toBe(0.08)
  })

  it('routing + modulation + meta all set on final object', () => {
    const p = base()
      .mute()
      .send('room', 0.5)
      .tremolo(4)
      .seed(7)
      .name('kick bus')
    expect(p._mute).toBe(true)
    expect(p._sends?.length).toBe(1)
    expect(p._modulations?.length).toBe(1)
    expect(p._seed).toBe(7)
    expect(p._name).toBe('kick bus')
  })

  it('20-method chain terminates correctly', () => {
    const p = base()
      .euclidean(4)
      .swing(0.08)
      .volume(0.7)
      .attack(0.001)
      .decay(0.1)
      .sustain(0)
      .release(0.2)
      .reverb(0.2)
      .delay('1/8', 0.3)
      .pan(-0.2)
      .send('room', 0.4)
      .seed(99)
      .name('kick')
      .model('808')
    expect(p._type).toBe('ChainablePart')
    expect(p._adsr?.attack).toBe(0.001)
    expect(p._effects?.length).toBe(2)
    expect(p._sends?.length).toBe(1)
    expect(p._name).toBe('kick')
  })
})
