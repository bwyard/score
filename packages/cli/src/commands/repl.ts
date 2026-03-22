import { createInterface, type Interface as ReadlineInterface } from 'node:readline'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { SongDefinition } from '@score/dsl'
import { createScoreEngine, type ScoreEngine, type PatchProps } from '../engine.js'

// ── Types ─────────────────────────────────────────────────────────────────────

type ReplState = {
  readonly loadedFile: string | null
  readonly song: SongDefinition | null
  readonly engine: ScoreEngine | null
  readonly playing: boolean
}

// ── Help text ─────────────────────────────────────────────────────────────────

const HELP_TEXT = `
Score REPL — interactive session

Commands:
  load <file>      Load a song file (.js / .mjs)
  play             Start playback
  stop             Stop playback
  status           Show current status (bpm, bar counter)
  patch bpm=<n>    Live-patch BPM without reloading
  patch vol=<n>    Live-patch master volume (0–1)
  help             Show this help
  exit / .exit     Quit the REPL
`.trim()

// ── Song loader ────────────────────────────────────────────────────────────────

const loadSongFile = async (filePath: string): Promise<SongDefinition | null> => {
  const resolved = resolve(process.cwd(), filePath.replace(/\\/g, '/'))
  if (!existsSync(resolved)) {
    console.log(`Score REPL: File not found — ${filePath}`)
    return null
  }

  const url = pathToFileURL(resolved).href + '?v=' + String(Date.now())
  const mod = await import(url) as Record<string, unknown>
  const raw: unknown = mod['default']

  if (!raw || typeof raw !== 'object') {
    console.log(`Score REPL: Song file must have a default export (received: ${typeof raw})`)
    return null
  }

  const song = raw as SongDefinition
  if (!song.bpm || song.bpm <= 0) {
    console.log(`Score REPL: Song must have a valid bpm`)
    return null
  }

  return song
}

// ── Command handlers ──────────────────────────────────────────────────────────

const handleStatus = (state: ReplState): void => {
  if (!state.song || !state.loadedFile) {
    console.log('Score REPL: No song loaded')
    return
  }
  const playingStr = state.playing ? 'playing' : 'stopped'
  const barsStr    = state.engine  ? ` — bar ${String(state.engine.bars)}` : ''
  console.log(`Score REPL: ${state.loadedFile} — ${String(state.song.bpm)} BPM — ${playingStr}${barsStr}`)
}

const handleLoad = async (
  args: string,
  state: ReplState,
): Promise<ReplState> => {
  const filePath = args.trim()
  if (!filePath) {
    console.log('Score REPL: Usage — load <file>')
    return state
  }

  if (state.engine) {
    state.engine.dispose()
  }

  const song = await loadSongFile(filePath)
  if (!song) {
    return { ...state, loadedFile: null, song: null, engine: null, playing: false }
  }

  console.log(`Score REPL: Loaded — ${filePath} (${String(song.bpm)} BPM)`)
  return { ...state, loadedFile: filePath, song, engine: null, playing: false }
}

const handlePlay = async (state: ReplState): Promise<ReplState> => {
  if (!state.song) {
    console.log('Score REPL: No song loaded — use load <file> first')
    return state
  }

  if (state.playing && state.engine) {
    console.log('Score REPL: Already playing')
    return state
  }

  const engine = await createScoreEngine(state.song)
  engine.start()
  console.log(`Score REPL: Playing — ${String(state.song.bpm)} BPM`)
  return { ...state, engine, playing: true }
}

const handleStop = (state: ReplState): ReplState => {
  if (!state.playing || !state.engine) {
    console.log('Score REPL: Nothing is playing')
    return state
  }

  state.engine.stop()
  console.log('Score REPL: Stopped')
  return { ...state, playing: false }
}

const handlePatch = (args: string, state: ReplState): ReplState => {
  if (!state.engine || !state.playing) {
    console.log('Score REPL: Nothing playing — use play first')
    return state
  }

  // Parse key=value pairs: bpm=140 vol=0.8
  const props: PatchProps = {}
  const patchProps: { bpm?: number; masterVolume?: number } = {}
  const parts = args.trim().split(/\s+/)
  for (const part of parts) {
    const [key, val] = part.split('=')
    if (!key || val === undefined) continue
    const num = parseFloat(val)
    if (isNaN(num)) {
      console.log(`Score REPL: Invalid value for ${key}: ${val}`)
      return state
    }
    if (key === 'bpm')        patchProps.bpm = num
    else if (key === 'vol')   patchProps.masterVolume = num
    else {
      console.log(`Score REPL: Unknown patch key: ${key}. Supported: bpm, vol`)
      return state
    }
  }

  Object.assign(props, patchProps)
  if (Object.keys(patchProps).length === 0) {
    console.log('Score REPL: No patch keys given. Try: patch bpm=140 or patch vol=0.8')
    return state
  }

  state.engine.patch(props)
  const parts2 = Object.entries(patchProps).map(([k, v]) => `${k}=${String(v)}`).join(' ')
  console.log(`Score REPL: Patched — ${parts2}`)
  return state
}

// ── Main dispatch ─────────────────────────────────────────────────────────────

const dispatch = async (
  line: string,
  state: ReplState,
  rl: ReadlineInterface,
): Promise<ReplState> => {
  const trimmed = line.trim()
  if (!trimmed) return state

  const spaceIdx = trimmed.indexOf(' ')
  const cmd  = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
  const rest = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1)

  switch (cmd) {
    case 'status':
      handleStatus(state)
      return state

    case 'load':
      return handleLoad(rest, state)

    case 'play':
      return handlePlay(state)

    case 'stop':
      return handleStop(state)

    case 'patch':
      return handlePatch(rest, state)

    case 'help':
      console.log(HELP_TEXT)
      return state

    case 'exit':
    case '.exit':
      rl.close()
      return state

    default:
      console.log(`Score REPL: Unknown command — ${cmd}`)
      console.log('Type "help" for available commands.')
      return state
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Launches the Score interactive REPL session.
 *
 * Opens a readline prompt that accepts song-management commands.
 * Type `help` inside the REPL for the full command list.
 *
 * @param _args - CLI arguments (reserved; currently unused)
 * @returns A promise that resolves when the REPL session ends
 * @example
 * // From the CLI:
 * // score repl
 */
export const repl = (_args: string[]): Promise<void> =>
  new Promise((resolve) => {
    const rl = createInterface({
      input:  process.stdin,
      output: process.stdout,
      prompt: 'score> ',
    })

    let state: ReplState = {
      loadedFile: null,
      song:       null,
      engine:     null,
      playing:    false,
    }

    console.log('Score REPL — type "help" for commands, "exit" to quit.')
    rl.prompt()

    rl.on('line', (line: string) => {
      void dispatch(line, state, rl).then((nextState) => {
        state = nextState
        rl.prompt()
      })
    })

    rl.on('close', () => {
      if (state.engine) {
        state.engine.dispose()
      }
      console.log('Score REPL: Goodbye.')
      resolve()
    })
  })
