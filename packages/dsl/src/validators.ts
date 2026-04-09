// =============================================================================
// @score/dsl — validators
// Runtime input validators for all ChainMethods. Each validator is a pure
// function that throws ScoreError with a fix hint on invalid input.
//
// Grouped by domain — ~10 schema groups covering all ~50 chain methods.
// Zod schemas are used internally; the public API is the validate* functions.
// =============================================================================

import { z }          from 'zod'
import { ScoreError } from '@score/core'

// ── Internal schema definitions ───────────────────────────────────────────────

const schemaSpeedMultiplier = z.number().refine(n => n !== 0, { message: 'Speed multiplier cannot be 0.' })

const schemaProbability     = z.number().min(0).max(1)

const schemaTimingSeconds   = z.number().min(0)

const schemaBarCount        = z.number().int().min(1)

const schemaBars            = z.number().min(0)

const schemaVolume          = z.number().min(0).max(2)

const schemaPan             = z.number().min(-1).max(1)

const schemaWiden           = z.number().min(0).max(1)

const schemaFrequency       = z.number().min(20).max(20000)

const schemaFilterQ         = z.number().min(0.1).max(30)

const schemaGain            = z.number().min(0).max(2)

const schemaEqBand          = z.number().min(-40).max(40)

const schemaBitDepth        = z.number().int().min(1).max(32)

const schemaSaturation      = z.number().min(0).max(1)

const schemaEuclideanHits   = z.number().int().min(0)

const schemaEuclideanSteps  = z.number().int().min(1).max(128)

const schemaShiftSteps      = z.number().int()

const schemaStutterCount    = z.number().int().min(0).max(32)

const schemaRepeatCount     = z.number().int().min(1)

const schemaSemitones       = z.number().int().min(-48).max(48)

const schemaOctave          = z.number().int().min(-4).max(4)

const schemaSendBus         = z.string().min(1)

const schemaSendAmount      = z.number().min(0).max(1)

const schemaChokeGroup      = z.string().min(1)

const schemaModulationParam = z.string().min(1)

const schemaLfoRate         = z.number().min(0.01).max(50)

const schemaLfoDepth        = z.number().min(0).max(1)

const schemaEveryN          = z.number().int().min(1)

const schemaPhaseAmount     = z.number().min(-1).max(1)

const schemaSwellBars       = z.number().min(0)

const schemaHexColor        = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Color must be a CSS hex value e.g. #ff3366.')

const schemaNoteString      = z.string().min(1)

const schemaNotesArray      = z.array(z.union([z.string(), z.number()])).min(1)

const schemaPatternArray    = z.array(z.union([z.number(), z.string()])).min(1)

const schemaScaleName       = z.string().min(1)

const schemaScaleRoot       = z.string().min(1)

const schemaStepProbArray   = z.array(z.number().min(0).max(1)).min(1)

const schemaSeedValue       = z.number().int().min(0)

const schemaNameLabel       = z.string().min(1)

const schemaGlyphKind       = z.string().min(1)

const schemaOpacity         = z.number().min(0).max(1)

const schemaDelayTime       = z.union([
  z.string().regex(/^\d+(\.\d+)?(n|t|\.)?$/, 'Delay time must be a seconds number or note value e.g. "8n", "4t".'),
  z.number().min(0).max(10),
])

const schemaFeedback        = z.number().min(0).max(0.99)

const schemaDurTime         = z.number().min(0).max(60)

const schemaGlideTime       = z.number().min(0).max(10)

// ── Internal parse helper ─────────────────────────────────────────────────────

const parse = <T>(
  schema:    z.ZodType<T>,
  value:     unknown,
  method:    string,
  fixHint:   string,
): T => {
  const result = schema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]?.message ?? 'Invalid value.'
    throw ScoreError(`${method}() — ${issue} ${fixHint}`, { received: value, fix: fixHint, docs: '' })
  }
  return result.data
}

// =============================================================================
// Public validator functions — one per chain method (or closely related group).
// Each throws ScoreError with a fix hint on invalid input.
// =============================================================================

// ── Pattern ───────────────────────────────────────────────────────────────────

/** `.speed(n)` — non-zero number. */
export const validateSpeed = (n: unknown): number =>
  parse(schemaSpeedMultiplier, n, 'speed', 'Use a non-zero number e.g. .speed(0.5) or .speed(2).')

/** `.slow(n)` / `.augment(n)` — positive number. */
export const validateSlow = (n: unknown): number =>
  parse(z.number().positive(), n, 'slow', 'Use a positive number e.g. .slow(2).')

