import { defineConfig } from 'vite'

// Preload script — runs in renderer context with Node access
// Must output a single file (no dynamic imports)
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
})
