// @score/dsl — chain-methods.test.ts
//
// Full coverage of ChainablePart chain methods.
// Each test asserts the correct descriptor field(s) are set on the resulting part.
//
// Organisation mirrors the sections in chain.ts:
//   Effects (append to _effects) · Tone · Space · Modulation
//   Pattern descriptors · Pitch/notes · Amplitude (ADSR)
//   Bar/scheduling · Routing · Meta · Visual
//   Model + open routing

import { describe, it, expect } from 'vitest'
import { createPart } from '../src/chain.js'
import type { EffectDescriptor } from '@score/core'

// ── Helpers ───────────────────────────────────────────────────────────────────

const part = () => createPart({ instrumentType: 'kick' })
const hihat = () => createPart({ instrumentType: 'hihat' })

/** Retrieve _effects, typed. */
const effects = (p: ReturnType<typeof part>): EffectDescriptor[] =>
  (p._effects ?? []) as EffectDescriptor[]

/** Assert exactly one effect was appended with the given effectType. */
const singleFx = (p: ReturnType<typeof part>, effectType: string): EffectDescriptor => {
  const fxList = effects(p)
  expect(fxList).toHaveLength(1)
  expect(fxList[0]?.effectType).toBe(effectType)
  return fxList[0]!
}

// ── Immutability ──────────────────────────────────────────────────────────────

describe('immutability', () => {
  it('chain methods return a new part, not the same reference', () => {
    const a = part()
    const b = a.volume(0.5)
    expect(a).not.toBe(b)
  })

  it('original part is unchanged after chain call', () => {
    const a = part()
    a.volume(0.9)
    expect(a._volume).toBeUndefined()
  })

  it('chaining preserves id by default', () => {
    const a = part()
    expect(a.volume(0.5).id).toBe(a.id)
  })
})

// ── Effects — append to _effects ─────────────────────────────────────────────

describe('.reverb()', () => {
  it('appends reverb effect', () => {
    const fx = singleFx(part().reverb(0.3), 'reverb')
    expect(fx.props).toMatchObject({ wet: 0.3 })
  })

  it('accumulates when called twice', () => {
    const p = part().reverb(0.3).reverb(0.1)
    expect(effects(p)).toHaveLength(2)
  })
})

describe('.delay()', () => {
  it('appends delay effect with time', () => {
    const fx = singleFx(part().delay(0.25), 'delay')
    expect(fx.props).toMatchObject({ time: 0.25 })
  })

  it('includes feedback when provided', () => {
    const fx = singleFx(part().delay(0.25, 0.4), 'delay')
    expect(fx.props).toMatchObject({ time: 0.25, feedback: 0.4 })
  })
})

describe('.chorus()', () => {
  it('appends chorus effect', () => {
    const fx = singleFx(part().chorus(0.6), 'chorus')
    expect(fx.props).toMatchObject({ depth: 0.6 })
  })

  it('uses default depth when omitted', () => {
    const fx = singleFx(part().chorus(), 'chorus')
    expect(typeof fx.props.depth).toBe('number')
  })
})

describe('.flange()', () => {
  it('appends flanger effect', () => {
    const fx = singleFx(part().flange(0.4), 'flanger')
    expect(fx.props).toMatchObject({ depth: 0.4 })
  })
})

describe('.bit()', () => {
  it('appends bitcrusher effect', () => {
    const fx = singleFx(part().bit(8), 'bitcrusher')
    expect(fx.props).toMatchObject({ bits: 8 })
  })
})

describe('.saturate()', () => {
  it('appends saturation effect', () => {
    const fx = singleFx(part().saturate(0.7), 'saturation')
    expect(typeof fx.props.drive).toBe('number')
  })
})

describe('.widen()', () => {
  it('appends stereo-widener effect', () => {
    const fx = singleFx(part().widen(0.8), 'stereo-widener')
    expect(fx.props).toMatchObject({ width: 0.8 })
  })
})

// ── SIMPLE_FX methods ─────────────────────────────────────────────────────────

describe('.distortion()', () => {
  it('appends distortion effect', () => {
    const fx = singleFx(part().distortion(0.5), 'distortion')
    expect(typeof fx.props.drive).toBe('number')
  })

  it('uses default amount when omitted', () => {
    const fx = singleFx(part().distortion(), 'distortion')
    expect(typeof fx.props.drive).toBe('number')
  })

  it('clamps drive to 0–1', () => {
    const fx = singleFx(part().distortion(2), 'distortion')
    expect(fx.props.drive as number).toBeLessThanOrEqual(1)
  })
})

