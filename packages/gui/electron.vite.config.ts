import { defineConfig }  from 'electron-vite'
import react             from '@vitejs/plugin-react'
import path              from 'node:path'

// Workspace source roots — resolve @score/* directly to TypeScript source so
// Rollup bundles them into the main/preload CJS output. This is the standard
// Electron monorepo pattern: bypass node_modules symlinks so packages aren't
// treated as externals by Vite's SSR mode.
const ws = (rel: string): string => path.resolve(__dirname, '..', rel)

const workspaceAliases = {
  '@score/cli/engine': ws('cli/src/engine.ts'),
  '@score/dsl':        ws('dsl/src/index.ts'),
  '@score/core':       ws('core/src/index.ts'),
  '@score/math':       ws('math/src/index.ts'),
  '@score/pattern':    ws('pattern/src/index.ts'),
  '@score/sequencer':  ws('sequencer/src/index.ts'),
  '@score/mixer':      ws('mixer/src/index.ts'),
  '@score/effects':    ws('effects/src/index.ts'),
  '@score/components': ws('components/src/index.ts'),
  '@score/session':    ws('session/src/index.ts'),
}

export default defineConfig({
  main: {
    // BOUNDARY — main process: Node.js environment, no browser APIs
    resolve:  { alias: workspaceAliases },
    build:    { externalizeDeps: true },
  },
  preload: {
    // BOUNDARY — preload: sandboxed bridge between main and renderer
    resolve:  { alias: workspaceAliases },
    build:    { externalizeDeps: true },
  },
  renderer: {
    // BOUNDARY — renderer: Chromium/browser environment, no Node.js APIs
    // Only alias packages that are imported as values (not type-only) in renderer source.
    // @score/visuals pulls in @score/math (lorenz theme) — both must be aliased together.
    // @score/sequencer / @score/dsl etc. are type-only in renderer — no alias needed.
    root:    'src/renderer',
    plugins: [react()],
    resolve: { alias: {
      '@score/visuals': ws('visuals/src/index.ts'),
      '@score/math':    ws('math/src/index.ts'),
    }},
  },
})
