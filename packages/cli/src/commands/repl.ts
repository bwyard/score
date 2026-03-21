// score repl — interactive live coding REPL
//
// Starts Score with a song file (or empty) and opens an interactive prompt.
// Commands let you inspect state and reload songs without restarting.
// Bar-boundary hot swap (keep-last-good) is active for loaded files.
//
// Full expression eval and surgical patch() are Phase 11 Level 2.
//
// Usage:
//   score repl                      Start empty REPL
//   score repl ./song.js --trust    Start with a song loaded

import { createInterface } from 'node:readline'
import { existsSync, watch as fsWatch, type FSWatcher } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ScoreError } from '@score/core'
import type { SongDefinition } from '@score/dsl'
import { createScoreEngine, type ScoreEngine } from '../engine.js'
import { validateSongFile } from '../validator/SongValidator.js'
import { validateSongExport } from '../validator/SongExportValidator.js'

// ── Terminal colours ──────────────────────────────────────────────────────────

const C = {
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
  reset:  '\x1b[0m',
} as const

const log   = (msg: string): void => { process.stdout.write(`${C.green}score>${C.reset} ${msg}\n`) }
const warn  = (msg: string): void => { process.stdout.write(`${C.yellow}score>${C.reset} ${msg}\n`) }
const err   = (msg: string): void => { process.stderr.write(`${C.red}score>${C.reset} ${msg}\n`) }
const info  = (msg: string): void => { process.stdout.write(`${C.dim}${msg}${C.reset}\n`) }

const HELP = `
${C.cyan}Score REPL — live coding mode${C.reset}

Commands:
  ${C.green}status${C.reset}             Show current song state
  ${C.green}load <file>${C.reset}        Load and play a song file
  ${C.green}reload${C.reset}             Reload the current song file
  ${C.green}stop${C.reset}               Stop audio
  ${C.green}play${C.reset}               Resume audio
  ${C.green}help${C.reset}               Show this help
  ${C.green}.exit${C.reset} / ${C.green}Ctrl+C${C.reset}    Exit

${C.dim}Tip: run with a file to start immediately — score repl ./song.js${C.reset}
${C.dim}Full expression eval (patch/update) arrives in Phase 11 Level 2.${C.reset}
`

// ── REPL state ────────────────────────────────────────────────────────────────

type ReplState = {
  readonly engine:        ScoreEngine | null
  readonly file:          string | null
  readonly version:       number
  readonly pendingReload: boolean
  readonly watcher:       FSWatcher | null
}

const emptyState: ReplState = {
  engine:        null,
  file:          null,
  version:       0,
  pendingReload: false,
  watcher:       null,
}

// ── Song loading ──────────────────────────────────────────────────────────────

const loadSong = async (filePath: string, version: number, trust: boolean): Promise<SongDefinition> => {
  if (!trust) validateSongFile(filePath)
  const url = pathToFileURL(filePath).href + (version > 0 ? `?v=${String(version)}` : '')
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

// ── REPL entry point ──────────────────────────────────────────────────────────

export const repl = async (args: string[]): Promise<void> => {
  const trust   = args.includes('--trust') || args.includes('-t')
  const fileArg = args.find(a => !a.startsWith('-'))

  // Single mutable state reference — all updates produce a new ReplState
  let state: ReplState = emptyState

  // Register bar-boundary watch on the currently loaded file.
  // Returns the new state with watcher wired in.
  const withWatch = (filePath: string, engine: ScoreEngine): ReplState => {
    state.watcher?.close()
    const watcher = fsWatch(filePath, () => {
      if (!state.pendingReload) {
        state = { ...state, pendingReload: true }
        warn('File changed — will reload at next bar boundary...')
      }
    })

    engine.onBar(() => {
      if (!state.pendingReload || !state.file) return
      state = { ...state, pendingReload: false }
      void (async () => {
        try {
          const freshSong = await loadSong(state.file as string, state.version, trust)
          const freshEngine = await createScoreEngine(freshSong)
          freshEngine.start()
          const old = state.engine
          state = { ...state, engine: freshEngine, version: state.version + 1 }
          old?.dispose()
          log(`Reloaded — ${C.cyan}${String(freshEngine.bpm)} BPM${C.reset}`)
        } catch (e: unknown) {
          err(`Reload failed — ${e instanceof Error ? e.message : String(e)}`)
          warn('Keeping last good version')
        }
      })()
    })

    return { ...state, watcher }
  }

  const loadAndPlay = async (filePath: string): Promise<void> => {
    const resolved = resolve(process.cwd(), filePath.replace(/\\/g, '/'))
    if (!existsSync(resolved)) { err(`File not found: ${filePath}`); return }

    try {
      const song = await loadSong(resolved, state.version, trust)
      const engine = await createScoreEngine(song)
      engine.start()
      state.engine?.dispose()
      state = withWatch(resolved, engine)
      state = { ...state, engine, file: resolved, version: state.version + 1 }
      log(`Loaded ${C.cyan}${filePath}${C.reset} — ${String(song.bpm)} BPM, ${String(song.tracks.length)} track(s)`)
    } catch (e: unknown) {
      err(`Load failed — ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (fileArg) await loadAndPlay(fileArg)

  info('\nScore REPL — type help for commands\n')

  const rl = createInterface({
    input:    process.stdin,
    output:   process.stdout,
    prompt:   `${C.green}score${C.reset} ${C.dim}›${C.reset} `,
    terminal: true,
  })

  rl.prompt()

  rl.on('line', (line: string) => {
    const parts  = line.trim().split(/\s+/)
    const cmd    = parts[0] ?? ''
    const cmdArg = parts.slice(1).join(' ')

    switch (cmd) {
      case 'help':
        process.stdout.write(HELP)
        break

      case 'status':
        if (!state.engine || !state.file) {
          warn('No song loaded. Use: load <file>')
        } else {
          log(`File:  ${C.cyan}${state.file}${C.reset}`)
          log(`BPM:   ${C.cyan}${String(state.engine.bpm)}${C.reset}`)
          log(`Watch: ${C.cyan}active${C.reset}`)
        }
        break

      case 'load':
        if (!cmdArg) { err('Usage: load <file>'); break }
        void loadAndPlay(cmdArg)
        break

      case 'reload':
        if (!state.file) { err('No file loaded'); break }
        void loadAndPlay(state.file)
        break

      case 'stop':
        if (!state.engine) { warn('Nothing playing'); break }
        state.engine.stop()
        log('Stopped')
        break

      case 'play':
        if (!state.engine) { warn('No song loaded. Use: load <file>'); break }
        state.engine.start()
        log('Playing')
        break

      case '.exit':
      case 'exit':
      case '':
        if (cmd !== '') rl.close()
        break

      default:
        warn(`Unknown command: ${cmd}. Type ${C.green}help${C.reset} for commands.`)
        break
    }

    rl.prompt()
  })

  rl.on('close', () => {
    state.watcher?.close()
    state.engine?.dispose()
    log('Goodbye')
    process.exit(0)
  })
}
