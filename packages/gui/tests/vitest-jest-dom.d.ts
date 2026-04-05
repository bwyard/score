// ── @testing-library/jest-dom type augmentation ────────────────────────────────
//
// Explicitly augments Vitest's Assertion interface with jest-dom matchers
// (toBeInTheDocument, toHaveTextContent, toHaveStyle, toHaveAttribute, etc.).
//
// Why this file exists:
//   The import in setup.ts ('import @testing-library/jest-dom/vitest') provides
//   the runtime matchers but its module augmentation can be silently dropped
//   by tsc when Electron v39+ types are present — the Electron type surface is
//   large enough to cause ambiguity in Vitest's Assertion interface resolution.
//
//   This file lives directly in tests/ which is in tsconfig.json "include", so
//   tsc always processes it unconditionally, regardless of Electron version.
//
// @see packages/gui/tests/setup.ts — runtime registration of the matchers
// @see https://github.com/testing-library/jest-dom#with-vitest

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, void> {}
}
