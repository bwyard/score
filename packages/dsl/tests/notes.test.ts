import { describe, it, expect } from 'vitest'
import { noteHz, resolveFreq } from '../src/notes.js'

describe('noteHz', () => {
  it('A4 = 440 Hz', () => { expect(noteHz('A4')).toBeCloseTo(440, 1); })
  it('A2 = 110 Hz', () => { expect(noteHz('A2')).toBeCloseTo(110, 1); })
  it('C4 = 261.63 Hz', () => { expect(noteHz('C4')).toBeCloseTo(261.63, 1); })
  it('D3 = 146.83 Hz', () => { expect(noteHz('D3')).toBeCloseTo(146.83, 1); })
  it('F#3 = 185.0 Hz', () => { expect(noteHz('F#3')).toBeCloseTo(185.0, 0); })
  it('Bb2 = 116.54 Hz', () => { expect(noteHz('Bb2')).toBeCloseTo(116.54, 1); })
  it('E4 = 329.63 Hz', () => { expect(noteHz('E4')).toBeCloseTo(329.63, 1); })
  it('throws on invalid note name', () => { expect(() => noteHz('X9')).toThrow(); })
  it('throws on malformed input', () => { expect(() => noteHz('hello')).toThrow(); })
})

describe('resolveFreq', () => {
  it('returns number as-is', () => { expect(resolveFreq(440)).toBe(440); })
  it('resolves string note name', () => { expect(resolveFreq('A4')).toBeCloseTo(440, 1); })
  it('0 stays 0 (rest)', () => { expect(resolveFreq(0)).toBe(0); })
})
