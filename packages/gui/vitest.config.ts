import { defineConfig } from 'vitest/config'
import react            from '@vitejs/plugin-react'
import { resolve }      from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Prevent monaco-editor from initializing its TypeScript language service
      // in jsdom — ts.ScriptTarget.ESNext is undefined in the jsdom environment.
      // @monaco-editor/react is mocked per-test-file via vi.mock() factories.
      { find: 'monaco-editor', replacement: resolve(__dirname, 'tests/__mocks__/monaco-editor.ts') },
    ],
  },
  test: {
    globals:         true,
    environment:     'jsdom',
    passWithNoTests: true,
    setupFiles:      ['./tests/setup.ts'],
    coverage: {
      provider:  'v8',
      // Exclude non-application files and phase-placeholder directories.
      // Each placeholder will be included as it's built out in later phases.
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/dist/**',
        'out/**',                               // compiled electron-vite output — not source
        'tmp/**',                               // scratch eval files — not source
        '*.config.ts',                          // vite/forge/vitest config — not app logic
        'src/main/**',                          // Electron main process — not testable in jsdom
        'src/preload/**',                       // Electron preload — not testable in jsdom
        'src/renderer/main.tsx',                // React entry point — not application logic
        'src/renderer/App.tsx',                 // Phase 13b integration shell
        'src/renderer/components/LiveCode/**',  // Phase 13f — wired in integration tests
        'src/renderer/components/Produce/**',   // Phase 13b placeholder
        'src/renderer/components/DJSet/**',     // Phase 13e placeholder
        'src/renderer/components/JamSession/**',// Phase 13b placeholder
        'src/renderer/components/visualizer/Scope.tsx',           // canvas RAF loop — not jsdom-testable
        'src/renderer/components/visualizer/SpectrumAnalyser.tsx',// canvas RAF loop — not jsdom-testable
      ],
      thresholds: {
        statements: 70,
        branches:   60,
        functions:  70,
        lines:      70,
      },
    },
  },
})
