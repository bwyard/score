import { resolve } from 'node:path'
import { existsSync, watch as fsWatch } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { ScoreError } from '@score/core'
import type { SongDefinition } from '@score/dsl'
import { createScoreEngine, isInstrumentDescriptor, type ScoreEngine } from '../engine.js'
import { validateSongFile } from '../validator/SongValidator.js'
import { validateSongExport } from '../validator/SongExportValidator.js'

const GREEN  = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED    = '\x1b[31m'
const CYAN   = '\x1b[36m'
const RESET  = '\x1b[0m'

const log   = (msg: string): void => { console.log(`${GREEN}Score:${RESET} ${msg}`) }
const warn  = (msg: string): void => { console.log(`${YELLOW}Score:${RESET} ${msg}`) }
const error = (msg: string): void => { console.error(`${RED}Score:${RESET} ${msg}`) }

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
  log(`Playing — ${CYAN}${String(song.bpm)} BPM${RESET}${keyStr}${genreStr}`)
  if (song.arrangement.length > 0) {
    const sections = song.arrangement
      .map((s) => `${s.sectionType}(${String(s.bars)}b)`)
      .join(' → ')
    log(`Arrangement — ${sections}`)
  }
  log(`${String(song.tracks.length)} track(s) loaded`)
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
  let currentSong: SongDefinition = song
  currentEngine.start()
  log(`Audio running — ${CYAN}${String(currentEngine.bpm)} BPM${RESET} — Press Ctrl+C to stop${watch ? ` ${YELLOW}(watch mode)${RESET}` : ''}`)

  const keepAlive = setInterval(() => {}, 1000)

  const cleanup = (): void => {
    clearInterval(keepAlive)
    currentEngine.dispose()
    log('Stopped')
    process.exit(0)
  }

  if (watch) {
    let pendingReload = false
    let reloadVersion = 1

    // Mark that a reload is needed — actual swap happens at the next bar boundary
    // to prevent mid-beat glitches.
    fsWatch(resolved, () => {
      if (!pendingReload) {
        pendingReload = true
        warn('File changed — will reload at next bar boundary...')
      }
    })

    // Determine if a new song can be applied via live update (patch) or needs full swap.
    // Live update is safe when track count + instrument types are unchanged.
    // Full swap is needed for pattern, track structure, or effect chain changes.
    const resolveDescriptors = (song: SongDefinition) =>
      song.tracks
        .map(t => isInstrumentDescriptor(t) ? t : t.component as unknown)
        .filter(isInstrumentDescriptor)

    const isLivePatchable = (prev: SongDefinition, next: SongDefinition): boolean => {
      const prevDescs = resolveDescriptors(prev)
      const nextDescs = resolveDescriptors(next)
      if (prevDescs.length !== nextDescs.length) return false
      return prevDescs.every((d, i) => d.instrumentType === nextDescs[i]?.instrumentType)
    }

    // On each bar: apply file changes at a bar boundary to avoid mid-beat glitches.
    // Prefer live update() when structure is unchanged; fall back to full engine swap.
    currentEngine.onBar(() => {
      if (!pendingReload) return
      pendingReload = false

      void (async () => {
        try {
          const freshSong = await loadSong(resolved, reloadVersion++, trust)

          if (isLivePatchable(currentSong, freshSong)) {
            currentEngine.update(freshSong)
            currentSong = freshSong
            log(`Updated — ${CYAN}${String(freshSong.bpm)} BPM${RESET} (bar ${String(currentEngine.bars)})`)
          } else {
            const freshEngine = await createScoreEngine(freshSong)
            freshEngine.start()
            const oldEngine = currentEngine
            currentEngine = freshEngine
            currentSong = freshSong
            oldEngine.dispose()
            log(`Reloaded — ${CYAN}${String(freshEngine.bpm)} BPM${RESET}`)
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          error(`Reload failed — ${msg}`)
          warn('Keeping last good version')
        }
      })()
    })
  }

  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)
}
