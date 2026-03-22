import { defineConfig } from 'vitest/config'
import react            from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals:         true,
    environment:     'jsdom',
    passWithNoTests: true,
    setupFiles:      ['./tests/setup.ts'],
    coverage: {
      provider:  'v8',
      thresholds: {
        statements: 70,
        branches:   60,
        functions:  70,
        lines:      70,
      },
    },
  },
})
