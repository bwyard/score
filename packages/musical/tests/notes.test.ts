import { describe, it, expect } from 'vitest'
import { NOTE_TO_MIDI, noteToHz, noteNameToHz } from '../src/notes.js'

describe('NOTE_TO_MIDI', () => {
  it('A4 maps to 69', () => {
    expect(NOTE_TO_MIDI['A4']).toBe(69)
  })

  it('C4 (middle C) maps to 60', () => {
    expect(NOTE_TO_MIDI['C4']).toBe(60)
  })

  it('C0 maps to 12', () => {
    expect(NOTE_TO_MIDI['C0']).toBe(12)
  })

  it('B8 maps to 119', () => {
    expect(NOTE_TO_MIDI['B8']).toBe(119)
  })

  it('sharp notes: C#4 maps to 61', () => {
    expect(NOTE_TO_MIDI['C#4']).toBe(61)
  })

  it('flat notes: Bb4 maps to 70', () => {
    expect(NOTE_TO_MIDI['Bb4']).toBe(70)
  })

  it('enharmonic: C#4 and Db4 map to same value', () => {
    expect(NOTE_TO_MIDI['C#4']).toBe(NOTE_TO_MIDI['Db4'])
  })

  it('contains at least 108 entries (C0 through B8)', () => {
    expect(Object.keys(NOTE_TO_MIDI).length).toBeGreaterThan(108)
  })
})

describe('noteToHz', () => {
  it('MIDI 69 (A4) → 440 Hz', () => {
    expect(noteToHz(69)).toBeCloseTo(440, 2)
  })

  it('MIDI 60 (C4) → ~261.63 Hz', () => {
    expect(noteToHz(60)).toBeCloseTo(261.63, 1)
  })

  it('MIDI 57 (A3) → 220 Hz', () => {
    expect(noteToHz(57)).toBeCloseTo(220, 2)
  })

  it('MIDI 81 (A5) → 880 Hz', () => {
    expect(noteToHz(81)).toBeCloseTo(880, 2)
  })

  it('each semitone up multiplies by 2^(1/12)', () => {
    const ratio = noteToHz(70) / noteToHz(69)
    expect(ratio).toBeCloseTo(Math.pow(2, 1 / 12), 6)
  })
})

describe('noteNameToHz', () => {
  it('A4 → 440 Hz', () => {
    expect(noteNameToHz('A4')).toBeCloseTo(440, 2)
  })

  it('C4 → ~261.63 Hz', () => {
    expect(noteNameToHz('C4')).toBeCloseTo(261.63, 1)
  })

  it('F#3 → ~185.0 Hz', () => {
    expect(noteNameToHz('F#3')).toBeCloseTo(185.0, 1)
  })

  it('unknown name → 440 Hz fallback', () => {
    expect(noteNameToHz('X99')).toBeCloseTo(440, 2)
  })

  it('consistent with noteToHz via NOTE_TO_MIDI', () => {
    expect(noteNameToHz('A4')).toBe(noteToHz(NOTE_TO_MIDI['A4'] as number))
  })
})
