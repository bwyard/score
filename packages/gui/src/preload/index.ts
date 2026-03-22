 
// Electron APIs are fully typed once `pnpm install` runs.

import { contextBridge, ipcRenderer } from 'electron'
import type { RendererToMain, MainToRenderer } from '../main/ipc-types.js'

// ── Score Bridge ───────────────────────────────────────────────────────────────

const scoreBridge = {
  /** Send a typed message to the main process (fire-and-forget). */
  send<K extends keyof RendererToMain>(
    channel: K,
    payload: RendererToMain[K],
  ): void {
    ipcRenderer.send(channel as string, payload)
  },

  /** Register a listener for messages pushed from the main process. */
  on<K extends keyof MainToRenderer>(
    channel: K,
    handler: (payload: MainToRenderer[K]) => void,
  ): () => void {
    const wrapped = (_: Electron.IpcRendererEvent, p: MainToRenderer[K]) => { handler(p); }
    ipcRenderer.on(channel as string, wrapped)
    return () => ipcRenderer.removeListener(channel as string, wrapped)
  },
}

contextBridge.exposeInMainWorld('scoreBridge', scoreBridge)

/** Global type augmentation — available in renderer TypeScript. */
declare global {
  interface Window {
    readonly scoreBridge: typeof scoreBridge
  }
}
