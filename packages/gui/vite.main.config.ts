import { defineConfig } from 'vite'

// Main process — outputs CommonJS for Electron Node environment
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
})
