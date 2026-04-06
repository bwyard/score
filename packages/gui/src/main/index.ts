import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path                                          from 'node:path'
import { mkdirSync, readFileSync, writeFileSync }    from 'node:fs'
import vm                                            from 'node:vm'
import { registerShortcuts }                         from './shortcuts.js'
import { createScoreEngine, isPartDescriptor, partToInstrumentDescriptor } from '@score/cli/engine'
import type { PatchProps, ScoreEngine }              from '@score/cli/engine'
import {
  Kick, Snare, HiHat, Synth, Sample, Theremin, Sax, Arp,
  Kick808, Kick909, Snare909, Hihat808, HihatOpen808, Clap909, Cowbell808, KickHardstyle, KickHardcore,
  SubSynth, FMSynth,
  Bass303, Pad, Pluck, Stab, Rhodes, Wurlitzer, Hammond, Clavinet,
  DX7Lead, WavetableSynth, SuperSaw, WobbleBass, KarplusSynth, Guitar,
  chord, scale, progression, Scale, Progression,
  Track, Song, resolveFreq,
}                                                    from '@score/dsl'
import type { SongDefinition, InstrumentDescriptor } from '@score/dsl'
import {
  Delay, Reverb, Filter, Compressor, EQ, Distortion, Limiter,
  BitCrusher, Chorus, Phaser, Flanger, StereoWidener, Gate,
  Saturation, AutoPan,
}                                                    from '@score/effects'
import {
  euclidean, fast, slow, rev, every, degrade, shift, stack, beat, humanize,
}                                                    from '@score/pattern'
import type { MainToRenderer, RendererToMain, PanelLayoutMap } from './ipc-types.js'
import { createDisplayTick }                                   from './display-tick.js'
import type { TickCache }                                      from './display-tick.js'
import { autoUpdater }                               from 'electron-updater'

// ── Default starter song ────────────────────────────────────────────────────
// Used when entering any mode — mirrors the Live Code textarea starter.
// C2 = 65.41 Hz. Pattern: 8-step binary array.

