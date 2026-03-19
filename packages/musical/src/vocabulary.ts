import type { VocabEntry } from './types.js'

/**
 * Sound/instrument vocabulary — maps instrument names and timbral adjectives
 * to instrument types and wave shapes.
 */
export const SOUND_VOCAB: VocabEntry[] = [
  {
    keywords: ['kick', 'bass drum', 'four on floor'],
    descriptor: { instrument: 'kick', pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
  },
  {
    keywords: ['snare', 'clap', 'backbeat'],
    descriptor: { instrument: 'snare', pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
  },
  {
    keywords: ['hihat', 'hi-hat', 'hat', 'cymbal'],
    descriptor: { instrument: 'hihat', pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
  },
  {
    keywords: ['bass', 'sub', 'low end'],
    descriptor: { instrument: 'bass', wave: 'sawtooth', filterFrequency: 800, filterType: 'lowpass' },
  },
  {
    keywords: ['pad', 'chord', 'atmosphere', 'wash'],
    descriptor: { instrument: 'pad', wave: 'sawtooth', reverb: 0.6 },
  },
  {
    keywords: ['lead', 'melody', 'melodic'],
    descriptor: { instrument: 'lead', wave: 'sawtooth' },
  },
  {
    keywords: ['pluck', 'arpeggiated'],
    descriptor: { instrument: 'lead', wave: 'triangle', delay: 0.3 },
  },
  {
    keywords: ['bright', 'sharp', 'cutting'],
    descriptor: { wave: 'sawtooth', filterFrequency: 3000, filterType: 'highpass' },
  },
  {
    keywords: ['warm', 'smooth', 'mellow'],
    descriptor: { wave: 'sine', filterFrequency: 1200, filterType: 'lowpass' },
  },
  {
    keywords: ['dark', 'deep', 'thick'],
    descriptor: { filterFrequency: 400, filterType: 'lowpass' },
  },
  {
    keywords: ['hollow', 'wooden', 'organic'],
    descriptor: { wave: 'triangle' },
  },
  {
    keywords: ['harsh', 'aggressive', 'distorted', 'dirty'],
    descriptor: { wave: 'square', filterFrequency: 2000 },
  },
  {
    keywords: ['soft', 'gentle', 'subtle'],
    descriptor: { wave: 'sine' },
  },
]

/**
 * Space/reverb vocabulary — maps spatial adjectives to reverb and delay amounts.
 */
export const SPACE_VOCAB: VocabEntry[] = [
  { keywords: ['dry', 'tight', 'close', 'direct'], descriptor: { reverb: 0, delay: 0 } },
  { keywords: ['room', 'small room'], descriptor: { reverb: 0.2 } },
  { keywords: ['hall', 'spacious'], descriptor: { reverb: 0.6 } },
  { keywords: ['cathedral', 'huge', 'massive reverb'], descriptor: { reverb: 0.9 } },
  { keywords: ['echo', 'delay', 'repeating'], descriptor: { delay: 0.4 } },
  { keywords: ['left'], descriptor: { pan: -0.6 } },
  { keywords: ['right'], descriptor: { pan: 0.6 } },
  { keywords: ['center', 'mono', 'centred'], descriptor: { pan: 0 } },
]

/**
 * Volume/energy vocabulary — maps energy adjectives to volume levels.
 */
export const VOLUME_VOCAB: VocabEntry[] = [
  { keywords: ['quiet', 'silent', 'muted'], descriptor: { volume: 0.2 } },
  { keywords: ['subtle', 'low'], descriptor: { volume: 0.4 } },
  { keywords: ['medium', 'moderate'], descriptor: { volume: 0.65 } },
  { keywords: ['loud', 'prominent', 'strong', 'punchy'], descriptor: { volume: 0.85 } },
  { keywords: ['full', 'maximum', 'driving'], descriptor: { volume: 1.0 } },
]

/**
 * Rhythm/pattern vocabulary — maps groove adjectives to 16-step trigger patterns.
 */
export const PATTERN_VOCAB: VocabEntry[] = [
  {
    keywords: ['sparse', 'minimal', 'simple'],
    descriptor: { pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0] },
  },
  {
    keywords: ['syncopated', 'offbeat'],
    descriptor: { pattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
  },
  {
    keywords: ['busy', 'rapid', 'frantic'],
    descriptor: { pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  },
  {
    keywords: ['steady', 'constant', 'regular', 'driving'],
    descriptor: { pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
  },
  {
    keywords: ['half time', 'slow'],
    descriptor: { pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  },
]

/**
 * All vocabulary tables merged in priority order.
 * Sound → Pattern → Space → Volume (later entries win conflicts within a table;
 * tables are applied in order so space overrides sound reverb settings).
 */
export const ALL_VOCAB: VocabEntry[] = [
  ...SOUND_VOCAB,
  ...PATTERN_VOCAB,
  ...SPACE_VOCAB,
  ...VOLUME_VOCAB,
]
