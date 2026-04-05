// playwright.config.ts — E2E test configuration for Score Studio.
//
// Uses @playwright/test with Electron's built-in playwright support.
// Tests live in tests/e2e/ and run against a built app (pnpm build first).
//
// Run: pnpm test:e2e
// CI: runs after unit tests pass.

import { defineConfig } from '@playwright/test'

export default defineConfig({

  testDir:     './tests/e2e',
  testMatch:   '**/*.e2e.ts',
  timeout:     30_000,
  retries:     process.env['CI'] ? 2 : 0,
  workers:     1, // Electron: single instance only

  use: {
    // Electron does not use a browser — launch config is in each test via electron.launch()
    // Screenshots and traces captured on failure for CI debugging
    screenshot: 'only-on-failure',
    trace:      'on-first-retry',
  },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

})
