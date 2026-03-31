// scripts/sync-monaco-types.mjs
//
// Generates score-dsl-types.ts from score-dsl.d.ts so the Monaco string mirror
// never drifts from the TypeScript declaration source.
//
// Run: node scripts/sync-monaco-types.mjs
// Hooked into: "prebuild" in packages/gui/package.json
//
// Only touch point for Monaco declarations: edit score-dsl.d.ts.
// This script handles the rest.

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const typesDir   = resolve(__dirname, '../src/renderer/types')
const dtsPath    = resolve(typesDir, 'score-dsl.d.ts')
const outputPath = resolve(typesDir, 'score-dsl-types.ts')

const dts = readFileSync(dtsPath, 'utf8')

const output = [
  '// Generated from score-dsl.d.ts — run scripts/sync-monaco-types.mjs to regenerate.',
  '// To add a declaration: edit score-dsl.d.ts, then run the script (or let prebuild do it).',
  '',
  '/** Hand-written Score DSL ambient declarations. Loaded into Monaco TypeScript service on editor mount. */',
  `export const SCORE_DSL_TYPES: string = \``,
  dts,
  `\``,
  '',
].join('\n')

writeFileSync(outputPath, output, 'utf8')
console.log(`[sync-monaco-types] wrote ${outputPath}`)
