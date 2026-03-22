import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolve } from 'node:path'

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
}))

import { writeFileSync, existsSync } from 'node:fs'
import { newSong } from '../src/commands/new.js'

afterEach(() => {
  vi.clearAllMocks()
})

describe('newSong', () => {
  it('creates a .js file when given a name', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    newSong(['song', 'my-track'])

    expect(writeFileSync).toHaveBeenCalledWith(
      resolve(process.cwd(), 'my-track.js'),
      expect.any(String),
      'utf-8',
    )
    logSpy.mockRestore()
  })

  it('appends .js extension if missing', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    newSong(['song', 'test-song'])

    const [path] = vi.mocked(writeFileSync).mock.calls[0] as [string, ...unknown[]]
    expect(path).toMatch(/test-song\.js$/)
    logSpy.mockRestore()
  })

  it('does not double-append .js if already present', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    newSong(['song', 'already.js'])

    const [path] = vi.mocked(writeFileSync).mock.calls[0] as [string, ...unknown[]]
    expect(path).toMatch(/already\.js$/)
    expect(path).not.toMatch(/already\.js\.js$/)
    logSpy.mockRestore()
  })

  it('template contains note names in pattern', () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    newSong(['song', 'note-test'])

    const [, content] = vi.mocked(writeFileSync).mock.calls[0] as [string, string, ...unknown[]]
    expect(content).toContain("'A2'")
    expect(content).toContain("'D3'")
    logSpy.mockRestore()
  })

  it('exits when file already exists', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: number | string | null) => { throw new Error('process.exit') })

    expect(() => { newSong(['song', 'existing']); }).toThrow('process.exit')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('File already exists'))
    expect(exitSpy).toHaveBeenCalledWith(1)

    errorSpy.mockRestore()
    exitSpy.mockRestore()
  })

  it('prints usage when no name provided', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit:1')
    }) as (code?: string | number | null) => never)

    expect(() => { newSong(['song']); }).toThrow('process.exit:1')

    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('Usage:')
    expect(writeFileSync).not.toHaveBeenCalled()
    logSpy.mockRestore()
    exitSpy.mockRestore()
  })

  it('prints usage when not given song subcommand', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit:1')
    }) as (code?: string | number | null) => never)

    expect(() => { newSong([]); }).toThrow('process.exit:1')

    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('Usage:')
    logSpy.mockRestore()
    exitSpy.mockRestore()
  })
})
