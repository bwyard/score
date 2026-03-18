import { describe, it, expect } from 'vitest'
import { describe as describeInstrument } from '../src/describe.js'

describe('describe', () => {
  it('returns an object for a valid string', () => {
    expect(typeof describeInstrument('kick')).toBe('object')
  })

  it('kick → instrument=kick with 16-step pattern', () => {
    const d = describeInstrument('kick')
    expect(d.instrument).toBe('kick')
    expect(d.pattern).toHaveLength(16)
  })

  it('warm bass → bass instrument with sine wave and lowpass filter', () => {
    const d = describeInstrument('warm bass')
    expect(d.instrument).toBe('bass')
    expect(d.wave).toBe('sine')
    expect(d.filterType).toBe('lowpass')
  })

  it('loud → volume above 0.8', () => {
    const d = describeInstrument('loud kick')
    expect(d.volume).toBeGreaterThan(0.8)
  })

  it('hall reverb → reverb above 0.5', () => {
    const d = describeInstrument('pad with hall reverb')
    expect(d.reverb).toBeGreaterThan(0.5)
  })

  it('dry tight → reverb=0 and delay=0', () => {
    const d = describeInstrument('dry tight snare')
    expect(d.reverb).toBe(0)
    expect(d.delay).toBe(0)
  })

  it('always returns _tokens array', () => {
    const d = describeInstrument('kick')
    expect(Array.isArray(d._tokens)).toBe(true)
    expect(d._tokens?.length).toBeGreaterThan(0)
  })

  it('_tokens contains matched keywords', () => {
    const d = describeInstrument('warm bass')
    expect(d._tokens).toContain('warm')
    expect(d._tokens).toContain('bass')
  })

  it('unknown words return empty descriptor (no crash)', () => {
    const d = describeInstrument('xyzzy frobnicator')
    expect(d._tokens).toEqual([])
    expect(d.instrument).toBeUndefined()
  })

  it('throws ScoreError on empty string', () => {
    expect(() => describeInstrument('')).toThrow()
  })

  it('throws ScoreError on whitespace-only string', () => {
    expect(() => describeInstrument('   ')).toThrow()
  })

  it('throws ScoreError on non-string input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => describeInstrument(null as any as string)).toThrow()
  })

  it('is case-insensitive', () => {
    const d = describeInstrument('KICK')
    expect(d.instrument).toBe('kick')
  })

  it('multiple matching words merge correctly', () => {
    const d = describeInstrument('loud bright lead with echo')
    expect(d.instrument).toBe('lead')
    expect(d.volume).toBeGreaterThan(0.8)
    expect(d.delay).toBeGreaterThan(0)
  })
})
