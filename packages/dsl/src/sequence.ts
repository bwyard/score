import { ScoreError } from '@score/core'

/**
 * Parse a space-separated note notation string.
 * '.' represents a rest (null). Consecutive spaces are collapsed.
 *
 * @example
 * Sequence('A1 . C2 . G1') // → ['A1', null, 'C2', null, 'G1']
 */
export const Sequence = (notation: string): (string | null)[] => {
  if (typeof notation !== 'string') {
    throw ScoreError('Sequence notation must be a string', {
      received: notation,
      fix: "Pass a space-separated note string — e.g. Sequence('A1 . C2 . G1')",
      docs: 'https://score.dev/docs/dsl/sequence',
    })
  }
  const trimmed = notation.trim()
  if (trimmed === '') return []
  return trimmed.split(/\s+/).map(token => (token === '.' ? null : token))
}
