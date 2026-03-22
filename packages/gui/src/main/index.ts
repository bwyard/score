import { app, BrowserWindow, globalShortcut, ipcMain, shell } from 'electron'
import path                                          from 'node:path'
import { writeFileSync, unlinkSync, mkdirSync }      from 'node:fs'
import { pathToFileURL }                             from 'node:url'
import { createScoreEngine }                         from '@score/cli/engine'
import { Kick, Synth, Track, Song }                  from '@score/dsl'
import type { SongDefinition, InstrumentDescriptor } from '@score/dsl'
import type { ScoreEngine }                          from '@score/cli/engine'
import type { MainToRenderer, RendererToMain }       from './ipc-types.js'

// ── Default starter song ────────────────────────────────────────────────────
// Used when entering any mode — mirrors the Live Code textarea starter.
// C2 = 65.41 Hz. Pattern: 8-step binary array.

const defaultSong = (): SongDefinition => Song({
  bpm:    128,
  tracks: [
    Track(Kick({
      pattern: [1, 0, 0, 0, 1, 0, 0, 0],
      volume:  0.9,
    })),
    Track(Synth({
      wave:      'sawtooth',
      frequency: 65.41,
      pattern:   [1, 0, 1, 0, 0, 1, 0, 0],
      filter:    { type: 'lowpass', frequency: 400 },
      gain:      0.7,
    })),
  ],
})

// ── Engine state ─────────────────────────────────────────────────────────────

type EngineSlot = {
  engine:  ScoreEngine
  playing: boolean
  bpm:     number
  bars:    number
}

// One engine slot at a time — reinitialised on mode change.
// Wrapped in const objects so references are never reassigned (no let).
const slotRef: { value: EngineSlot | null }        = { value: null }
const winRef:  { value: BrowserWindow | null }     = { value: null }

const send = <K extends keyof MainToRenderer>(channel: K, payload: MainToRenderer[K]): void => {
  const win = winRef.value
  if (!win || win.isDestroyed()) return
  win.webContents.send(channel, payload)
}

const pushState = (): void => {
  const slot = slotRef.value
  if (!slot) return
  send('engine:state', { playing: slot.playing, bpm: slot.bpm, bars: slot.bars })
}

const pushSong = (song: SongDefinition): void => {
  const tracks = song.tracks.map(t => {
    // component is AudioComponent at the type level, but always an InstrumentDescriptor at runtime
    const desc = t.component as InstrumentDescriptor
    const pattern = (desc.props as { pattern?: ReadonlyArray<number | string> }).pattern ?? []
    return { name: desc.instrumentType, type: desc.instrumentType, pattern }
  })
  send('song:update', { tracks })
}

const teardown = (): void => {
  const slot = slotRef.value
  if (!slot) return
  try {
    slot.engine.stop()
    slot.engine.dispose()
  } catch { /* ignore disposal errors */ }
  slotRef.value = null
}

const boot = async (song: SongDefinition): Promise<void> => {
  teardown()
  const engine = await createScoreEngine(song)
  slotRef.value = { engine, playing: false, bpm: song.bpm, bars: 0 }
  engine.onBar(() => {
    const s = slotRef.value
    if (!s) return
    s.bars = engine.bars
    pushState()
  })
  pushState()
  pushSong(song)
}

// ── Window factory ─────────────────────────────────────────────────────────────

const createWindow = (): BrowserWindow => {
  const win = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  900,
    minHeight: 600,
    backgroundColor: '#0c0c0e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload:          path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  })

  // BOUNDARY — IO: electron-vite sets ELECTRON_RENDERER_URL in dev; use loadFile in prod
  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Open external links in the OS browser, not in-app
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

app.on('ready', () => {
  winRef.value = createWindow()
  // F12 toggles devtools — off by default, no auto-open
  globalShortcut.register('F12', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.webContents.toggleDevTools()
  })
})

app.on('window-all-closed', () => {
  teardown()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    winRef.value = createWindow()
  }
})

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.on('mode:selected', (_event, payload: RendererToMain['mode:selected']) => {
  // BOUNDARY — IO: boot engine on mode selection, push initial state
  console.log('[score-studio] mode selected', payload)
  void boot(defaultSong())
})

ipcMain.on('transport:play', () => {
  const slot = slotRef.value
  if (!slot || slot.playing) return
  slot.engine.start()
  slot.playing = true
  pushState()
})

ipcMain.on('transport:stop', () => {
  const slot = slotRef.value
  if (!slot || !slot.playing) return
  slot.engine.stop()
  slot.playing = false
  slot.bars    = 0
  pushState()
})

ipcMain.on('transport:bpm-set', (_event, { bpm }: RendererToMain['transport:bpm-set']) => {
  const slot = slotRef.value
  if (!slot) return
  slot.engine.patch({ bpm })
  slot.bpm = bpm
  pushState()
})

// BOUNDARY — IO: eval receives code string, writes temp file, imports it, updates engine
// Temp file written adjacent to built output so @score/dsl resolves via workspace symlinks.
ipcMain.on('engine:eval', (_event, { code }: RendererToMain['engine:eval']) => {
  const evalDir = path.join(__dirname, '..', '..', 'tmp')
  mkdirSync(evalDir, { recursive: true })
  const tmp = path.join(evalDir, `score-eval-${String(Date.now())}.mjs`)

  try {
    writeFileSync(tmp, code, 'utf8')
  } catch (err) {
    console.error('[score-studio] eval write error', err)
    send('error:report', { message: 'Failed to write eval temp file.' })
    return
  }

  void import(pathToFileURL(tmp).href).then((mod: { default?: SongDefinition }) => {
    try { unlinkSync(tmp) } catch { /* ignore cleanup errors */ }
    const song = mod.default
    if (!song || typeof song !== 'object') return
    const slot = slotRef.value
    if (slot) {
      slot.engine.update(song)
      pushSong(song)
    } else {
      void boot(song)
      // boot() calls pushSong internally
    }
  }).catch((err: unknown) => {
    try { unlinkSync(tmp) } catch { /* ignore cleanup errors */ }
    console.error('[score-studio] eval error', err)
    send('error:report', {
      message: err instanceof Error ? err.message : String(err),
    })
  })
})
