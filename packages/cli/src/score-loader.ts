// score-loader.ts — ESM module loader hook
// Maps @score/* imports to the CLI's bundled copies of those packages.
// Registered at startup so song files can import @score/* from any directory.

import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

// CLI's own node_modules — where workspace packages are bundled
const CLI_NODE_MODULES = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules')

export const resolve = async (
  specifier: string,
  context: { parentURL?: string },
  nextResolve: (s: string, c: typeof context) => Promise<{ url: string }>,
): Promise<{ url: string; shortCircuit?: boolean }> => {
  if (specifier.startsWith('@score/')) {
    const candidate = join(CLI_NODE_MODULES, specifier, 'dist', 'index.js')
    if (existsSync(candidate)) {
      return { url: pathToFileURL(candidate).href, shortCircuit: true }
    }
    // Try without dist/ (some packages output directly)
    const alt = join(CLI_NODE_MODULES, specifier, 'index.js')
    if (existsSync(alt)) {
      return { url: pathToFileURL(alt).href, shortCircuit: true }
    }
  }
  return nextResolve(specifier, context)
}