const defaultSong = (): SongDefinition => Song({
  bpm:    128,
  tracks: [
    Track(Kick808(4).volume(0.9)),
    Track(Snare909(2).volume(0.6)),
    Track(Hihat808(8).volume(0.3)),
    Track(Bass303('A2').cutoff(600).resonance(0.4)
      .pattern(['A2', 0, 0, 0, 'D3', 0, 0, 0, 'A2', 0, 0, 0, 'D3', 0, 0, 0])
      .volume(0.6)),
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
const slotRef:      { value: EngineSlot | null }                          = { value: null }
const winRef:       { value: BrowserWindow | null }                       = { value: null }
// Bar-boundary hot-swap: when code is eval'd while playing, the new song queues
// here and is applied at the next onBar callback for a seamless transition.
const pendingRef:   { value: SongDefinition | null }                      = { value: null }
// Analysis interval — reads waveform from AnalyserNode at ~20fps while playing.
// Const wrapper prevents let; the interval handle is mutated via .value.
const intervalRef:  { value: ReturnType<typeof setInterval> | null }      = { value: null }

const send = <K extends keyof MainToRenderer>(channel: K, payload: MainToRenderer[K]): void => {
  const win = winRef.value
  if (!win || win.isDestroyed()) return
  win.webContents.send(channel, payload)
}

// Display tick — throttled IPC to renderer at ~60fps. Audio engine writes to tickCache
// on every onStep; createDisplayTick sends 'display:tick' at max 16ms intervals.
// Decoupled from audio rate so renderer never processes more than ~60 ticks/sec.
const tickCache: TickCache = { step: 0, stepCount: 16, bar: 0, beat: 0, bpm: 120, dirty: false }
const displayTick = createDisplayTick(send, tickCache)

const pushState = (): void => {
  const slot = slotRef.value
  if (!slot) return
  send('engine:state', { playing: slot.playing, bpm: slot.bpm, bars: slot.bars })
}

const resolveDesc = (t: { readonly _type: string; readonly component?: unknown }): InstrumentDescriptor =>
  (t._type === 'InstrumentDescriptor'
    ? t
    : isPartDescriptor(t)
      ? partToInstrumentDescriptor(t)
      : t.component) as InstrumentDescriptor

// Returns the effective pattern for a track — falls back to engine defaults so
// the renderer always has something meaningful to drive CodeHighlight bars.
const effectivePattern = (desc: InstrumentDescriptor): ReadonlyArray<number | string> => {
  const props = desc.props as { pattern?: ReadonlyArray<number | string> }
  if (props.pattern && props.pattern.length > 0) return props.pattern
  switch (desc.instrumentType) {
    case 'arp':      return Array.from({ length: 16 }, () => 1)  // engine default: all active
    case 'theremin': return []  // continuous — no step pattern
    default:         return []
  }
}

const pushSong = (song: SongDefinition): void => {
  const tracks = song.tracks.map(t => {
    const desc    = resolveDesc(t)
    const pattern = effectivePattern(desc)
    const p       = desc.props as Record<string, unknown>
    const volume  = typeof p['volume'] === 'number' ? p['volume']
                  : typeof p['gain']   === 'number' ? p['gain']
                  : undefined
    return { name: desc.instrumentType, type: desc.instrumentType, pattern, ...(volume !== undefined ? { volume } : {}) }
  })
  send('song:update', {
    tracks,
    ...(song.theme   !== undefined && { theme:   song.theme }),
    ...(song.palette !== undefined && { palette: song.palette }),
  })

  // Emit piano roll note data for melodic tracks (Synth, Arp)
  const pianoNotes: Array<{ pitch: number; step: number; velocity: number; trackIndex: number }> = []
  song.tracks.forEach((t, trackIndex) => {
    const desc = resolveDesc(t)
    const props = desc.props as Record<string, unknown>

    if (desc.instrumentType === 'synth') {
      const freq = typeof props['frequency'] === 'number' ? props['frequency'] : 440
      const pitch = Math.round(69 + 12 * Math.log2(freq / 440))
      const pattern = Array.isArray(props['pattern']) ? props['pattern'] as (number | string)[] : []
      pattern.forEach((val, step) => {
        if (val) pianoNotes.push({ pitch, step, velocity: 1, trackIndex })
      })
    } else if (desc.instrumentType === 'arp') {
      const noteNames = Array.isArray(props['notes']) ? props['notes'] as string[] : []
      const rate = typeof props['rate'] === 'number' ? props['rate'] : 1
      const pattern = Array.isArray(props['pattern']) ? props['pattern'] as (number | string)[] : Array.from({ length: 16 }, () => 1)
      pattern.reduce((noteIdx: number, val, step) => {
        if (!val) return noteIdx
        const idx = Math.floor(noteIdx / rate) % Math.max(noteNames.length, 1)
        const noteName = noteNames[idx] ?? 'C4'
        const freq = resolveFreq(noteName)
        const pitch = Math.round(69 + 12 * Math.log2(freq / 440))
        pianoNotes.push({ pitch, step, velocity: 1, trackIndex })
        return noteIdx + 1
      }, 0)
    }
  })
  if (pianoNotes.length > 0) {
    send('engine:notes', { notes: pianoNotes })
  }
}

const stopAnalysis = (): void => {
  if (intervalRef.value !== null) {
    clearInterval(intervalRef.value)
    intervalRef.value = null
  }
}

// Pop detector — tracks the previous waveform frame to detect sample-to-sample
// discontinuities that indicate hard-onset clicks, scheduling jitter, or gain spikes.
// Threshold 0.6: percussion transients (kick, snare) legitimately spike to 0.3–0.5 delta
// between 50ms frames — that is correct behavior, not an artifact. Only flag values
// above 0.6 which indicate genuine scheduling jitter or gain staging problems.
const POP_THRESHOLD = 0.6
const popDetectorRef: { prevMax: number } = { prevMax: 0 }

const startAnalysis = (): void => {
  stopAnalysis()
  const slot = slotRef.value
  if (!slot) return
  const buf = new Float32Array(slot.engine.analyser.frequencyBinCount)
  intervalRef.value = setInterval(() => {
    try {
      const s = slotRef.value
      if (!s || !s.playing) { stopAnalysis(); return }
      s.engine.analyser.getFloatTimeDomainData(buf)
      send('engine:analysis', { waveform: Array.from(buf) })

      // Detect large inter-frame amplitude jump — symptom of a pop/click
      // Compare max absolute value in this frame vs previous frame
      const frameMax = Array.from(buf).reduce((acc, v) => Math.max(acc, Math.abs(v)), 0)
      const delta = Math.abs(frameMax - popDetectorRef.prevMax)
      if (delta > POP_THRESHOLD) {
        send('debug:pop', { maxDelta: delta, step: s.bars, bars: s.bars })
      }
      popDetectorRef.prevMax = frameMax
    } catch {
      stopAnalysis()
    }
  }, 50) // ~20fps
}

const teardown = (): void => {
  stopAnalysis()
  displayTick.stop()
  tickCache.dirty = false
  const slot = slotRef.value
  if (!slot) return
  slotRef.value = null
  try { slot.engine.stop() } catch { /* ignore */ }
  // Defer dispose by 300 ms — scheduled oscillator notes finish their natural
  // envelope before the audio context closes, preventing a hard-cut pop.
  setTimeout(() => {
    try { slot.engine.dispose() } catch { /* ignore */ }
  }, 300)
}

// Panic stop — immediate all-stop without bar-boundary wait.
// Called by Cmd/Ctrl+. global shortcut and transport:stop IPC.
const panicStop = (): void => {
  const slot = slotRef.value
  if (!slot || !slot.playing) return
  stopAnalysis()
  pendingRef.value = null
  try { slot.engine.stop() } catch { /* ignore */ }
  slot.playing = false
  slot.bars    = 0
  pushState()
  send('engine:pending', { pending: false })
  send('engine:panic', undefined)
}

const boot = async (song: SongDefinition, barOffset = 0): Promise<void> => {
  // t184 — Try to boot the new engine BEFORE tearing down the current one.
  // If createScoreEngine throws, the previous engine keeps running uninterrupted.
  let engine: ScoreEngine
  try {
    engine = await createScoreEngine(song)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack   = err instanceof Error ? err.stack : undefined
    console.error('[score-studio] engine boot failed — keeping previous engine running', err)
    send('engine:error', { message, ...(stack !== undefined ? { stack } : {}) })
    return
  }
  teardown()
  slotRef.value = { engine, playing: false, bpm: song.bpm, bars: barOffset }

  // In test mode (SCORE_TEST=1) mute master output — engine still runs, IPC still fires,
  // but no audio comes out of the speakers.
  if (process.env['SCORE_TEST'] === '1') engine.patch({ masterVolume: 0 })
  // Per-step cache write — fires at full audio tick rate.
  // Does NOT send IPC directly — writes to tickCache so the display tick loop
  // can send 'display:tick' at ~60fps without IPC at the full audio rate.
  // bar and beat are derived from engine state; time (audioContext.currentTime)
  // is renderer-side only and excluded from IPC (ADR 027).
  engine.onStep((step, stepCount) => {
    const s = slotRef.value
    tickCache.step      = step
    tickCache.stepCount = stepCount
    tickCache.bar       = s ? s.bars : 0
    tickCache.beat      = stepCount > 0 ? Math.floor(step / (stepCount / 4)) : 0
    tickCache.bpm       = s ? s.bpm : 120
    tickCache.dirty     = true
  })
  displayTick.start()
  engine.onBar(() => {
    const s = slotRef.value
    if (!s) return
    // Accumulate bar count across engine restarts — never reset the session counter
    s.bars = barOffset + engine.bars
    // Bar-boundary hot-swap: if a new song was eval'd while playing, apply it
    // at this bar boundary so changes land on a clean musical boundary.
    const pending = pendingRef.value
    if (pending) {
      pendingRef.value = null
      send('engine:pending', { pending: false })
      const wasPlaying = s.playing
      const currentBars = s.bars
      void boot(pending, currentBars).then(() => {
        if (wasPlaying) {
          const next = slotRef.value
          if (next && !next.playing) {
            next.engine.start()
            if (process.env['SCORE_TEST'] === '1') next.engine.patch({ masterVolume: 0 })
            next.playing = true
            pushState()
            startAnalysis()
          }
        }
      })
      return
    }
    pushState()
  })
  pushState()
  pushSong(song)
}

// ── Window factory ─────────────────────────────────────────────────────────────

const createWindow = (): BrowserWindow => {
  // In test mode (SCORE_TEST=1) suppress the visible window — Playwright still
  // interacts via DevTools Protocol regardless of show state.
  const isTest = process.env['SCORE_TEST'] === '1'

  const win = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  900,
    minHeight: 600,
    show:            !isTest,
    backgroundColor: '#0c0c0e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload:          path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          true,
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

// ── Panel layout persistence (t218) ────────────────────────────────────────────

const layoutPath = (): string =>
  path.join(app.getPath('userData'), 'panel-layout.json')

const readLayout = (): PanelLayoutMap | null => {
  try {
    const raw = readFileSync(layoutPath(), 'utf8')
    return JSON.parse(raw) as PanelLayoutMap
  } catch {
    return null
  }
}

const writeLayout = (layout: PanelLayoutMap): void => {
  try {
    writeFileSync(layoutPath(), JSON.stringify(layout), 'utf8')
  } catch (err) {
    console.error('[score-studio] layout save failed', err)
  }
}

// ── Process-level error handlers (t133) ────────────────────────────────────────
// Catch unhandled exceptions and rejections in the main process — send them to
// the renderer's console log via error:report so the native Windows crash dialog
// never appears for script/eval errors.

process.on('uncaughtException', (err: Error) => {
  console.error('[score-studio] uncaughtException', err)
  send('engine:error', { message: `Uncaught: ${err.message}`, ...(err.stack !== undefined ? { stack: err.stack } : {}) })
})

process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason)
  const stack   = reason instanceof Error ? reason.stack : undefined
  console.error('[score-studio] unhandledRejection', reason)
  send('engine:error', { message: `Unhandled: ${message}`, ...(stack !== undefined ? { stack } : {}) })
})

// ── Lifecycle ──────────────────────────────────────────────────────────────────

app.on('ready', () => {
  const win = createWindow()
  winRef.value = win
  const { unregister: unregisterShortcuts } = registerShortcuts({ panicStop })
  app.on('will-quit', unregisterShortcuts)
  // t218 — send saved panel layout once renderer is ready
  win.webContents.once('did-finish-load', () => {
    const layout = readLayout()
    if (layout) send('layout:load', layout)
  })

  // ── Auto-update (packaged builds only) ──────────────────────────────────
  // In dev/unpackaged mode this is a no-op. publish: null in electron-builder.yml
  // disables actual downloads until a GitHub release channel is configured.
  if (app.isPackaged) {
     
    autoUpdater.logger = console
     
    autoUpdater.on('update-downloaded', () => {
       
      autoUpdater.quitAndInstall(false, true)
    })
     
    void autoUpdater.checkForUpdatesAndNotify()
  }
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
  if (process.env['DEBUG']) console.log('[score-studio] mode selected', payload)
  void boot(defaultSong())
})

ipcMain.on('transport:play', () => {
  const slot = slotRef.value
  if (!slot || slot.playing) return
  slot.engine.start()
  // Belt-and-suspenders: re-apply mute after start() in case any initialization gap
  if (process.env['SCORE_TEST'] === '1') slot.engine.patch({ masterVolume: 0 })
  slot.playing = true
  pushState()
  startAnalysis()
})

ipcMain.on('transport:stop', () => {
  panicStop()
})

ipcMain.on('transport:bpm-set', (_event, { bpm }: RendererToMain['transport:bpm-set']) => {
  const slot = slotRef.value
  if (!slot) return
  slot.engine.patch({ bpm })
  slot.bpm = bpm
  pushState()
})

// BOUNDARY — IO: eval receives code string, strips imports/exports, runs in vm sandbox
// with all DSL + effects pre-injected. Avoids CJS→ESM dynamic-import edge cases in
// Electron's embedded Node.js when loading from pnpm symlink paths.
ipcMain.on('engine:eval', (_event, { code }: RendererToMain['engine:eval']) => {
  // Strip import declarations — DSL + effects are injected via vm context.
  // Replace `export default` with an assignment to __exports__ so we can read the result.
  const scriptCode = code
    .split('\n')
    .map(line => {
      const t = line.trimStart()
      if (t.startsWith('import ') && t.includes(' from ')) return ''
      return line.replace(/^(\s*)export\s+default\s+/, '$1__exports__ = ')
    })
    .join('\n')

  type VmContext = {
    __exports__: SongDefinition | null
    [key: string]: unknown
  }

  const contextObj: Record<string, unknown> = {
    // DSL — percussion + legacy instruments
    Song, Track, Kick, Snare, HiHat, Synth, Sample, Theremin, Sax, Arp, resolveFreq,
    Kick808, Kick909, Snare909, Hihat808, HihatOpen808, Clap909, Cowbell808, KickHardstyle, KickHardcore,
    SubSynth, FMSynth,
    // DSL — chain API melodic factories
    Bass303, Pad, Pluck, Stab, Rhodes, Wurlitzer, Hammond, Clavinet,
    DX7Lead, WavetableSynth, SuperSaw, WobbleBass, KarplusSynth, Guitar,
    // DSL — music theory helpers
    chord, scale, progression, Scale, Progression,
    // Effects — descriptor factories (pure data, no AudioContext)
    Delay, Reverb, Filter, Compressor, EQ, Distortion, Limiter,
    BitCrusher, Chorus, Phaser, Flanger, StereoWidener, Gate,
    Saturation, AutoPan,
    // Pattern utilities — Euclidean rhythms, transforms
    euclidean, fast, slow, rev, every, degrade, shift, stack, beat, humanize,
    // pat — inline space-separated pattern literal helper
    // e.g. pat('1 0 C4 E4 _') → [1, 0, 'C4', 'E4', 0]
    pat: (s: string): (number | string)[] =>
      s.trim().split(/\s+/).map(t => (t === '0' || t === '_' || t === '.') ? 0 : (t === '1' ? 1 : t)),
    // Standard globals — console is a controlled stub so user code cannot
    // invoke arbitrary main-process console methods or access ipcMain via closure.
    Math,
    console: {
      log:   (...args: unknown[]) => { send('error:report', { message: `[song] ${args.join(' ')}` }) },
      warn:  (...args: unknown[]) => { send('error:report', { message: `[song:warn] ${args.join(' ')}` }) },
      error: (...args: unknown[]) => { send('error:report', { message: `[song:error] ${args.join(' ')}` }) },
    },
    // Export capture
    __exports__: null,
  }
  const context = vm.createContext(contextObj) as VmContext

  try {
    vm.runInContext(scriptCode, context, { timeout: 5000, filename: 'score-live.vm' })
    const song = context.__exports__
    if (!song || typeof song !== 'object') {
      send('error:report', { message: "Code must have 'export default Song(...)'" })
      return
    }
    const slot = slotRef.value
    if (slot?.playing) {
      pendingRef.value = song
      send('engine:pending', { pending: true })
      pushSong(song)
    } else {
      void boot(song)
    }
  } catch (err: unknown) {
    console.error('[score-studio] eval error', err)
    const message = err instanceof Error ? err.message : String(err)
    const stack   = err instanceof Error ? (err.stack ?? undefined) : undefined
    const fix     = (err instanceof Error && 'context' in err && err.context !== null && typeof err.context === 'object' && 'fix' in err.context)
      ? String((err.context as { fix: unknown }).fix)
      : undefined
    send('song:error', {
      message,
      ...(stack !== undefined ? { stack } : {}),
      ...(fix   !== undefined ? { fix   } : {}),
    })
  }
})

// ── Runtime IPC payload guard ─────────────────────────────────────────────────
// Validates that an engine:patch payload has the expected shape before use.
// Prevents renderer-side type confusion from reaching the engine.

const isPatchProps = (v: unknown): v is PatchProps => {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  if (p['bpm']          !== undefined && typeof p['bpm']          !== 'number') return false
  if (p['masterVolume'] !== undefined && typeof p['masterVolume'] !== 'number') return false
  if (p['tracks'] !== undefined) {
    if (!Array.isArray(p['tracks'])) return false
    return (p['tracks'] as unknown[]).every(t => {
      if (typeof t !== 'object' || t === null) return false
      const tr = t as Record<string, unknown>
      return typeof tr['index'] === 'number'
        && (tr['volume'] === undefined || typeof tr['volume'] === 'number')
        && (tr['mute']   === undefined || typeof tr['mute']   === 'boolean')
    })
  }
  return true
}

// BOUNDARY — IO: surgical patch — volume/mute/bpm without reloading the song.
// engine.patch() already handles per-track volume/mute and bpm.
ipcMain.on('engine:patch', (_event, payload: RendererToMain['engine:patch']) => {
  const slot = slotRef.value
  if (!slot) return
  if (!isPatchProps(payload)) {
    send('error:report', { message: 'engine:patch received invalid payload shape' })
    return
  }
  slot.engine.patch(payload)
  if (payload.bpm !== undefined) {
    slot.bpm = payload.bpm
    pushState()
  }
})

// BOUNDARY — IO: file save — opens native save dialog, writes song to disk
ipcMain.on('file:save', (_event, { code }: RendererToMain['file:save']) => {
  const win = winRef.value
  if (!win) return
  void dialog.showSaveDialog(win, {
    title:       'Save Score Song',
    defaultPath: 'song.mjs',
    filters:     [{ name: 'Score Song', extensions: ['mjs', 'js'] }],
  }).then(({ canceled, filePath }) => {
    if (canceled || !filePath) return
    try {
      writeFileSync(filePath, code, 'utf8')
    } catch (err) {
      send('error:report', { message: `Save failed: ${err instanceof Error ? err.message : String(err)}` })
    }
  }).catch((err: unknown) => {
    send('error:report', { message: `Save dialog failed: ${err instanceof Error ? err.message : String(err)}` })
  })
})

// BOUNDARY — IO: bug report — saves JSON to two locations:
//   1. Fixed path Claude can always read: <repo>/debug/report.json (overwritten each time)
//   2. Timestamped archive in Downloads for the user
ipcMain.on('bug:report', (_event, payload: RendererToMain['bug:report']) => {
  try {
    const json        = JSON.stringify(payload, null, 2)
    const timestamp   = new Date(payload.timestamp).toISOString().replace(/[:.]/g, '-')
    const fileName    = `score-bug-report-${timestamp}.json`

    // Fixed path — always the same location so Claude can read it directly
    const repoRoot    = path.resolve(__dirname, '..', '..', '..', '..')
    const debugDir    = path.join(repoRoot, 'debug')
    mkdirSync(debugDir, { recursive: true })
    writeFileSync(path.join(debugDir, 'report.json'), json, 'utf8')

    // Timestamped archive in Downloads for the user
    writeFileSync(path.join(app.getPath('downloads'), fileName), json, 'utf8')

    void shell.openPath(app.getPath('downloads'))
  } catch (err) {
    send('error:report', { message: `Bug report save failed: ${err instanceof Error ? err.message : String(err)}` })
  }
})

// BOUNDARY — IO: panel layout persistence (t218) — renderer sends positions on each panel move
ipcMain.on('layout:save', (_event, layout: RendererToMain['layout:save']) => {
  writeLayout(layout)
})

// BOUNDARY — IO: file open — opens native open dialog, reads song, sends to renderer
ipcMain.on('file:open', () => {
  const win = winRef.value
  if (!win) return
  void dialog.showOpenDialog(win, {
    title:      'Open Score Song',
    filters:    [{ name: 'Score Song', extensions: ['mjs', 'js'] }],
    properties: ['openFile'],
  }).then(({ canceled, filePaths }) => {
    const filePath = filePaths[0]
    if (canceled || !filePath) return
    try {
      const code = readFileSync(filePath, 'utf8')
      send('file:opened', { code })
    } catch (err) {
      send('error:report', { message: `Open failed: ${err instanceof Error ? err.message : String(err)}` })
    }
  }).catch((err: unknown) => {
    send('error:report', { message: `Open dialog failed: ${err instanceof Error ? err.message : String(err)}` })
  })
})
