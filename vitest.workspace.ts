import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/core',
  'packages/components',
  'packages/effects',
  'packages/dsl',
  'packages/sequencer',
  'packages/mixer',
  'packages/cli',
  'packages/midi',
  'packages/mcp',
])
