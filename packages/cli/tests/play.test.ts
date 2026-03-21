import { describe, it, expect, vi, afterEach } from 'vitest'
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// Mock the engine so tests never open a real audio context (avoids JACK dependency on CI)
vi.mock('../src/engine.js', () => ({
  createScoreEngine: vi.fn(() => ({
    start:   vi.fn(),
    stop:    vi.fn(),
    dispose: vi.fn(),
    bpm:     140,
    onBar:   vi.fn(),
  })),
}))

// Helper — write a temp song file and return its path
const writeTempSong = (content: string): string => {
  const dir = join(tmpdir(), 'score-cli-tests')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `test-song-${String(Date.now())}.mjs`)
  writeFileSync(path, content, 'utf-8')
  return path
}

describe('play command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws ScoreError when no file arg given', async () => {
    const { play } = await import('../src/commands/play.js')
    await expect(play([])).rejects.toThrow()
  })

  it('throws ScoreError when file does not exist', async () => {
    const { play } = await import('../src/commands/play.js')
    await expect(play(['/nonexistent/path/song.js'])).rejects.toThrow()
  })

  it('throws ScoreError when default export is not an object', async () => {
    const path = writeTempSong(`export default 42`)
    const { play } = await import('../src/commands/play.js')
    await expect(play([path])).rejects.toThrow()
    unlinkSync(path)
  })

  it('throws ScoreError when bpm is missing', async () => {
    const path = writeTempSong(`export default { tracks: [{}] }`)
    const { play } = await import('../src/commands/play.js')
    await expect(play([path])).rejects.toThrow()
    unlinkSync(path)
  })

  it('plays a valid song — logs BPM and track count', async () => {
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation((msg: unknown) => { logs.push(String(msg)) })

    // Mock process.once to prevent test from hanging
    const onceSpy = vi.spyOn(process, 'once').mockImplementation(() => process)
    vi.spyOn(global, 'setInterval').mockReturnValue(1 as unknown as ReturnType<typeof setInterval>)

    const path = writeTempSong(`
      export default {
        _type: 'SongDefinition',
        bpm: 140,
        key: 'Am',
        genre: 'techno',
        tracks: [{ _type: 'TrackComponent', component: {} }],
        arrangement: [
          { _type: 'SectionDefinition', sectionType: 'drop', bars: 16, tracks: [] }
        ],
      }
    `)

    const { play } = await import('../src/commands/play.js')
    await play([path])

    expect(logs.some(l => l.includes('140 BPM'))).toBe(true)
    expect(logs.some(l => l.includes('Am'))).toBe(true)
    expect(logs.some(l => l.includes('techno'))).toBe(true)
    expect(logs.some(l => l.includes('1 track'))).toBe(true)

    unlinkSync(path)
    onceSpy.mockRestore()
  })

  // Memory leak check: setInterval is cleared on SIGINT
  it('clears keepAlive interval on SIGINT (no leak)', async () => {
    const clearSpy = vi.spyOn(global, 'clearInterval')
    let sigintHandler: (() => void) | undefined

    vi.spyOn(process, 'once').mockImplementation((event: string | symbol, handler: (...args: unknown[]) => void) => {
      if (event === 'SIGINT') sigintHandler = handler as () => void
      return process
    })
    vi.spyOn(global, 'setInterval').mockReturnValue(99 as unknown as ReturnType<typeof setInterval>)
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const path = writeTempSong(`
      export default { _type: 'SongDefinition', bpm: 120, tracks: [{}], arrangement: [] }
    `)

    const { play } = await import('../src/commands/play.js')

    const exitSpy = vi.spyOn(process, 'exit').mockReturnValue(undefined as never)
    await play([path])

    if (sigintHandler) sigintHandler()

    expect(clearSpy).toHaveBeenCalledWith(99)
    expect(exitSpy).toHaveBeenCalledWith(0)
    unlinkSync(path)
    exitSpy.mockRestore()
  })
})
