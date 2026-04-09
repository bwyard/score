// fixtures.ts — Shared Playwright helpers and fixtures for Score Studio e2e tests.
//
// Usage:
//   import { test, expect } from './fixtures.js'
//   test('...', async ({ livecode: { page } }) => { ... })
//
// Architecture: ONE Electron instance per worker (scope: 'worker'), reset via
// page.reload() between tests. This cuts suite time from ~11 min to ~3-4 min
// vs per-test launch (5-7s Electron startup × 106 tests = 10+ min).

import { test as base, expect, _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page }               from '@playwright/test'
import path                                              from 'node:path'

export { expect }

// ── Constants ─────────────────────────────────────────────────────────────────

export const APP_MAIN = path.resolve(__dirname, '../../out/main/index.js')

// SCORE_TEST=1 tells the main process to use show:false on BrowserWindow.
// Playwright still interacts via DevTools Protocol — window visibility not required.
const TEST_ENV = { ...process.env, SCORE_TEST: '1' }

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppFixture = { app: ElectronApplication; page: Page }
type SharedApp = { app: ElectronApplication }

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const test = base.extend<
  { raw: AppFixture; livecode: AppFixture },
  { sharedApp: SharedApp }
>({

  // Worker-scoped: single Electron launch for the entire suite.
  // page.reload() in each test fixture resets renderer state cheaply (~1s)
  // vs launching a new Electron process (~5-7s startup).
  sharedApp: [async ({}, use) => {
    const app = await electron.launch({ args: [APP_MAIN], env: TEST_ENV })
    await use({ app })
    await app.close()
  }, { scope: 'worker' }],

  // raw — fresh splash screen state (reload renderer)
  raw: async ({ sharedApp: { app } }, use) => {
    const page = await app.firstWindow()
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await use({ app, page })
  },

  // livecode — fresh Live Code mode state (reload + navigate)
  livecode: async ({ sharedApp: { app } }, use) => {
    const page = await app.firstWindow()
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Select Live Code mode and start — exact:true avoids matching "Start Live Code"
    await page.getByRole('button', { name: 'Live Code', exact: true }).click()
    await page.getByRole('button', { name: 'Start Live Code', exact: true }).click()
    await page.waitForSelector('[role="toolbar"]', { timeout: 5000 })

    await use({ app, page })
  },

})
