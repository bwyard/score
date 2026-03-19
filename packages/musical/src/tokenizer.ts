import type { InstrumentDescriptor, VocabEntry } from './types.js'

/**
 * Normalize text for vocabulary matching: lowercase and collapse whitespace.
 *
 * @param text - Raw input string.
 * @returns Lowercased, whitespace-collapsed string.
 *
 * @example
 * ```ts
 * normalizeText('  Warm  BASS  ') // → 'warm bass'
 * ```
 */
export const normalizeText = (text: string): string =>
  text.toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Extract the matched keyword strings from a text against a vocabulary.
 *
 * Returns one matched keyword per vocabulary entry (the first keyword that
 * appears in the text). Entries with no matching keyword are skipped.
 *
 * @param text - Input description text.
 * @param vocab - Vocabulary entries to match against.
 * @returns Array of matched keyword strings.
 *
 * @example
 * ```ts
 * extractTokens('warm bass with reverb', ALL_VOCAB)
 * // → ['warm', 'bass', 'reverb']
 * ```
 */
export const extractTokens = (text: string, vocab: VocabEntry[]): string[] => {
  const normalized = normalizeText(text)
  const matched: string[] = []
  for (const entry of vocab) {
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) {
        matched.push(keyword)
        break
      }
    }
  }
  return matched
}

/**
 * Build a partial `InstrumentDescriptor` by matching text against a vocabulary.
 *
 * Each matched entry's descriptor is merged into the result using last-write-wins
 * semantics — entries later in the vocabulary array override earlier ones on
 * conflicting fields.
 *
 * @param text - Input description text.
 * @param vocab - Vocabulary entries to match against.
 * @returns Merged partial descriptor for all matched entries.
 *
 * @example
 * ```ts
 * buildDescriptor('warm bass', ALL_VOCAB)
 * // → { instrument: 'bass', wave: 'sine', filterFrequency: 1200, filterType: 'lowpass' }
 * ```
 */
export const buildDescriptor = (text: string, vocab: VocabEntry[]): Partial<InstrumentDescriptor> => {
  const normalized = normalizeText(text)
  let result: Partial<InstrumentDescriptor> = {}
  for (const entry of vocab) {
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) {
        result = { ...result, ...entry.descriptor }
        break
      }
    }
  }
  return result
}
