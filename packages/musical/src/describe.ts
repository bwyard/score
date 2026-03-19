import { ScoreError } from '@score/core'
import type { InstrumentDescriptor } from './types.js'
import { ALL_VOCAB } from './vocabulary.js'
import { buildDescriptor, extractTokens } from './tokenizer.js'

/**
 * Convert a natural-language description into an {@link InstrumentDescriptor}.
 *
 * Uses a curated vocabulary tokenizer — **not AI**. Words map to known musical
 * properties. Unrecognized words are silently ignored. Conflicting matches
 * resolve last-write-wins within each vocabulary table.
 *
 * @param text - Natural language description, e.g. `"warm bass with hall reverb"`.
 * @returns Partial `InstrumentDescriptor` ready for instrument factories, plus
 *   a `_tokens` array listing every matched keyword (useful for debugging).
 * @throws \{ScoreError\} when `text` is not a non-empty string.
 *
 * @example
 * ```ts
 * describe('warm bass with hall reverb')
 * // → { instrument: 'bass', wave: 'sine', filterFrequency: 1200,
 * //      filterType: 'lowpass', reverb: 0.6, _tokens: ['warm', 'bass', 'hall'] }
 *
 * describe('loud punchy kick')
 * // → { instrument: 'kick', pattern: [1,0,0,0,...], volume: 0.85, _tokens: [...] }
 *
 * describe('bright lead with echo')
 * // → { instrument: 'lead', wave: 'sawtooth', filterFrequency: 3000,
 * //      filterType: 'highpass', delay: 0.4, _tokens: ['lead', 'bright', 'echo'] }
 * ```
 */
export const describe = (text: string): InstrumentDescriptor => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw ScoreError('describe: text must be a non-empty string', {
      received: text,
      fix: 'Pass a non-empty string describing the instrument sound.',
      docs: 'https://github.com/bwyard/score',
      code: 'DESCRIBE_INVALID_TEXT',
    })
  }

  const descriptor = buildDescriptor(text, ALL_VOCAB)
  const tokens = extractTokens(text, ALL_VOCAB)

  return { ...descriptor, _tokens: tokens }
}