/** `.fast(n)` / `.diminish(n)` — positive number. */
export const validateFast = (n: unknown): number =>
  parse(z.number().positive(), n, 'fast', 'Use a positive number e.g. .fast(2).')

/** `.euclidean(hits, steps)` — hits: non-negative integer, steps: 1–128. */
export const validateEuclidean = (hits: unknown, steps: unknown): { hits: number; steps: number } => ({
  hits:  parse(schemaEuclideanHits,  hits,  'euclidean', 'hits must be a non-negative integer e.g. .euclidean(3, 8).'),
  steps: parse(schemaEuclideanSteps, steps, 'euclidean', 'steps must be 1–128 e.g. .euclidean(3, 8).'),
})

/** `.shift(n)` — integer (positive or negative). */
export const validateShift = (n: unknown): number =>
  parse(schemaShiftSteps, n, 'shift', 'Use an integer e.g. .shift(2) or .shift(-1).')

/** `.stutter(n)` — integer 0–32. */
export const validateStutter = (n: unknown): number =>
  parse(schemaStutterCount, n, 'stutter', 'Use an integer 0–32 e.g. .stutter(3).')

/** `.degrade(p)` — probability 0–1. */
export const validateDegrade = (p: unknown): number =>
  parse(schemaProbability, p, 'degrade', 'Use a number between 0 and 1 e.g. .degrade(0.3).')

/** `.humanize(amt)` — seconds &gt;= 0. */
export const validateHumanize = (amt: unknown): number =>
  parse(schemaTimingSeconds, amt, 'humanize', 'Use a non-negative number in seconds e.g. .humanize(0.01).')

/** `.swing(amount)` — 0–1. */
export const validateSwing = (amount: unknown): number =>
  parse(schemaProbability, amount, 'swing', 'Use a number between 0 and 1 e.g. .swing(0.5).')

/** `.every(n, fn)` — n: positive integer. */
export const validateEvery = (n: unknown): number =>
  parse(schemaEveryN, n, 'every', 'Use a positive integer e.g. .every(4, p => p.reverse()).')

/** `.repeat(n)` — positive integer. */
export const validateRepeat = (n: unknown): number =>
  parse(schemaRepeatCount, n, 'repeat', 'Use a positive integer e.g. .repeat(2).')

/** `.pattern(pat)` — non-empty array. */
export const validatePattern = (pat: unknown): (string | number)[] =>
  parse(schemaPatternArray, pat, 'pattern', 'Use a non-empty array e.g. .pattern([1, 0, 1, 0]).')

/** `.stepProb(probs)` — array of probabilities 0–1. */
export const validateStepProb = (probs: unknown): number[] =>
  parse(schemaStepProbArray, probs, 'stepProb', 'Use an array of numbers 0–1 e.g. .stepProb([1, 0.5, 0.8, 1]).')

/** `.stretch(bars)` — positive number of bars. */
export const validateStretch = (bars: unknown): number =>
  parse(z.number().positive(), bars, 'stretch', 'Use a positive number e.g. .stretch(2).')

/** `.phase(amount)` — -1 to 1. */
export const validatePhase = (amount: unknown): number =>
  parse(schemaPhaseAmount, amount, 'phase', 'Use a number between -1 and 1 e.g. .phase(0.5).')

/** `.fromBar(n)` / `.untilBar(n)` — non-negative integer bar number. */
export const validateBarNumber = (n: unknown, method: string): number =>
  parse(z.number().int().min(0), n, method, `Use a non-negative integer e.g. .${method}(4).`)

/** `.fadeIn(bars)` / `.fadeOut(bars)` — non-negative number of bars. */
export const validateFadeBars = (bars: unknown, method: string): number =>
  parse(schemaBars, bars, method, `Use a non-negative number e.g. .${method}(2).`)

// ── Pitch / notes ─────────────────────────────────────────────────────────────

/** `.note(pitch)` — non-empty note string e.g. "C4". */
export const validateNote = (pitch: unknown): string =>
  parse(schemaNoteString, pitch, 'note', 'Use a note string e.g. .note("C4") or .note("A3").')

/** `.notes(arr)` — non-empty array of note strings or MIDI numbers. */
export const validateNotes = (arr: unknown): (string | number)[] =>
  parse(schemaNotesArray, arr, 'notes', 'Use a non-empty array e.g. .notes(["C4","E4","G4"]).')

