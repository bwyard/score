// playwright.config.ts — E2E test configuration for Score Studio.
//
// Uses @playwright/test with Electron's built-in playwright support.
// Tests live in tests/e2e/ and run against a built app (pnpm build first).
//
// Run: pnpm test:e2e
// CI: runs after unit tests pass.

import { defineConfig } from '@playwright/test'

export default defineConfig({

  testDir:        './tests/e2e',
  testMatch:      '**/*.e2e.ts',
  timeout:        30_000,  // per-test limit
  globalTimeout:  900_000, // 15 min total safety cap
  retries:        process.env['CI'] ? 2 : 0,
  workers:        1, // Electron: single instance only

  expect: {
    // Electron startup (~5-7s) + render time — give assertions room to breathe
    timeout: 8_000,
  },

  use: {
    // Electron does not use a browser — launch config is in each test via electron.launch()
    // Screenshots and traces captured on failure for CI debugging
    screenshot: 'only-on-failure',
    trace:      'on-first-retry',
  },

  // Pass SCORE_TEST=1 so the main process hides the BrowserWindow.
  // Playwright interacts via DevTools Protocol — the window does not need to be visible.
  projects: [
    {
      name: 'electron',
      use: { },
    },
  ],

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

})
