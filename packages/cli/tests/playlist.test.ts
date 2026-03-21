import { describe, it, expect, vi, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// Mock child_process — playlist spawns subprocesses we don't want in tests
vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => {
    const handlers: Record<string, (...args: unknown[]) => void> = {}
    const child = {
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => { handlers[event] = cb }),
      kill: vi.fn(),
      pid: 1234,
    }
    // Simulate immediate close so the playlist advances
    setTimeout(() => handlers['close']?.(), 10)
    return child
  }),
}))

import { playlist } from '../src/commands/playlist.js'

const SONG_CONTENT = `
import { Song, Kick } from '@score/dsl'
const kick = Kick({ pattern: [1, 0, 0, 0], volume: 0.9 })
export default Song({ bpm: 128, key: 'Am', tracks: [kick] })
`

const SONG_WITH_ARRANGEMENT = `
import { Song, Kick, Intro, Drop, Outro } from '@score/dsl'
const kick = Kick({ pattern: [1, 0, 0, 0], volume: 0.9 })
export default Song({
  bpm: 140,
  key: 'Dm',
  tracks: [kick],
  arrangement: [Intro(4, [kick]), Drop(16, [kick]), Outro(4, [kick])],
})
`

describe('playlist', () => {
  const originalCwd = process.cwd()

  afterEach(() => {
    vi.clearAllMocks()
    process.chdir(originalCwd)
  })

  const makeTempDir = (): string => mkdtempSync(join(tmpdir(), 'score-playlist-'))

  it('discovers songs from examples/ and songs/ when no args given', async () => {
    const dir = makeTempDir()
    mkdirSync(join(dir, 'examples'))
    mkdirSync(join(dir, 'songs'))
    writeFileSync(join(dir, 'examples', '01-test.js'), SONG_CONTENT)
    writeFileSync(join(dir, 'songs', 'full-song.js'), SONG_WITH_ARRANGEMENT)
    process.chdir(dir)

    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await playlist([])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('2 tracks queued')
    expect(output).toContain('01-test.js')
    expect(output).toContain('full-song.js')
    expect(output).toContain('Playlist complete')
    spy.mockRestore()
  })

  it('plays specific files when paths are given', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'track.js'), SONG_CONTENT)
    process.chdir(dir)

    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await playlist(['track.js'])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('1 tracks queued')
    expect(output).toContain('track.js')
    spy.mockRestore()
  })

  it('reads .playlist files', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'a.js'), SONG_CONTENT)
    writeFileSync(join(dir, 'b.js'), SONG_WITH_ARRANGEMENT)
    writeFileSync(join(dir, 'my-set.playlist'), '# My set\na.js\nb.js\n')
    process.chdir(dir)

    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await playlist(['my-set.playlist'])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('2 tracks queued')
    spy.mockRestore()
  })

  it('skips missing files with a message', async () => {
    const dir = makeTempDir()
    process.chdir(dir)

    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await playlist(['nonexistent.js'])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('Skipping')
    expect(output).toContain('No song files found')
    spy.mockRestore()
  })

  it('detects once through mode for songs without arrangement', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'loop.js'), SONG_CONTENT)
    process.chdir(dir)

    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await playlist(['loop.js'])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('once through')
    expect(output).toContain('128 BPM')
    spy.mockRestore()
  })

  it('detects full form mode for songs with arrangement', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'song.js'), SONG_WITH_ARRANGEMENT)
    process.chdir(dir)

    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await playlist(['song.js'])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('full form')
    expect(output).toContain('140 BPM')
    expect(output).toContain('intro(4b) → drop(16b) → outro(4b)')
    spy.mockRestore()
  })

  it('prints nothing found when directories are empty', async () => {
    const dir = makeTempDir()
    process.chdir(dir)

    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await playlist([])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('No song files found')
    spy.mockRestore()
  })
})
