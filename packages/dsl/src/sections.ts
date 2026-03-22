import type { SectionDefinition, SectionType, TrackComponent } from './types.js'

const makeSection = (sectionType: SectionType) =>
  (bars: number, tracks: TrackComponent[]): SectionDefinition => ({
    _type: 'SectionDefinition',
    sectionType,
    bars,
    tracks,
  })

/**
 * Define an intro section — the opening passage before the first drop.
 *
 * @param bars - Length of the section in bars.
 * @param tracks - Active tracks during this section.
 * @returns A {@link SectionDefinition} with `sectionType: 'intro'`.
 *
 * @example
 * ```ts
 * Intro(4, [kick])
 * ```
 *
 * @see {@link Song} — pass sections in the `arrangement` array
 * @see {@link Drop} — the high-energy section that typically follows
 */
export const Intro     = makeSection('intro')

/**
 * Define a buildup section — rising tension before a drop.
 *
 * @param bars - Length of the section in bars.
 * @param tracks - Active tracks during this section.
 * @returns A {@link SectionDefinition} with `sectionType: 'buildup'`.
 *
 * @example
 * ```ts
 * Buildup(8, [kick, hihat, synth])
 * ```
 *
 * @see {@link Drop} — the release that follows a buildup
 * @see {@link Breakdown} — a gentler, stripped-back contrast section
 */
export const Buildup   = makeSection('buildup')

/**
 * Define a drop section — the main high-energy, full-arrangement climax.
 *
 * @param bars - Length of the section in bars.
 * @param tracks - Active tracks during this section.
 * @returns A {@link SectionDefinition} with `sectionType: 'drop'`.
 *
 * @example
 * ```ts
 * Drop(16, [kick, snare, hihat, bass])
 * ```
 *
 * @see {@link Buildup} — the rising tension that precedes a drop
 * @see {@link Breakdown} — a lighter section used for contrast after a drop
 */
export const Drop      = makeSection('drop')

/**
 * Define a breakdown section — a stripped-back, low-energy contrast passage.
 *
 * Typically follows a drop to provide rhythmic relief and re-build anticipation.
 *
 * @param bars - Length of the section in bars.
 * @param tracks - Active tracks during this section.
 * @returns A {@link SectionDefinition} with `sectionType: 'breakdown'`.
 *
 * @example
 * ```ts
 * Breakdown(8, [bass, synth])
 * ```
 *
 * @see {@link Buildup} — use after a breakdown to rebuild to the next drop
 * @see {@link Drop} — the high-energy counterpart
 */
export const Breakdown = makeSection('breakdown')

/**
 * Define an outro section — the closing passage that ends the song.
 *
 * @param bars - Length of the section in bars.
 * @param tracks - Active tracks during this section.
 * @returns A {@link SectionDefinition} with `sectionType: 'outro'`.
 *
 * @example
 * ```ts
 * Outro(4, [kick, hihat])
 * ```
 *
 * @see {@link Intro} — the opening counterpart
 * @see {@link Song} — pass sections in the `arrangement` array
 */
export const Outro     = makeSection('outro')
