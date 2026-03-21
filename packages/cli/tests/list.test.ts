import { describe, it, expect, vi, afterEach } from 'vitest'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ── helpers ───────────────────────────────────────────────────────────────────

const writeTempSong = (content: string): string => {
  const dir = join(tmpdir(), 'score-cli-list-tests')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `list-song-${String(Date.now())}.mjs`)
  writeFileSync(path, content, 'utf-8')
  return path
}

const MINIMAL_SONG = `
import { Song, Kick } from '@score/dsl'
export default Song({ bpm: 128, tracks: [Kick()] })
`

const FULL_SONG = `
import { Song, Kick, Snare, HiHat, Synth, Intro, Drop } from '@score/dsl'
const kick  = Kick({ pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] })
const snare = Snare()
const hihat = HiHat()
const bass  = Synth({ wave: 'sawtooth', gain: 0.3 })
export default Song({
  bpm: 140,
  key: 'Am',
  genre: 'techno',
  tracks: [kick, snare, hihat, bass],
  arrangement: [
    Intro(4,  [kick, bass]),
    Drop(16,  [kick, snare, hihat, bass]),
  ],
})
`

// ── tests ─────────────────────────────────────────────────────────────────────

describe('list command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws ScoreError when no file arg given', async () => {
    const { list } = await import('../src/commands/list.js')
    await expect(list([])).rejects.toThrow()
  })

  it('throws ScoreError when file does not exist', async () => {
    const { list } = await import('../src/commands/list.js')
    await expect(list(['/nonexistent/path/song.js'])).rejects.toThrow()
  })

  it('prints bpm and track count for a minimal song', async () => {
    const { list } = await import('../src/commands/list.js')
    const path = writeTempSong(MINIMAL_SONG)
    const output: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '))
    })
    await list([path, '--trust'])
    const combined = output.join('\n')
    expect(combined).toContain('128')
    expect(combined.toLowerCase()).toContain('kick')
  })

  it('prints key and genre when present', async () => {
    const { list } = await import('../src/commands/list.js')
    const path = writeTempSong(FULL_SONG)
    const output: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '))
    })
    await list([path, '--trust'])
    const combined = output.join('\n')
    expect(combined).toContain('140')
    expect(combined).toContain('Am')
    expect(combined).toContain('techno')
  })

  it('prints arrangement sections when present', async () => {
    const { list } = await import('../src/commands/list.js')
    const path = writeTempSong(FULL_SONG)
    const output: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '))
    })
    await list([path, '--trust'])
    const combined = output.join('\n')
    expect(combined).toContain('20')   // total bars: Intro(4) + Drop(16)
    expect(combined.toLowerCase()).toContain('intro')
    expect(combined.toLowerCase()).toContain('drop')
  })

  it('lists all four tracks', async () => {
    const { list } = await import('../src/commands/list.js')
    const path = writeTempSong(FULL_SONG)
    const output: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '))
    })
    await list([path, '--trust'])
    const combined = output.join('\n')
    expect(combined.toLowerCase()).toContain('kick')
    expect(combined.toLowerCase()).toContain('snare')
    expect(combined.toLowerCase()).toContain('hihat')
    expect(combined.toLowerCase()).toContain('synth')
  })

  it('-t flag accepted as alias for --trust', async () => {
    const { list } = await import('../src/commands/list.js')
    const path = writeTempSong(MINIMAL_SONG)
    await expect(list([path, '-t'])).resolves.not.toThrow()
  })
})
