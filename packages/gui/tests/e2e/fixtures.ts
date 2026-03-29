// fixtures.ts — Shared Playwright fixtures for Score Studio Electron e2e tests.
//
// Provides `app` (ElectronApplication) and `window` (Page) fixtures.
// The app is launched from the pre-built out/main/index.js — run `pnpm build` first.

import { test as base }        from '@playwright/test'
import { _electron as electron } from 'playwright'
import path                    from 'node:path'
import type { ElectronApplication, Page } from 'playwright'

// ── Types ──────────────────────────────────────────────────────────────────────

type E2EFixtures = {
  readonly app:    ElectronApplication
  readonly window: Page
}

// ── Path ──────────────────────────────────────────────────────────────────────

/** Absolute path to the built main process entry point. */
const MAIN_ENTRY = path.join(__dirname, '..', '..', 'out', 'main', 'index.js')

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Navigate past the splash screen into LiveCode mode.
 * 'Live Code' is pre-selected by default — just clicks Start.
 */
export const navigateToLiveCode = async (window: Page): Promise<void> => {
  await window.getByRole('button', { name: 'Start Live Code' }).click()
  await window.getByRole('toolbar', { name: 'Transport controls' }).waitFor()
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const test = base.extend<E2EFixtures>({
  app: async ({}, use) => {
    const electronApp = await electron.launch({ args: [MAIN_ENTRY] })
    await use(electronApp)
    await electronApp.close()
  },

  window: async ({ app }, use) => {
    const page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  },
})

export const { expect } = base
