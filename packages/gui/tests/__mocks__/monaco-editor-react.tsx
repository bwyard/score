// Global stub for @monaco-editor/react — prevents Monaco initialization in jsdom.
// Individual test files may re-mock with vi.mock('@monaco-editor/react', factory)
// to add onChange/onMount support for their specific assertions.

const MonacoEditorStub = () => null
MonacoEditorStub.displayName = 'MonacoEditor'

export default MonacoEditorStub
export const Editor = MonacoEditorStub
