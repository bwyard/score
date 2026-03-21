// playlist.ts — Play all examples (8-bar sample) and songs (full form) in sequence
//
// Usage: score playlist
//        score playlist --examples   Only examples
//        score playlist --songs      Only full songs

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

// ── Playback ────────────────────────────────────────────────────────────────

const cliEntry = resolve(
  fileURLToPath(import.meta.url), '..', '..', 'index.js',
)

const playSongFile = (
  filePath: string,
  durationSec: number,
  state: { child: ChildProcess | null },
): Promise<void> =>
  new Promise((res) => {
    const child = spawn(
      'pw-jack',
      ['node', cliEntry, 'play', '--trust', filePath],
      { stdio: 'inherit', env: { ...process.env, NODE_NO_WARNINGS: '1' } },
    )

    state.child = child
    const timer = setTimeout(() => child.kill('SIGTERM'), durationSec * 1000)

    child.on('close', () => {
      clearTimeout(timer)
      state.child = null
      res()
    })
  })

// ── Main ────────────────────────────────────────────────────────────────────

export const playlist = async (args: string[]): Promise<void> => {
  const onlyExamples = args.includes('--examples')
  const onlySongs = args.includes('--songs')
  const cwd = process.cwd()

  const examplesDir = resolve(cwd, 'examples')
  const songsDir = resolve(cwd, 'songs')

  const entries: PlaylistEntry[] = [
    ...(!onlySongs
      ? discoverSongs(examplesDir).map((file) => {
          const meta = parseSongMeta(file)
          return { file, bars: hasArrangement(meta) ? null : 8 } as PlaylistEntry
        })
      : []),
    ...(!onlyExamples
      ? discoverSongs(songsDir).map((file) => ({ file, bars: null }) as PlaylistEntry)
      : []),
  ]

  if (entries.length === 0) {
    console.log('Score: No song files found in examples/ or songs/')
    return
  }

  console.log(`Score: Playlist mode — ${String(entries.length)} tracks queued`)

  const state = Object.seal({ child: null as ChildProcess | null })

  const cleanup = (): void => {
    if (state.child) state.child.kill('SIGTERM')
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
    const mode = entry.bars === null ? 'full form' : '8-bar sample'
    const keyStr = meta.key ? ` — ${meta.key}` : ''

    console.log(`Score: [${String(i + 1)}/${String(entries.length)}] ${entry.file}`)
    console.log(`Score: ${String(meta.bpm)} BPM${keyStr} — ${String(bars)} bars — ${formatDuration(duration)} — ${mode}`)

    if (entry.bars === null && meta.sections.length > 0) {
      const flow = meta.sections
        .map((s) => `${s.sectionType}(${String(s.bars)}b)`)
        .join(' → ')
      console.log(`Score: Arrangement — ${flow}`)
    }

    await playSongFile(entry.file, duration + 1, state)
    await pause(1)
  }, Promise.resolve())

  console.log('Score: Playlist complete')
}