describe('.phaser()', () => {
  it('appends phaser effect', () => {
    const fx = singleFx(part().phaser(0.5, 2), 'phaser')
    expect(fx.props).toMatchObject({ depth: 0.5, rate: 2 })
  })

  it('uses defaults when no args given', () => {
    const fx = singleFx(part().phaser(), 'phaser')
    expect(typeof fx.props.depth).toBe('number')
    expect(typeof fx.props.rate).toBe('number')
  })
})

describe('.compressor()', () => {
  it('appends compressor effect', () => {
    const fx = singleFx(part().compressor(-20, 6), 'compressor')
    expect(fx.props).toMatchObject({ threshold: -20, ratio: 6 })
  })

  it('uses defaults when no args given', () => {
    const fx = singleFx(part().compressor(), 'compressor')
    expect(typeof fx.props.threshold).toBe('number')
    expect(typeof fx.props.ratio).toBe('number')
  })
})

describe('.limiter()', () => {
  it('appends limiter effect', () => {
    const fx = singleFx(part().limiter(-2), 'limiter')
    expect(fx.props).toMatchObject({ ceiling: -2 })
  })

  it('uses default ceiling when omitted', () => {
    const fx = singleFx(part().limiter(), 'limiter')
    expect(typeof fx.props.ceiling).toBe('number')
  })
})

describe('.gate()', () => {
  it('appends gate effect', () => {
    const fx = singleFx(part().gate(-30, 8), 'gate')
    expect(fx.props).toMatchObject({ threshold: -30, ratio: 8 })
  })

  it('uses defaults when no args given', () => {
    const fx = singleFx(part().gate(), 'gate')
    expect(typeof fx.props.threshold).toBe('number')
    expect(typeof fx.props.ratio).toBe('number')
  })
})

// ── Effects stack ordering ────────────────────────────────────────────────────

describe('effects ordering', () => {
  it('effects are appended in call order', () => {
    const p = part().reverb(0.2).delay(0.25).distortion(0.3)
    const fxList = effects(p)
    expect(fxList).toHaveLength(3)
    expect(fxList[0]?.effectType).toBe('reverb')
    expect(fxList[1]?.effectType).toBe('delay')
    expect(fxList[2]?.effectType).toBe('distortion')
  })
})

// ── Tone ──────────────────────────────────────────────────────────────────────

describe('.filter()', () => {
  it('sets _filter with frequency', () => {
    const p = part().filter(800)
    expect(p._filter?.frequency).toBe(800)
  })

  it('sets _filter with frequency and Q', () => {
    const p = part().filter(1200, 4)
    expect(p._filter).toMatchObject({ frequency: 1200, Q: 4 })
  })
})

describe('.eq()', () => {
  it('sets _eq with low/mid/high', () => {
    const p = part().eq(3, -2, 1)
    expect(p._eq).toMatchObject({ lo: 3, mid: -2, hi: 1 })
  })
})

// ── Space ─────────────────────────────────────────────────────────────────────

describe('.pan()', () => {
  it('sets _pan', () => {
    expect(part().pan(-0.5)._pan).toBe(-0.5)
  })

  it('sets _pan to 0 (centre)', () => {
    expect(part().pan(0)._pan).toBe(0)
  })
})

// ── Amplitude / ADSR ─────────────────────────────────────────────────────────

describe('.attack()', () => {
  it('sets _adsr.attack', () => {
    expect(part().attack(0.01)._adsr?.attack).toBe(0.01)
  })

  it('merges with existing adsr', () => {
    const p = part().decay(0.2).attack(0.01)
    expect(p._adsr?.attack).toBe(0.01)
    expect(p._adsr?.decay).toBe(0.2)
  })
})

describe('.decay()', () => {
  it('sets _adsr.decay', () => {
    expect(part().decay(0.3)._adsr?.decay).toBe(0.3)
  })
})

describe('.sustain()', () => {
  it('sets _adsr.sustain', () => {
    expect(part().sustain(0.6)._adsr?.sustain).toBe(0.6)
  })
})

describe('.release()', () => {
  it('sets _adsr.release', () => {
    expect(part().release(0.5)._adsr?.release).toBe(0.5)
  })
})

// ── Pitch / notes ─────────────────────────────────────────────────────────────

describe('.pitch()', () => {
  it('sets _pitchOffset', () => {
    expect(part().pitch(7)._pitchOffset).toBe(7)
  })

  it('negative semitones', () => {
    expect(part().pitch(-12)._pitchOffset).toBe(-12)
  })
})

describe('.octave()', () => {
  it('sets _octave', () => {
    expect(part().octave(1)._octave).toBe(1)
  })
})

describe('.glide()', () => {
  it('sets _glide', () => {
    expect(part().glide(0.05)._glide).toBe(0.05)
  })
})

