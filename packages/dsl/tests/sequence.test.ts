import { describe, it, expect } from 'vitest'
import { Sequence } from '../src/sequence.js'

describe('Sequence', () => {
  it('parses notes and rests', () => {
    expect(Sequence('A1 . C2 . G1')).toEqual(['A1', null, 'C2', null, 'G1'])
  })

  it('returns empty array for empty string', () => {
    expect(Sequence('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(Sequence('   ')).toEqual([])
  })

  it('handles single note', () => {
    expect(Sequence('A1')).toEqual(['A1'])
  })

  it('handles single rest', () => {
    expect(Sequence('.')).toEqual([null])
  })

  it('collapses multiple spaces', () => {
    expect(Sequence('A1  .  C2')).toEqual(['A1', null, 'C2'])
  })

  it('handles all rests', () => {
    expect(Sequence('. . . .')).toEqual([null, null, null, null])
  })

  it('preserves octave and accidental notation', () => {
    expect(Sequence('C#4 Db3 F#2')).toEqual(['C#4', 'Db3', 'F#2'])
  })

  it('throws ScoreError for non-string input', () => {
    expect(() => Sequence(null as unknown as string)).toThrow()
  })
})
