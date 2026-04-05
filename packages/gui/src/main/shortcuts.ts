// shortcuts.ts — Global keyboard shortcut registration for Score Studio.
//
// All Electron globalShortcut bindings live here. index.ts calls registerShortcuts()
// once on app ready and calls the returned unregister() on app quit.
//
// Adding a shortcut: add ONE entry to SHORTCUT_MAP below.
// Dependencies (panicStop etc.) are injected via params — no module-level imports.

import { BrowserWindow, globalShortcut } from 'electron'

// ── Types ─────────────────────────────────────────────────────────────────────

/** External actions injected from index.ts — keeps shortcuts.ts free of engine imports. */
export type ShortcutDeps = {
  readonly panicStop: () => void
}

// ── Shortcut map ──────────────────────────────────────────────────────────────

type ShortcutHandler = (deps: ShortcutDeps) => void

type ShortcutEntry = {
  readonly accelerator: string
  readonly description: string
  readonly handler:     ShortcutHandler
}

const SHORTCUT_MAP: readonly ShortcutEntry[] = [

  // ── Dev tools ──────────────────────────────────────────────────────────────
  {
    accelerator: 'F12',
    description: 'Toggle DevTools',
    handler: () => {
      const focused = BrowserWindow.getFocusedWindow()
      if (focused) focused.webContents.toggleDevTools()
    },
  },

  // ── Transport ──────────────────────────────────────────────────────────────
  {
    accelerator: 'CommandOrControl+.',
    description: 'Panic stop — instant all-stop, no bar-boundary wait (t207)',
    handler: ({ panicStop }) => { panicStop() },
  },

  // ── Zoom ───────────────────────────────────────────────────────────────────
  // Ctrl+= avoids requiring Shift (Ctrl++ would need Shift on most keyboards)
  {
    accelerator: 'CommandOrControl+=',
    description: 'Zoom in',
    handler: () => {
      const focused = BrowserWindow.getFocusedWindow()
      if (focused) focused.webContents.setZoomLevel(focused.webContents.getZoomLevel() + 0.5)
    },
  },
  {
    accelerator: 'CommandOrControl+-',
    description: 'Zoom out',
    handler: () => {
      const focused = BrowserWindow.getFocusedWindow()
      if (focused) focused.webContents.setZoomLevel(focused.webContents.getZoomLevel() - 0.5)
    },
  },
  {
    accelerator: 'CommandOrControl+0',
    description: 'Reset zoom',
    handler: () => {
      const focused = BrowserWindow.getFocusedWindow()
      if (focused) focused.webContents.setZoomLevel(0)
    },
  },

]

// ── Registration ──────────────────────────────────────────────────────────────

/**
 * Register all global keyboard shortcuts for Score Studio.
 *
 * Call once on `app.on('ready')`. Returns an `unregister` function — call it
 * on `app.on('will-quit')` to release all shortcuts cleanly.
 *
 * @param deps - External actions (panicStop etc.) injected from index.ts.
 * @returns `{ unregister }` — call on app quit.
 *
 * @example
 * ```ts
 * app.on('ready', () => {
 *   const { unregister } = registerShortcuts({ panicStop })
 *   app.on('will-quit', unregister)
 * })
 * ```
 */
export const registerShortcuts = (deps: ShortcutDeps): { readonly unregister: () => void } => {
  for (const { accelerator, handler } of SHORTCUT_MAP) {
    globalShortcut.register(accelerator, () => { handler(deps) })
  }

  return {
    unregister: () => { globalShortcut.unregisterAll() },
  }
}
