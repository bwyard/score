// app.e2e.ts — Score Studio launch smoke tests.
//
// Minimal set: confirms the app opens, title is correct, and the splash renders.
// All deeper coverage lives in the per-area files:
//   splash.e2e.ts, transport.e2e.ts, live-code.e2e.ts, mixer.e2e.ts,
//   instrument-picker.e2e.ts, keyboard.e2e.ts, bug-report.e2e.ts

import { test, expect } from './fixtures.js'

test.describe('Score Studio — smoke', () => {

  test('window opens with Score in title', async ({ raw: { app } }) => {
    const title = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.getTitle() ?? ''
    )
    expect(title).toContain('Score')
  })

  test('renders without crashing', async ({ raw: { page } }) => {
    // Body has content — app did not white-screen
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(0)
  })

  test('splash screen is the initial view', async ({ raw: { page } }) => {
    await expect(page.getByText(/score studio/i).first()).toBeVisible()
  })

  test('single window open on launch', ({ raw: { app } }) => {
    const windows = app.windows()
    expect(windows.length).toBe(1)
  })

})
