// Stub for monaco-editor — prevents TypeScript language service initialization
// in jsdom test environment (ts.ScriptTarget.ESNext undefined in jsdom).
// Per-test mocks for @monaco-editor/react are defined in individual test files.

export const editor = {
  create:               () => ({}),
  defineTheme:          () => undefined,
  setTheme:             () => undefined,
  setModelLanguage:     () => undefined,
  OverviewRulerLane:    { Left: 1 },
  TrackedRangeStickiness: { NeverGrowsWhenTypingAtEdges: 1 },
}

export const languages = {
  register:                 () => undefined,
  setMonarchTokensProvider: () => undefined,
  getLanguages:             () => [],
  typescript: {
    typescriptDefaults: {
      setCompilerOptions: () => undefined,
      addExtraLib:        () => undefined,
    },
  },
}

export const KeyMod  = { CtrlCmd: 2048 }
export const KeyCode = { Enter: 3 }
export const Range = { fromPositions: () => ({}) }