/** `.scale(name, root)` — non-empty strings. */
export const validateScale = (name: unknown, root: unknown): { name: string; root: string } => ({
  name: parse(schemaScaleName, name, 'scale', 'Use a scale name e.g. .scale("minor", "C").'),
  root: parse(schemaScaleRoot, root, 'scale', 'Use a root note e.g. .scale("minor", "C").'),
})

/** `.pitch(semitones)` — integer -48 to +48. */
export const validatePitch = (semitones: unknown): number =>
  parse(schemaSemitones, semitones, 'pitch', 'Use an integer semitone offset -48 to +48 e.g. .pitch(-12).')

/** `.octave(n)` — integer -4 to +4. */
export const validateOctave = (n: unknown): number =>
  parse(schemaOctave, n, 'octave', 'Use an integer -4 to +4 e.g. .octave(-1).')

/** `.glide(time)` — seconds 0–10. */
export const validateGlide = (time: unknown): number =>
  parse(schemaGlideTime, time, 'glide', 'Use a number in seconds 0–10 e.g. .glide(0.05).')

/** `.dur(time)` — seconds 0–60. */
export const validateDur = (time: unknown): number =>
  parse(schemaDurTime, time, 'dur', 'Use a note duration in seconds 0–60 e.g. .dur(0.25).')

// ── Amplitude ─────────────────────────────────────────────────────────────────

/** `.volume(v)` — 0–2. Values above 1 amplify. */
export const validateVolume = (v: unknown): number =>
  parse(schemaVolume, v, 'volume', 'Use a number 0–2 e.g. .volume(0.8). Values above 1 amplify.')

/** `.tone(hz)` — bandpass filter frequency in Hz (20–20000). */
export const validateTone = (hz: unknown): number =>
  parse(schemaFrequency, hz, 'tone', 'Use a frequency in Hz e.g. .tone(4000). Range 20–20000.')

/** `.attack(s)` / `.decay(s)` / `.release(s)` — seconds &gt;= 0. */
export const validateAdsrTime = (s: unknown, method: string): number =>
  parse(schemaTimingSeconds, s, method, `Use a non-negative number in seconds e.g. .${method}(0.01).`)

/** `.sustain(v)` — 0–1. */
export const validateSustain = (v: unknown): number =>
  parse(schemaProbability, v, 'sustain', 'Use a number 0–1 e.g. .sustain(0.7).')

/** `.pan(v)` — -1 (left) to 1 (right). */
export const validatePan = (v: unknown): number =>
  parse(schemaPan, v, 'pan', 'Use a number -1 to 1 e.g. .pan(-0.5) for left, .pan(0.5) for right.')

/** `.widen(amt)` — 0–1. */
export const validateWiden = (amt: unknown): number =>
  parse(schemaWiden, amt, 'widen', 'Use a number 0–1 e.g. .widen(0.5).')

// ── Tone / filter ─────────────────────────────────────────────────────────────

/** `.filter(freq, q?)` — freq: 20–20000 Hz, Q: 0.1–30. */
export const validateFilter = (freq: unknown, q: unknown): { frequency: number; Q?: number } => {
  const frequency = parse(schemaFrequency, freq, 'filter', 'Use a frequency 20–20000 Hz e.g. .filter(800).')
  const Q         = q === undefined ? undefined : parse(schemaFilterQ, q, 'filter', 'Use a Q value 0.1–30 e.g. .filter(800, 2).')
  return Q === undefined ? { frequency } : { frequency, Q }
}

/** `.eq(low, mid, high)` — each -40 to +40 dB. */
export const validateEq = (low: unknown, mid: unknown, high: unknown): { lo: number; mid: number; hi: number } => ({
  lo:  parse(schemaEqBand, low,  'eq', 'Use dB values -40 to +40 e.g. .eq(3, 0, -2).'),
  mid: parse(schemaEqBand, mid,  'eq', 'Use dB values -40 to +40 e.g. .eq(3, 0, -2).'),
  hi:  parse(schemaEqBand, high, 'eq', 'Use dB values -40 to +40 e.g. .eq(3, 0, -2).'),
})

/** `.bit(bits)` — integer 1–32. */
export const validateBit = (bits: unknown): number =>
  parse(schemaBitDepth, bits, 'bit', 'Use an integer 1–32 e.g. .bit(8).')

/** `.saturate(amt)` — 0–1. */
export const validateSaturate = (amt: unknown): number =>
  parse(schemaSaturation, amt, 'saturate', 'Use a number 0–1 e.g. .saturate(0.4).')

// ── Effects ───────────────────────────────────────────────────────────────────

