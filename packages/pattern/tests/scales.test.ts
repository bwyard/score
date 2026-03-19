import { describe, it, expect } from 'vitest'
import { scaleNotes, chordNotes } from '../src/scales.js'

describe('scaleNotes', () => {
  it('scaleNotes("Am", 3, 1) returns 7 notes', () => {
    expect(scaleNotes('Am', 3, 1)).toHaveLength(7)
  })

  it('scaleNotes("C", 4, 1) returns C major scale', () => {
    expect(scaleNotes('C', 4, 1)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'])
  })

  it('scaleNotes("Am", 3, 1) starts on A3', () => {
    const notes = scaleNotes('Am', 3, 1)
    expect(notes[0]).toBe('A3')
  })

  it('scaleNotes returns correct count for 2 octaves', () => {
    expect(scaleNotes('C', 3, 2)).toHaveLength(14)
  })

  it('scaleNotes minor scale has correct intervals', () => {
    // A minor: A B C D E F G
    expect(scaleNotes('Am', 3, 1)).toEqual(['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'])
  })
})

describe('chordNotes', () => {
  it('chordNotes("Am", 3) returns [A3, C4, E4]', () => {
    expect(chordNotes('Am', 3)).toEqual(['A3', 'C4', 'E4'])
  })

  it('chordNotes("C", 4) returns [C4, E4, G4]', () => {
    expect(chordNotes('C', 4)).toEqual(['C4', 'E4', 'G4'])
  })

  it('chordNotes always returns 3 notes', () => {
    expect(chordNotes('Dm', 3)).toHaveLength(3)
    expect(chordNotes('G', 4)).toHaveLength(3)
  })

  it('chordNotes("Dm", 3) returns correct minor triad', () => {
    // D minor: D F A
    expect(chordNotes('Dm', 3)).toEqual(['D3', 'F3', 'A3'])
  })
})
