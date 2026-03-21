// playlist.ts — Play song files in sequence
//
// Usage: score playlist                        Play all examples + songs
//        score playlist songs/my-track.js      Play specific files
//        score playlist my-set.playlist        Play from a playlist file

import { spawn, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ── Types ───────────────────────────────────────────────────────────────────

type PlaylistEntry = {
  readonly file: string
  readonly bars: number | null
}

type SongMeta = {
  readonly bpm: number
  readonly key: string | null
  readonly sections: ReadonlyArray<{ readonly sectionType: string; readonly bars: number }>
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const barDurationSec = (bpm: number, bars: number): number => (bars * 4 * 60) / bpm

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${String(m)}m${String(s).padStart(2, '0')}s` : `${String(s)}s`
}

const totalBarsFromSections = (sections: SongMeta['sections']): number =>
  sections.reduce((sum, s) => sum + s.bars, 0)

const pause = (sec: number): Promise<void> =>
  new Promise((res) => setTimeout(res, sec * 1000))

// Parse song metadata from source text to avoid dynamic import side-effects
const parseSongMeta = (filePath: string): SongMeta => {
  const src = readFileSync(filePath, 'utf-8')
  const bpmMatch = src.match(/bpm:\s*(\d+)/)
  const keyMatch = src.match(/key:\s*'([^']+)'/)

  const sections = [...src.matchAll(/(Intro|Drop|Breakdown|Buildup|Outro)\(\s*(\d+)/g)]
    .map(([, type, bars]) => ({
      sectionType: (type ?? '').toLowerCase(),
      bars: parseInt(bars ?? '0', 10),
    }))

  return {
    bpm: bpmMatch?.[1] ? parseInt(bpmMatch[1], 10) : 120,
    key: keyMatch?.[1] ?? null,
    sections,
  }
}

// Discover song files from a directory, sorted by name
const discoverSongs = (dir: string): ReadonlyArray<string> => {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.js') && f !== 'new-song.js')
    .sort()
    .map((f) => resolve(dir, f))
}

// Has arrangement sections → full form, otherwise 8-bar sample
const hasArrangement = (meta: SongMeta): boolean => meta.sections.length > 0

// Build entry from a file path — auto-detect mode from arrangement
const toEntry = (file: string): PlaylistEntry => {
  const meta = parseSongMeta(file)
  return { file, bars: hasArrangement(meta) ? null : 8 }
}

// Read a .playlist file — one path per line, # comments, blank lines ignored
const readPlaylistFile = (filePath: string): ReadonlyArray<string> => {
  const dir = resolve(filePath, '..')
  return readFileSync(filePath, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => resolve(dir, line))
}

const isPlaylistFile = (path: string): boolean => path.endsWith('.playlist')

// ── Playback ────────────────────────────────────────────────────────────────

const cliEntry = resolve(
  fileURLToPath(import.meta.url), '..', '..', 'index.js',
)

const playSongFile = (filePath: string, durationSec: number): Promise<ChildProcess> =>
  new Promise((res) => {
    const child = spawn(
      'node',
      [cliEntry, 'play', '--trust', filePath],
      { stdio: 'inherit', env: { ...process.env, NODE_NO_WARNINGS: '1' } },
    )

    const timer = setTimeout(() => child.kill('SIGTERM'), durationSec * 1000)

    child.on('close', () => {
      clearTimeout(timer)
      res(child)
    })
  })

const logEntry = (
  i: number,
  total: number,
  entry: PlaylistEntry,
  meta: SongMeta,
  bars: number,
  duration: number,
): void => {
  const mode = entry.bars === null ? 'full form' : '8-bar sample'
  const keyStr = meta.key ? ` — ${meta.key}` : ''

  console.log(`Score: [${String(i + 1)}/${String(total)}] ${entry.file}`)
  console.log(`Score: ${String(meta.bpm)} BPM${keyStr} — ${String(bars)} bars — ${formatDuration(duration)} — ${mode}`)

  if (entry.bars === null && meta.sections.length > 0) {
    const flow = meta.sections
      .map((s) => `${s.sectionType}(${String(s.bars)}b)`)
      .join(' → ')
    console.log(`Score: Arrangement — ${flow}`)
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

/**
 * Play song files in sequence — examples get 8-bar samples, songs play full form.
 *
 * @param args - Positional file paths (`.js` or `.playlist`). Empty = discover all.
 *
 * @example
 * ```ts
 * await playlist([])                                    // all examples + songs
 * await playlist(['songs/example-techno.js'])           // one file
 * await playlist(['my-set.playlist'])                   // from playlist file
 * ```
 */
export const playlist = async (args: string[]): Promise<void> => {
  const cwd = process.cwd()
  const rawArgs = args.filter((a) => !a.startsWith('-'))

  // Expand .playlist files into their listed paths, pass .js files through
  const files = rawArgs.flatMap((f) => {
    const resolved = resolve(cwd, f)
    return isPlaylistFile(resolved) ? readPlaylistFile(resolved) : [resolved]
  })

  // Explicit files → play those. No files → discover from examples/ + songs/
  const entries: ReadonlyArray<PlaylistEntry> = files.length > 0
    ? files
        .filter((f) => {
          if (!existsSync(f)) {
            console.log(`Score: Skipping — not found: ${f}`)
            return false
          }
          return true
        })
        .map(toEntry)
    : [
        ...discoverSongs(resolve(cwd, 'examples')).map(toEntry),
        ...discoverSongs(resolve(cwd, 'songs')).map(toEntry),
      ]

  if (entries.length === 0) {
    console.log('Score: No song files found')
    return
  }

  console.log(`Score: Playlist — ${String(entries.length)} tracks queued`)

  const cleanup = (): void => {
    console.log('\nScore: Playlist stopped')
    process.exit(0)
  }

  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)

  await entries.reduce(async (prev, entry, i) => {
    await prev

    const meta = parseSongMeta(entry.file)
    const bars = entry.bars ?? totalBarsFromSections(meta.sections)
    const duration = barDurationSec(meta.bpm, bars)

    logEntry(i, entries.length, entry, meta, bars, duration)
    await playSongFile(entry.file, duration + 1)
    await pause(1)
  }, Promise.resolve())

  console.log('Score: Playlist complete')
}
