import { describe, it, expect } from 'vitest'
import { normalizeText, extractTokens, buildDescriptor } from '../src/tokenizer.js'
import { ALL_VOCAB, SOUND_VOCAB } from '../src/vocabulary.js'

describe('normalizeText', () => {
  it('lowercases the string', () => {
    expect(normalizeText('KICK')).toBe('kick')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeText('warm  bass')).toBe('warm bass')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalizeText('  bass  ')).toBe('bass')
  })

  it('handles mixed case and spaces', () => {
    expect(normalizeText('  Warm  BASS  ')).toBe('warm bass')
  })
})

describe('extractTokens', () => {
  it('returns matched keywords', () => {
    const tokens = extractTokens('warm bass', ALL_VOCAB)
    expect(tokens).toContain('warm')
    expect(tokens).toContain('bass')
  })

  it('returns empty array when no match', () => {
    expect(extractTokens('xyzzy foobar', ALL_VOCAB)).toEqual([])
  })

  it('returns at most one keyword per vocab entry', () => {
    // 'kick' and 'bass drum' are both keywords for the same entry
    const tokens = extractTokens('kick bass drum', SOUND_VOCAB)
    const kickEntry = SOUND_VOCAB.find(e => e.keywords.includes('kick'))
    const kickKeywords = kickEntry?.keywords ?? []
    const matches = tokens.filter(t => kickKeywords.includes(t))
    expect(matches.length).toBeLessThanOrEqual(1)
  })

  it('matches multi-word phrases', () => {
    const tokens = extractTokens('bass drum pattern', ALL_VOCAB)
    expect(tokens).toContain('bass drum')
  })

  it('is case-insensitive', () => {
    const tokens = extractTokens('KICK', ALL_VOCAB)
    expect(tokens).toContain('kick')
  })
})

describe('buildDescriptor', () => {
  it('returns empty object for unrecognized text', () => {
    expect(buildDescriptor('xyzzy foobar', ALL_VOCAB)).toEqual({})
  })

  it('maps kick to kick instrument with pattern', () => {
    const d = buildDescriptor('kick', ALL_VOCAB)
    expect(d.instrument).toBe('kick')
    expect(Array.isArray(d.pattern)).toBe(true)
  })

  it('maps warm to sine wave and lowpass filter', () => {
    const d = buildDescriptor('warm', ALL_VOCAB)
    expect(d.wave).toBe('sine')
    expect(d.filterType).toBe('lowpass')
  })

  it('merges multiple matches', () => {
    const d = buildDescriptor('warm bass', ALL_VOCAB)
    expect(d.instrument).toBe('bass')
    expect(d.wave).toBe('sine') // from 'warm'
  })

  it('last-write-wins on conflicting fields', () => {
    // 'loud' sets volume=0.85, 'full' sets volume=1.0; 'full' comes after 'loud' in vocab
    const d = buildDescriptor('loud full', ALL_VOCAB)
    expect(d.volume).toBe(1.0)
  })

  it('is case-insensitive', () => {
    const d = buildDescriptor('KICK', ALL_VOCAB)
    expect(d.instrument).toBe('kick')
  })
})
