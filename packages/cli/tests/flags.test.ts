import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseFlags } from '../src/flags.js'

const noopUsage = (): void => { /* intentionally empty */ }

describe('parseFlags', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty values and positionals for no args', () => {
    const result = parseFlags([], {}, noopUsage)
    expect(result.values).toMatchObject({})
    expect(result.positionals).toEqual([])
  })

  it('parses a boolean flag', () => {
    const result = parseFlags(['--watch'], { watch: { type: 'boolean' } }, noopUsage)
    expect(result.values['watch']).toBe(true)
  })

  it('parses a short alias', () => {
    const result = parseFlags(['-w'], { watch: { type: 'boolean', short: 'w' } }, noopUsage)
    expect(result.values['watch']).toBe(true)
  })

  it('collects positional args', () => {
    const result = parseFlags(['song.js'], {}, noopUsage)
    expect(result.positionals).toEqual(['song.js'])
  })

  it('separates flags and positionals', () => {
    const result = parseFlags(['song.js', '--watch', '-t'], {
      watch: { type: 'boolean', short: 'w' },
      trust: { type: 'boolean', short: 't' },
    }, noopUsage)
    expect(result.values['watch']).toBe(true)
    expect(result.values['trust']).toBe(true)
    expect(result.positionals).toEqual(['song.js'])
  })

  it('exits 0 on --help', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: string | number | null) => never)
    const usageSpy = vi.fn()
    parseFlags(['--help'], {}, usageSpy)
    expect(usageSpy).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledWith(0)
  })

  it('exits 0 on -h', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: string | number | null) => never)
    const usageSpy = vi.fn()
    parseFlags(['-h'], {}, usageSpy)
    expect(usageSpy).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledWith(0)
  })

  it('exits 1 on unknown flag', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code) => {
      throw new Error(`process.exit:${String(code)}`)
    }) as (code?: string | number | null) => never)
    const usageSpy = vi.fn()
    expect(() => parseFlags(['--unknown-flag'], {}, usageSpy)).toThrow('process.exit:1')
    expect(usageSpy).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('does not treat -- prefixed values as flags when passed as positionals after --', () => {
    const result = parseFlags(['--', '--not-a-flag'], {}, noopUsage)
    expect(result.positionals).toEqual(['--not-a-flag'])
  })
})
