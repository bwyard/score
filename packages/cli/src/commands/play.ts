import { resolve } from 'node:path'
import { existsSync, watch as fsWatch } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { ScoreError } from '@score/core'
import type { SongDefinition } from '@score/dsl'
import { createScoreEngine, isInstrumentDescriptor } from '../engine.js'
import { validateSongFile } from '../validator/SongValidator.js'
import { validateSongExport } from '../validator/SongExportValidator.js'
import { parseFlags } from '../flags.js'

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

const printUsage = (): void => {
  console.log('Score play — play a song file\n')
  console.log('Usage:')
  console.log('  score play <song.js> [options]\n')
  console.log('Options:')
  console.log('  -w, --watch   Hot-reload on every file save')
  console.log('  -t, --trust   Skip AST security scan (faster for trusted files)')
  console.log('  -h, --help    Show this help')
}

export const play = async (args: string[]): Promise<void> => {
  const { values, positionals } = parseFlags(args, {
    watch: { type: 'boolean', short: 'w', default: false },
    trust: { type: 'boolean', short: 't', default: false },
  }, printUsage)

  const watch = values['watch'] === true
  const trust = values['trust'] === true
  const filePath = positionals[0]

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

  const state = {
    engine: await createScoreEngine(song),
    song,
  }
  state.engine.start()
  log(`Audio running — ${CYAN}${String(state.engine.bpm)} BPM${RESET} — Press Ctrl+C to stop${watch ? ` ${YELLOW}(watch mode)${RESET}` : ''}`)

  const keepAlive = setInterval(() => {}, 1000)

  const cleanup = (): void => {
    clearInterval(keepAlive)
    state.engine.dispose()
    log('Stopped')
    process.exit(0)
  }

  if (watch) {
    const reload = { pending: false, version: 1 }

    // Mark that a reload is needed — actual swap happens at the next bar boundary
    // to prevent mid-beat glitches.
    fsWatch(resolved, () => {
      if (!reload.pending) {
        reload.pending = true
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
    state.engine.onBar(() => {
      if (!reload.pending) return
      reload.pending = false

      void (async () => {
        try {
          const freshSong = await loadSong(resolved, reload.version++, trust)

          if (isLivePatchable(state.song, freshSong)) {
            state.engine.update(freshSong)
            state.song = freshSong
            log(`Updated — ${CYAN}${String(freshSong.bpm)} BPM${RESET} (bar ${String(state.engine.bars)})`)
          } else {
            const freshEngine = await createScoreEngine(freshSong)
            freshEngine.start()
            const oldEngine = state.engine
            state.engine = freshEngine
            state.song = freshSong
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
