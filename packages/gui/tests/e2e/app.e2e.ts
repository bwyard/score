// app.e2e.ts — Score Studio smoke tests.
//
// These tests launch the real Electron app and assert against the live UI.
// Run after `pnpm build` — tests require out/main/index.js to exist.
//
// Add new test files to tests/e2e/*.e2e.ts.

import { test, expect, _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page }       from '@playwright/test'
import path                                      from 'node:path'

// ── Helpers ───────────────────────────────────────────────────────────────────

const APP_MAIN = path.resolve(__dirname, '../../out/main/index.js')

const launchApp = (): Promise<ElectronApplication> =>
  electron.launch({ args: [APP_MAIN] })

// ── Launch + basic rendering ──────────────────────────────────────────────────

test.describe('Score Studio — launch', () => {

  let app:  ElectronApplication
  let page: Page

  test.beforeEach(async () => {
    app  = await launchApp()
    page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterEach(async () => {
    await app.close()
  })

  test('window opens with correct title', async () => {
    const title = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.getTitle() ?? ''
    )
    expect(title).toContain('Score')
  })

  test('transport bar is visible', async () => {
    await expect(page.getByRole('toolbar')).toBeVisible()
  })

  test('play button is present and labelled', async () => {
    await expect(page.getByRole('button', { name: /play/i })).toBeVisible()
  })

  test('report issue button is present', async () => {
    await expect(page.getByRole('button', { name: /report issue/i })).toBeVisible()
  })

})

// ── Zoom shortcuts ────────────────────────────────────────────────────────────

test.describe('Score Studio — zoom', () => {

  let app:  ElectronApplication
  let page: Page

  test.beforeEach(async () => {
    app  = await launchApp()
    page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterEach(async () => {
    await app.close()
  })

  test('Ctrl+= increases zoom level', async () => {
    const before = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.webContents.getZoomLevel() ?? 0
    )
    await page.keyboard.press('Control+=')
    const after = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.webContents.getZoomLevel() ?? 0
    )
    expect(after).toBeGreaterThan(before)
  })

  test('Ctrl+0 resets zoom level to 0', async () => {
    await page.keyboard.press('Control+=')
    await page.keyboard.press('Control+=')
    await page.keyboard.press('Control+0')
    const level = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.webContents.getZoomLevel() ?? 0
    )
    expect(level).toBe(0)
  })

})

// ── Instrument picker ─────────────────────────────────────────────────────────

test.describe('Score Studio — instrument picker', () => {

  let app:  ElectronApplication
  let page: Page

  test.beforeEach(async () => {
    app  = await launchApp()
    page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterEach(async () => {
    await app.close()
  })

  test('Add Track button opens instrument picker with all categories', async () => {
    await page.getByRole('button', { name: /add track/i }).click()
    await expect(page.getByText('Drums',  { exact: false })).toBeVisible()
    await expect(page.getByText('Bass',   { exact: false })).toBeVisible()
    await expect(page.getByText('Synths', { exact: false })).toBeVisible()
    await expect(page.getByText('Other',  { exact: false })).toBeVisible()
  })

  test('picker shows all drum instruments', async () => {
    await page.getByRole('button', { name: /add track/i }).click()
    await expect(page.getByRole('button', { name: 'Kick 808' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Snare 909' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cowbell 808' })).toBeVisible()
  })

  test('picker closes on Escape', async () => {
    await page.getByRole('button', { name: /add track/i }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('instrument-picker-overlay')).not.toBeVisible()
  })

})