/** `.reverb(wet)` — 0–1. */
export const validateReverbWet = (wet: unknown): number =>
  parse(schemaProbability, wet, 'reverb', 'Use a wet amount 0–1 e.g. .reverb(0.3).')

/** `.delay(time, feedback?)` — time: seconds or note value string, feedback: 0–0.99. */
export const validateDelay = (time: unknown, feedback: unknown): { time: string | number; feedback?: number } => ({
  time: parse(schemaDelayTime, time, 'delay', 'Use seconds or note value e.g. .delay(0.375) or .delay("8n").'),
  ...(feedback !== undefined
    ? { feedback: parse(schemaFeedback, feedback, 'delay', 'Use a feedback value 0–0.99 e.g. .delay("8n", 0.4).') }
    : {}),
})

/** `.chorus(depth?)` / `.flange(depth?)` / `.wobble(depth)` — 0–1. */
export const validateModDepth = (depth: unknown, method: string): number =>
  parse(schemaLfoDepth, depth, method, `Use a depth 0–1 e.g. .${method}(0.5).`)

/** `.tremolo(rate, depth?)` / `.vibrato(rate, depth?)` / `.autopan(rate, depth?)` / `.flutter(rate?)` / `.breathe(rate?)` — rate: 0.01–50 Hz. */
export const validateLfoRate = (rate: unknown, method: string): number =>
  parse(schemaLfoRate, rate, method, `Use a rate 0.01–50 Hz e.g. .${method}(4).`)

/** `.swell(bars)` — non-negative number of bars. */
export const validateSwell = (bars: unknown): number =>
  parse(schemaSwellBars, bars, 'swell', 'Use a non-negative number e.g. .swell(2).')

// ── Routing ───────────────────────────────────────────────────────────────────

/** `.send(bus, amount?)` — bus: non-empty string, amount: 0–1. */
export const validateSend = (bus: unknown, amount: unknown): { bus: string; amount: number } => ({
  bus:    parse(schemaSendBus,    bus,    'send', 'Use a bus name string e.g. .send("reverb", 0.3).'),
  amount: parse(schemaSendAmount, amount, 'send', 'Use an amount 0–1 e.g. .send("reverb", 0.3).'),
})

/** `.chokeGroup(name)` — non-empty string. */
export const validateChokeGroup = (name: unknown): string =>
  parse(schemaChokeGroup, name, 'chokeGroup', 'Use a group name string e.g. .chokeGroup("hats").')

// ── Modulation ────────────────────────────────────────────────────────────────

/** `.modulate(param, source)` — param: non-empty string. */
export const validateModulateParam = (param: unknown): string =>
  parse(schemaModulationParam, param, 'modulate', 'Use a param name string e.g. .modulate("frequency", lfo(2)).')

// ── Visual / metadata ─────────────────────────────────────────────────────────

/** `.color(hex)` — CSS hex color. */
export const validateColor = (hex: unknown): string =>
  parse(schemaHexColor, hex, 'color', 'Use a CSS hex color e.g. .color("#ff3366").')

/** `.glyph(kind)` — non-empty string. */
export const validateGlyph = (kind: unknown): string =>
  parse(schemaGlyphKind, kind, 'glyph', 'Use a glyph kind string e.g. .glyph("kick").')

/** `.label(text)` / `.name(label)` — non-empty string. */
export const validateLabel = (text: unknown, method: string): string =>
  parse(schemaNameLabel, text, method, `Use a non-empty string e.g. .${method}("kick").`)

/** `.seed(n)` — non-negative integer. */
export const validateSeed = (n: unknown): number =>
  parse(schemaSeedValue, n, 'seed', 'Use a non-negative integer e.g. .seed(42).')

/** Visual `.opacity(v)` override — 0–1. */
export const validateOpacity = (v: unknown): number =>
  parse(schemaOpacity, v, 'opacity', 'Use a number 0–1 e.g. .opacity(0.8).')

/** `.gain(v)` on effects — 0–2. */
export const validateGain = (v: unknown): number =>
  parse(schemaGain, v, 'gain', 'Use a number 0–2 e.g. .gain(0.8).')

/** `.model(variant)` — non-empty string. */
export const validateModel = (variant: unknown): string =>
  parse(z.string().min(1), variant, 'model', 'Use a variant string e.g. .model("909").')

/** `.stretch(bars)` bar count for integer bar counts — positive integer. */
export const validateBarCount = (n: unknown): number =>
  parse(schemaBarCount, n, 'bars', 'Use a positive integer e.g. 4.')
