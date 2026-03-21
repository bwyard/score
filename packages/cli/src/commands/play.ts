import { resolve } from 'node:path'
import { existsSync, watch as fsWatch } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { ScoreError } from '@score/core'
import type { SongDefinition } from '@score/dsl'
import { createScoreEngine, type ScoreEngine } from '../engine.js'
import { validateSongFile } from '../validator/SongValidator.js'
import { validateSongExport } from '../validator/SongExportValidator.js'

const loadSong = async (resolved: string, version: number, trust: boolean): Promise<SongDefinition> => {
  if (!trust) {
    validateSongFile(resolved)
  }

  const url = version === 0
    ? pathToFileURL(resolved).href
    : pathToFileURL(resolved).href + '?v=' + String(version)
  const mod = await import(url) as Record<string, unknown>
  const raw: unknown = mod['default']
  if (!raw || typeof raw !== 'object') {
    throw ScoreError('Song file must have a default export', {
      received: typeof raw,
      fix: 'Add: export default Song({ bpm: 140, tracks: [...] })',
      docs: 'https://score.dev/docs/dsl/song',
    })
  }

  validateSongExport(raw)

  const song = raw as SongDefinition
  if (!song.bpm || song.bpm <= 0) {
    throw ScoreError('Song must have a valid bpm', {
      received: song.bpm,
      fix: 'Song({ bpm: 140, ... }) — bpm must be a positive number',
      docs: 'https://score.dev/docs/dsl/song',
    })
  }
  return song
}

const logSong = (song: SongDefinition): void => {
  const keyStr   = song.key   ? ` — ${song.key}`   : ''
  const genreStr = song.genre ? ` — ${song.genre}` : ''
  console.log(`Score: Playing — ${String(song.bpm)} BPM${keyStr}${genreStr}`)
  if (song.arrangement.length > 0) {
    const sections = song.arrangement
      .map((s) => `${s.sectionType}(${String(s.bars)}b)`)
      .join(' → ')
    console.log(`Score: Arrangement — ${sections}`)
  }
  console.log(`Score: ${String(song.tracks.length)} track(s) loaded`)
}

export const play = async (args: string[]): Promise<void> => {
  const watch = args.includes('--watch') || args.includes('-w')
  const trust = args.includes('--trust') || args.includes('-t')
  const filePath = args.find(a => !a.startsWith('-'))

  if (!filePath) {
    throw ScoreError('No song file specified', {
      received: undefined,
      fix: 'Usage: score play <song.js>',
      docs: 'https://score.dev/docs/cli/play',
    })
  }

  const resolved = resolve(process.cwd(), filePath.replace(/\\/g, '/'))
  if (!existsSync(resolved)) {
    throw ScoreError(`Song file not found: ${filePath}`, {
      received: resolved,
      fix: 'Check the file path and try again',
      docs: 'https://score.dev/docs/cli/play',
    })
  }

  const song = await loadSong(resolved, 0, trust)
  logSong(song)

  let currentEngine: ScoreEngine = await createScoreEngine(song)
  currentEngine.start()
  console.log(`Score: Audio running — Press Ctrl+C to stop${watch ? ' (watch mode on)' : ''}`)

  const keepAlive = setInterval(() => {}, 1000)

  const cleanup = (): void => {
    clearInterval(keepAlive)
    currentEngine.dispose()
    console.log('\nScore: Stopped')
    process.exit(0)
  }

  if (watch) {
    let reloading = false
    let reloadVersion = 1

    fsWatch(resolved, () => {
      if (reloading) return
      reloading = true

      setTimeout(() => {
        void (async () => {
          try {
            console.log('\nScore: File changed — reloading...')
            currentEngine.dispose()
            const freshSong = await loadSong(resolved, reloadVersion++, trust)
            currentEngine = await createScoreEngine(freshSong)
            currentEngine.start()
            console.log(`Score: Reloaded — ${String(freshSong.bpm)} BPM`)
          } catch (err: unknown) {
            console.error('Score: Reload failed —', err instanceof Error ? err.message : String(err))
            console.error('Score: Keeping previous version')
          } finally {
            reloading = false
          }
        })()
      }, 300)
    })
  }

  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)
}
