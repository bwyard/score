import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { ScoreError } from '@score/core'
import type { SongDefinition } from '@score/dsl'
import { createScoreEngine } from '../engine.js'

export const play = async (args: string[]): Promise<void> => {
  const filePath = args[0]
  if (!filePath) {
    throw ScoreError('No song file specified', {
      received: undefined,
      fix: 'Usage: score play <song.js>',
      docs: 'https://score.dev/docs/cli/play',
    })
  }

  const resolved = resolve(process.cwd(), filePath)
  if (!existsSync(resolved)) {
    throw ScoreError(`Song file not found: ${filePath}`, {
      received: resolved,
      fix: 'Check the file path and try again',
      docs: 'https://score.dev/docs/cli/play',
    })
  }

  const mod: Record<string, unknown> = await import(pathToFileURL(resolved).href) as Record<string, unknown>
  const rawSong: unknown = mod['default']

  if (!rawSong || typeof rawSong !== 'object') {
    throw ScoreError('Song file must have a default export', {
      received: typeof rawSong,
      fix: "Add: export default Song({ bpm: 140, tracks: [...] }) at the end of your song file",
      docs: 'https://score.dev/docs/dsl/song',
    })
  }

  const song = rawSong as SongDefinition

  if (!song.bpm || song.bpm <= 0) {
    throw ScoreError('Song must have a valid bpm', {
      received: song.bpm,
      fix: 'Song({ bpm: 140, ... }) — bpm must be a positive number',
      docs: 'https://score.dev/docs/dsl/song',
    })
  }

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

  const engine = createScoreEngine(song)
  engine.start()
  console.log('Score: Audio running — Press Ctrl+C to stop')

  const keepAlive = setInterval(() => {}, 1000)

  const cleanup = (): void => {
    clearInterval(keepAlive)
    engine.dispose()
    console.log('\nScore: Stopped')
    process.exit(0)
  }

  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)
}
