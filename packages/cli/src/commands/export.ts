// score export — render a song to a WAV file.
// Uses OfflineAudioContext to schedule all note events upfront,
// then encodes the result as 16-bit PCM WAV.
//
// Usage:
//   score export <song.js>                      → <song>.wav (same directory)
//   score export <song.js> --out ./render.wav   → specified output path
//   score export <song.js> --bars 16            → render exactly 16 bars

import { resolve, dirname, basename, extname } from 'node:path'
import { existsSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { ScoreError } from '@score/core'
import type { SongDefinition } from '@score/dsl'
import { validateSongFile } from '../validator/SongValidator.js'
import { validateSongExport } from '../validator/SongExportValidator.js'
import { renderSong, encodeWav } from '../renderer.js'

const GREEN  = '\x1b[32m'
const CYAN   = '\x1b[36m'
const YELLOW = '\x1b[33m'
const RESET  = '\x1b[0m'

const log  = (msg: string): void => { console.log(`${GREEN}Score:${RESET} ${msg}`) }
const warn = (msg: string): void => { console.log(`${YELLOW}Score:${RESET} ${msg}`) }

const loadSong = async (resolved: string, trust: boolean): Promise<SongDefinition> => {
  if (!trust) validateSongFile(resolved)

  const url = pathToFileURL(resolved).href
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

/**
 * Render a song file to a WAV file on disk.
 *
 * @param args - CLI arguments. Expects a file path as the first non-flag argument.
 *   - `--out <path>` / `-o <path>` — output file path. Defaults to `<song>.wav` in the same directory.
 *   - `--bars <n>` / `-b <n>` — number of bars to render. Defaults to arrangement length or 8.
 *   - `--sr <n>` — sample rate in Hz. Defaults to `44100`.
 *   - `--trust` / `-t` — skip static analysis of the song file.
 *
 * @example
 * ```
 * score export my-track.js
 * score export my-track.js --out ./renders/my-track.wav --bars 32
 * ```
 *
 * @throws `ScoreError` if the file is missing or the song is invalid.
 */
export const exportSong = async (args: string[]): Promise<void> => {
  const trust    = args.includes('--trust') || args.includes('-t')
  const filePath = args.find(a => !a.startsWith('-'))

  if (!filePath) {
    throw ScoreError('No song file specified', {
      received: undefined,
      fix: 'Usage: score export <song.js>',
      docs: 'https://score.dev/docs/cli/export',
    })
  }

  const resolved = resolve(process.cwd(), filePath.replace(/\\/g, '/'))
  if (!existsSync(resolved)) {
    throw ScoreError(`Song file not found: ${filePath}`, {
      received: resolved,
      fix: 'Check the file path and try again',
      docs: 'https://score.dev/docs/cli/export',
    })
  }

  // Parse --out / -o
  const outFlagIdx = args.findIndex(a => a === '--out' || a === '-o')
  const outArg     = outFlagIdx !== -1 ? args[outFlagIdx + 1] : undefined
  const defaultOut = resolve(
    dirname(resolved),
    `${basename(filePath, extname(filePath))}.wav`,
  )
  const outPath = outArg ? resolve(process.cwd(), outArg.replace(/\\/g, '/')) : defaultOut

  // Parse --bars / -b
  const barsFlagIdx = args.findIndex(a => a === '--bars' || a === '-b')
  const barsArg     = barsFlagIdx !== -1 ? args[barsFlagIdx + 1] : undefined
  const bars        = barsArg !== undefined ? parseInt(barsArg, 10) : undefined
  if (bars !== undefined && (isNaN(bars) || bars <= 0)) {
    throw ScoreError('--bars must be a positive integer', {
      received: barsArg,
      fix: 'score export song.js --bars 16',
      docs: 'https://score.dev/docs/cli/export',
    })
  }

  // Parse --sr
  const srFlagIdx = args.findIndex(a => a === '--sr')
  const srArg     = srFlagIdx !== -1 ? args[srFlagIdx + 1] : undefined
  const sampleRate = srArg !== undefined ? parseInt(srArg, 10) : 44100
  if (isNaN(sampleRate) || sampleRate <= 0) {
    throw ScoreError('--sr must be a positive integer', {
      received: srArg,
      fix: 'score export song.js --sr 44100',
      docs: 'https://score.dev/docs/cli/export',
    })
  }

  log(`Loading ${CYAN}${filePath}${RESET}...`)
  const song = await loadSong(resolved, trust)

  const arrangementBars = song.arrangement.reduce((sum, s) => sum + s.bars, 0)
  const totalBars = bars ?? (arrangementBars > 0 ? arrangementBars : 8)
  const stepSec   = 60 / song.bpm / 4
  const durationSec = totalBars * 16 * stepSec
  const mins = Math.floor(durationSec / 60)
  const secs  = Math.round(durationSec % 60)

  log(`Rendering ${String(totalBars)} bars (~${String(mins)}:${String(secs).padStart(2, '0')}) at ${String(sampleRate)} Hz...`)

  if (song.tracks.some(t => {
    const d = 'instrumentType' in t ? t : t.component
    return 'instrumentType' in d && (d.instrumentType === 'theremin' || d.instrumentType === 'sax')
  })) {
    warn('Theremin and Sax are continuous instruments and will not be included in the export.')
  }

  const buffer = await renderSong(song, { bars: totalBars, sampleRate })
  const wav    = encodeWav(buffer)

  writeFileSync(outPath, wav)

  const sizeMb = (wav.length / 1024 / 1024).toFixed(1)
  log(`Exported → ${CYAN}${outPath}${RESET} (${sizeMb} MB)`)
}
