// playwright.config.ts — Playwright Electron e2e configuration for Score Studio.
//
// Tests launch the built Electron app via the _electron API.
// Run `pnpm build` in packages/gui before running e2e tests.

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir:  './tests/e2e',
  timeout:  30_000,
  reporter: 'list',
  use: {
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
  },
})
