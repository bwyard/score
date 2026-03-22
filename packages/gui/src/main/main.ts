 
// Electron APIs are fully typed once `pnpm install` runs.
// The eslint-disable above covers the type-resolution gap before that.

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path                                    from 'node:path'
import type { RendererToMain }                 from './ipc-types.js'

// ── Window factory ─────────────────────────────────────────────────────────────

const createWindow = (): BrowserWindow => {
  const win = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  900,
    minHeight: 600,
    backgroundColor: '#0d0d0f',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload:          path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  })

  // In development, electron-forge sets MAIN_WINDOW_VITE_DEV_SERVER_URL
  if (process.env['MAIN_WINDOW_VITE_DEV_SERVER_URL']) {
    void win.loadURL(process.env['MAIN_WINDOW_VITE_DEV_SERVER_URL'])
    win.webContents.openDevTools()
  } else {
    void win.loadFile(
      path.join(__dirname, `../renderer/${process.env['MAIN_WINDOW_VITE_NAME'] ?? 'main_window'}/index.html`),
    )
  }

  // Open external links in the OS browser, not in-app
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.on('mode:selected', (_event, payload: RendererToMain['mode:selected']) => {
  // TODO Phase 13b: boot the correct engine mode based on payload
  console.log('[score-studio] mode selected', payload)
})

ipcMain.on('transport:play', () => {
  // TODO Phase 13: forward to JamSession engine
})

ipcMain.on('transport:stop', () => {
  // TODO Phase 13: forward to JamSession engine
})
