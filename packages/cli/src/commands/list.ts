// score list — display metadata and track info for a song file.
// Loads the song without starting audio. Prints bpm, key, genre,
// arrangement, and per-track details in a readable format.

import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { ScoreError } from '@score/core'
import type { SongDefinition, InstrumentDescriptor } from '@score/dsl'
import { validateSongFile } from '../validator/SongValidator.js'
import { validateSongExport } from '../validator/SongExportValidator.js'
import { isInstrumentDescriptor } from '../engine.js'

const CYAN  = '\x1b[36m'
const GREEN = '\x1b[32m'
const DIM   = '\x1b[2m'
const RESET = '\x1b[0m'
const BOLD  = '\x1b[1m'

const header = (msg: string): void => { console.log(`\n${BOLD}${msg}${RESET}`) }
const row    = (label: string, value: string): void => {
  console.log(`  ${DIM}${label.padEnd(14)}${RESET}${value}`)
}

/**
 * Display metadata and structure of a song file without starting audio playback.
 *
 * @param args - CLI arguments. Expects a file path as the first non-flag argument.
 *   Flags: `--trust` / `-t` skip static analysis of the song file.
 *
 * @example
 * ```
 * score list my-track.js
 * score list my-track.js --trust
 * ```
 */
export const list = async (args: string[]): Promise<void> => {
  const trust    = args.includes('--trust') || args.includes('-t')
  const filePath = args.find(a => !a.startsWith('-'))

  if (!filePath) {
    throw ScoreError('No song file specified', {
      received: undefined,
      fix: 'Usage: score list <song.js>',
      docs: 'https://score.dev/docs/cli/list',
    })
  }

  const resolved = resolve(process.cwd(), filePath.replace(/\\/g, '/'))
  if (!existsSync(resolved)) {
    throw ScoreError(`Song file not found: ${filePath}`, {
      received: resolved,
      fix: 'Check the file path and try again',
      docs: 'https://score.dev/docs/cli/list',
    })
  }

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

  // ── Summary ──────────────────────────────────────────────────────────────
  header(`${GREEN}Score${RESET} — ${CYAN}${filePath}${RESET}`)
  row('BPM',   String(song.bpm))
  row('Key',   song.key   ?? '—')
  row('Genre', song.genre ?? '—')
  row('Tracks', String(song.tracks.length))

  // ── Arrangement ───────────────────────────────────────────────────────────
  if (song.arrangement.length > 0) {
    const totalBars = song.arrangement.reduce((sum, s) => sum + s.bars, 0)
    const barsPerSec = song.bpm / 4
    const totalSec = totalBars / barsPerSec
    const mins = Math.floor(totalSec / 60)
    const secs = Math.round(totalSec % 60)
    row('Arrangement', `${String(totalBars)} bars (~${String(mins)}:${String(secs).padStart(2, '0')})`)

    header('Arrangement')
    song.arrangement.forEach(section => {
      const trackNames = section.tracks
        .map(t => isInstrumentDescriptor(t) ? t : t.component)
        .filter(isInstrumentDescriptor)
        .map((d: InstrumentDescriptor) => d.instrumentType)
        .join(', ')
      console.log(`  ${DIM}${section.sectionType.padEnd(10)}${RESET}${String(section.bars).padEnd(4)} bars  ${DIM}[${trackNames}]${RESET}`)
    })
  }

  // ── Tracks ────────────────────────────────────────────────────────────────
  header('Tracks')
  song.tracks.forEach((track, i) => {
    const desc: InstrumentDescriptor | null = isInstrumentDescriptor(track)
      ? track
      : (isInstrumentDescriptor(track.component) ? track.component : null)
    if (!desc) return

    const props = desc.props as Record<string, unknown>
    const extras: string[] = []

    if (typeof props['wave']   === 'string') extras.push(`wave:${props['wave']}`)
    if (typeof props['volume'] === 'number') extras.push(`vol:${String(props['volume'])}`)
    if (typeof props['gain']   === 'number') extras.push(`gain:${String(props['gain'])}`)
    if (typeof props['note']   === 'string') extras.push(`note:${props['note']}`)
    if (Array.isArray(props['notes']))       extras.push(`notes:[${(props['notes'] as string[]).join(',')}]`)
    if (typeof props['path']   === 'string') extras.push(`path:${props['path']}`)

    const effects = Array.isArray(props['effects']) ? props['effects'] as unknown[] : []
    const fxStr = effects.length > 0
      ? ` ${DIM}+${String(effects.length)} fx${RESET}`
      : ''

    const extrasStr = extras.length > 0 ? `  ${DIM}${extras.join('  ')}${RESET}` : ''
    console.log(`  ${String(i + 1).padStart(2)}.  ${CYAN}${desc.instrumentType.padEnd(10)}${RESET}${extrasStr}${fxStr}`)
  })

  console.log('')
}
