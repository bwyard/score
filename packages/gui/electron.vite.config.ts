import { defineConfig } from 'electron-vite'
import react            from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    // BOUNDARY — main process: Node.js environment, no browser APIs
    build: { externalizeDeps: true },
  },
  preload: {
    // BOUNDARY — preload: sandboxed bridge between main and renderer
    build: { externalizeDeps: true },
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
  },
})
