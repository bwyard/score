import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ── Engine mock ───────────────────────────────────────────────────────────────

vi.mock('../src/engine.js', () => ({
  createScoreEngine: vi.fn(() => ({
    start:   vi.fn(),
    stop:    vi.fn(),
    dispose: vi.fn(),
    bpm:     140,
    onBar:   vi.fn(),
  })),
}))

// ── readline mock ─────────────────────────────────────────────────────────────
//
// createInterface returns a fake EventEmitter-like object that lets tests
// push lines in via simulateLine() and trigger 'close' via simulateClose().
// The real readline would block waiting for stdin — this never does.

type FakeRl = {
  prompt:       ReturnType<typeof vi.fn>
  close:        ReturnType<typeof vi.fn>
  on:           ReturnType<typeof vi.fn>
  _emit:        (event: string, ...args: unknown[]) => void
  simulateLine: (line: string) => void
  simulateClose: () => void
}

const makeFakeRl = (): FakeRl => {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}

  const rl: FakeRl = {
    prompt: vi.fn(),
    close:  vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(handler)
    }),
    _emit: (event: string, ...args: unknown[]) => {
      for (const handler of listeners[event] ?? []) {
        handler(...args)
      }
    },
    simulateLine: (line: string) => {
      for (const handler of listeners['line'] ?? []) {
        handler(line)
      }
    },
    simulateClose: () => {
      for (const handler of listeners['close'] ?? []) {
        handler()
      }
    },
  }

  return rl
}

let fakeRl: FakeRl

vi.mock('node:readline', () => ({
  createInterface: vi.fn(() => fakeRl),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const writeTempSong = (content: string): string => {
  const dir = join(tmpdir(), 'score-repl-tests')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `test-song-${String(Date.now())}.mjs`)
  writeFileSync(path, content, 'utf-8')
  return path
}

/**
 * Wait for all async work queued by a readline handler to settle.
 * Uses 100 ms so that real dynamic import() calls in loadSongFile have time
 * to resolve before the next command is sent.
 */
const flushAsync = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 100))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('repl command', () => {
  beforeEach(() => {
    fakeRl = makeFakeRl()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── 1. Starts without error and opens readline ──────────────────────────────

  it('starts without error and prompts the user', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { repl } = await import('../src/commands/repl.js')

    // Fire repl — it will pend until 'close'
    const replPromise = repl([])
    await flushAsync()

    expect(fakeRl.prompt).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Score REPL'),
    )

    // Cleanly close to let the promise resolve
    fakeRl.simulateClose()
    await replPromise
  })

  // ── 2. `status` when no song loaded ────────────────────────────────────────

  it('status with no song loaded logs "No song loaded"', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { repl } = await import('../src/commands/repl.js')
    const replPromise = repl([])
    await flushAsync()

    fakeRl.simulateLine('status')
    await flushAsync()

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No song loaded'),
    )

    fakeRl.simulateClose()
    await replPromise
  })

  // ── 3. `load <nonexistent>` logs file not found ─────────────────────────────

  it('load with a nonexistent file logs file not found error', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { repl } = await import('../src/commands/repl.js')
    const replPromise = repl([])
    await flushAsync()

    fakeRl.simulateLine('load /nonexistent/path/song.js')
    await flushAsync()

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('File not found'),
    )

    fakeRl.simulateClose()
    await replPromise
  })

  // ── 4. `help` outputs help text ─────────────────────────────────────────────

  it('help command outputs help text with available commands', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { repl } = await import('../src/commands/repl.js')
    const replPromise = repl([])
    await flushAsync()

    fakeRl.simulateLine('help')
    await flushAsync()

    const output = logSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(output).toContain('load')
    expect(output).toContain('stop')
    expect(output).toContain('status')
    expect(output).toContain('exit')

    fakeRl.simulateClose()
    await replPromise
  })

  // ── 5. `stop` when nothing is playing logs warning ──────────────────────────

  it('stop when nothing is playing logs warning', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { repl } = await import('../src/commands/repl.js')
    const replPromise = repl([])
    await flushAsync()

    fakeRl.simulateLine('stop')
    await flushAsync()

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Nothing is playing'),
    )

    fakeRl.simulateClose()
    await replPromise
  })

  // ── 6. `exit` calls rl.close() ──────────────────────────────────────────────

  it('exit command calls rl.close()', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const { repl } = await import('../src/commands/repl.js')
    const replPromise = repl([])
    await flushAsync()

    fakeRl.simulateLine('exit')
    await flushAsync()

    expect(fakeRl.close).toHaveBeenCalled()

    // Trigger close event so the promise resolves
    fakeRl.simulateClose()
    await replPromise
  })

  it('.exit command calls rl.close()', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const { repl } = await import('../src/commands/repl.js')
    const replPromise = repl([])
    await flushAsync()

    fakeRl.simulateLine('.exit')
    await flushAsync()

    expect(fakeRl.close).toHaveBeenCalled()

    fakeRl.simulateClose()
    await replPromise
  })

  // ── 7. Unknown command logs helpful message ──────────────────────────────────

  it('unknown command logs "Unknown command"', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { repl } = await import('../src/commands/repl.js')
    const replPromise = repl([])
    await flushAsync()

    fakeRl.simulateLine('frobnicate')
    await flushAsync()

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown command'),
    )

    fakeRl.simulateClose()
    await replPromise
  })

  // ── 8. `status` after a valid load shows file and BPM ───────────────────────

  it('status after a valid load shows the file and BPM', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const songPath = writeTempSong(`
      export default {
        _type: 'SongDefinition',
        bpm: 128,
        key: 'Cm',
        genre: 'house',
        tracks: [],
        arrangement: [],
      }
    `)

    const { repl } = await import('../src/commands/repl.js')
    const replPromise = repl([])
    await flushAsync()

    fakeRl.simulateLine(`load ${songPath}`)
    await flushAsync()

    fakeRl.simulateLine('status')
    await flushAsync()

    const output = logSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(output).toContain('128')
    expect(output).toContain(songPath)

    fakeRl.simulateClose()
    await replPromise

    unlinkSync(songPath)
  })
})