describe('.dur()', () => {
  it('sets _dur', () => {
    expect(part().dur(2)._dur).toBe(2)
  })
})

// ── Bar / scheduling ──────────────────────────────────────────────────────────

describe('.fromBar()', () => {
  it('sets _fromBar', () => {
    expect(part().fromBar(4)._fromBar).toBe(4)
  })
})

describe('.untilBar()', () => {
  it('sets _untilBar', () => {
    expect(part().untilBar(8)._untilBar).toBe(8)
  })
})

describe('.fadeIn()', () => {
  it('sets _fadeInBars', () => {
    expect(part().fadeIn(2)._fadeInBars).toBe(2)
  })
})

describe('.fadeOut()', () => {
  it('sets _fadeOutBars', () => {
    expect(part().fadeOut(4)._fadeOutBars).toBe(4)
  })
})

// ── Routing ───────────────────────────────────────────────────────────────────

describe('.mute()', () => {
  it('sets _mute to true', () => {
    expect(part().mute()._mute).toBe(true)
  })
})

describe('.solo()', () => {
  it('sets _solo to true', () => {
    expect(part().solo()._solo).toBe(true)
  })
})

// ── Meta ──────────────────────────────────────────────────────────────────────

describe('.name()', () => {
  it('sets _name', () => {
    expect(part().name('bass')._name).toBe('bass')
  })
})

describe('.seed()', () => {
  it('sets _seed', () => {
    expect(part().seed(42)._seed).toBe(42)
  })
})

// ── Visual ────────────────────────────────────────────────────────────────────

describe('.color()', () => {
  it('sets _visual.color', () => {
    expect(part().color('#ff0000')._visual?.color).toBe('#ff0000')
  })

  it('merges with other visual fields', () => {
    const p = part().glyph('★').color('#00ff00')
    expect(p._visual?.glyph).toBe('★')
    expect(p._visual?.color).toBe('#00ff00')
  })
})

describe('.glyph()', () => {
  it('sets _visual.glyph', () => {
    expect(part().glyph('◆')._visual?.glyph).toBe('◆')
  })
})

describe('.label()', () => {
  it('sets _visual.label', () => {
    expect(part().label('kick 808')._visual?.label).toBe('kick 808')
  })
})

describe('.visual()', () => {
  it('merges all visual fields at once', () => {
    const p = part().visual({ color: '#ff0000', glyph: '◆', label: 'bass' })
    expect(p._visual).toMatchObject({ color: '#ff0000', glyph: '◆', label: 'bass' })
  })

  it('partial override preserves existing fields', () => {
    const p = part().color('#ff0000').visual({ label: 'kick' })
    expect(p._visual?.color).toBe('#ff0000')
    expect(p._visual?.label).toBe('kick')
  })
})

// ── Model + open routing ──────────────────────────────────────────────────────

describe('.model()', () => {
  it('changes instrumentType to ${base}${variant}', () => {
    expect(part().model('808').instrumentType).toBe('kick808')
  })

  it('sets _model', () => {
    expect(part().model('808')._model).toBe('808')
  })

  it('also updates type alias', () => {
    expect(part().model('909').type).toBe('kick909')
  })

  it('preserves _effects through model change', () => {
    const p = part().reverb(0.2).model('808')
    expect(effects(p)).toHaveLength(1)
    expect(effects(p)[0]?.effectType).toBe('reverb')
  })

  it('_model survives further chain calls', () => {
    expect(part().model('808').volume(0.9)._model).toBe('808')
  })
})

describe('.open()', () => {
  it('hihat808 → hihatopen808', () => {
    expect(hihat().model('808').open().instrumentType).toBe('hihatopen808')
  })

  it('unknown type passes through unchanged', () => {
    expect(part().open().instrumentType).toBe('kick')
  })

  it('preserves all prior chain state', () => {
    const p = hihat().model('808').volume(0.6).pattern([1, 0, 1, 0]).open()
    expect(p.instrumentType).toBe('hihatopen808')
    expect(p._volume).toBe(0.6)
    expect(p._pattern).toBeDefined()
  })
})

describe('HiHat().model("808").open() ≡ HihatOpen808()', () => {
  it('produces identical instrumentType', async () => {
    const { HiHat }          = await import('../src/percussion.js')
    const { HihatOpen808 }   = await import('../src/percussion.js')
    expect(HiHat().model('808').open().instrumentType).toBe(HihatOpen808().instrumentType)
  })

  it('both have _model 808', async () => {
    const { HiHat, HihatOpen808 } = await import('../src/percussion.js')
    expect(HiHat().model('808').open()._model).toBe('808')
    expect(HihatOpen808()._model).toBe('808')
  })
})
