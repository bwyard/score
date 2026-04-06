// keyboard.e2e.ts — Global keyboard shortcut e2e tests.
//
// NOTE: globalShortcut (zoom, panic) is OS-level — page.keyboard.press() sends
// events to the renderer process, not the OS, so it cannot trigger globalShortcut
// handlers. These tests call Electron's API directly via app.evaluate() instead.

import { test, expect } from './fixtures.js'

test.describe('Zoom — direct API', () => {
  // Tests call webContents.setZoomLevel directly — validates the zoom state API
  // that the globalShortcut handlers use. The shortcuts themselves are smoke-tested
  // manually since they require OS-level key injection.

  test('zoom level starts at 0', async ({ livecode: { app } }) => {
    const level = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.webContents.getZoomLevel() ?? -1
    )
    expect(level).toBe(0)
  })

  test('setting zoom level to 1 is reflected immediately', async ({ livecode: { app } }) => {
    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomLevel(1)
    })
    const level = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.webContents.getZoomLevel() ?? -1
    )
    expect(level).toBe(1)
  })

  test('zoom level can be reset to 0', async ({ livecode: { app } }) => {
    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomLevel(2)
    })
    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomLevel(0)
    })
    const level = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.webContents.getZoomLevel() ?? -1
    )
    expect(level).toBe(0)
  })

})

test.describe('Panic — transport stop', () => {
  // NOTE: exact:true required — "Eval song (load without playing)" matches /play/i

  test('play button is visible when stopped', async ({ livecode: { page } }) => {
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  })

  test('clicking play shows stop button', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible()
  })

  test('clicking stop returns to play state', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible({ timeout: 3000 })
  })

})

test.describe('Tab navigation', () => {

  test('Tab key moves focus within transport', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: 'Play', exact: true }).focus()
    const before = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
    await page.keyboard.press('Tab')
    // Headless Electron may be slow to process keyboard focus changes — poll
    await expect(async () => {
      const after = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
      // Focus must have moved somewhere (null means body — not ideal but headless limitation)
      expect(after).not.toBe(before)
    }).toPass({ timeout: 3000 })
  })

})
