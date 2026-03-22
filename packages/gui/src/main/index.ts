import { app, BrowserWindow, globalShortcut, ipcMain, shell } from 'electron'
import path                                    from 'node:path'
import { tmpdir }                              from 'node:os'
import { writeFileSync, unlinkSync }            from 'node:fs'
import { pathToFileURL }                       from 'node:url'
import { createScoreEngine }         from '@score/cli/engine'
import { Kick, Synth, Track, Song }  from '@score/dsl'
import type { SongDefinition }       from '@score/dsl'
import type { ScoreEngine }          from '@score/cli/engine'
import type { RendererToMain }       from './ipc-types.js'

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
let slot: EngineSlot | null = null
let mainWindow: BrowserWindow | null = null

const pushState = (): void => {
  if (!mainWindow || mainWindow.isDestroyed() || !slot) return
  mainWindow.webContents.send('engine:state', {
    playing: slot.playing,
    bpm:     slot.bpm,
    bars:    slot.bars,
  })
}

const teardown = (): void => {
  if (!slot) return
  try {
    slot.engine.stop()
    slot.engine.dispose()
  } catch { /* ignore disposal errors */ }
  slot = null
}

const boot = async (song: SongDefinition): Promise<void> => {
  teardown()
  const engine = await createScoreEngine(song)
  slot = { engine, playing: false, bpm: song.bpm, bars: 0 }
  engine.onBar(() => {
    if (!slot) return
    slot.bars = engine.bars
    pushState()
  })
  pushState()
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
  mainWindow = createWindow()
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
    mainWindow = createWindow()
  }
})

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.on('mode:selected', (_event, payload: RendererToMain['mode:selected']) => {
  // BOUNDARY — IO: boot engine on mode selection, push initial state
  console.log('[score-studio] mode selected', payload)
  void boot(defaultSong())
})

ipcMain.on('transport:play', () => {
  if (!slot) return
  slot.engine.start()
  slot.playing = true
  pushState()
})

ipcMain.on('transport:stop', () => {
  if (!slot) return
  slot.engine.stop()
  slot.playing = false
  slot.bars    = 0
  pushState()
})

ipcMain.on('transport:bpm-set', (_event, { bpm }: RendererToMain['transport:bpm-set']) => {
  if (!slot) return
  slot.engine.patch({ bpm })
  slot.bpm = bpm
  pushState()
})

// BOUNDARY — IO: eval receives code string, writes temp file, imports it, updates engine
ipcMain.on('engine:eval', (_event, { code }: RendererToMain['engine:eval']) => {
  const tmp = path.join(tmpdir(), `score-eval-${String(Date.now())}.mjs`)
  try {
    writeFileSync(tmp, code, 'utf8')
    void import(pathToFileURL(tmp).href).then((mod: { default?: SongDefinition }) => {
      try { unlinkSync(tmp) } catch { /* ignore cleanup errors */ }
      const song = mod.default
      if (!song || typeof song !== 'object') return
      if (slot) {
        slot.engine.update(song)
      } else {
        void boot(song)
      }
    }).catch((err: unknown) => {
      try { unlinkSync(tmp) } catch { /* ignore cleanup errors */ }
      console.error('[score-studio] eval error', err)
      mainWindow?.webContents.send('error:report', {
        message: err instanceof Error ? err.message : String(err),
      })
    })
  } catch (err) {
    console.error('[score-studio] eval write error', err)
  }
})
