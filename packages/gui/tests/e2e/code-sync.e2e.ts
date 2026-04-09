// code-sync.e2e.ts — GUI→code bidirectional sync tests.
//
// Verifies that GUI actions (add track, BPM change, step click) immediately
// patch the code in the Monaco editor without requiring a manual save.
// This is the core Live Code contract: GUI and code are always in sync.
//
// Reading code: Monaco exposes its model value via window.monaco.editor.getModels().
// Fallback: read the visible line text from .view-lines if Monaco API isn't exposed.

import { test, expect } from './fixtures.js'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Read current code from the Monaco editor. */
const readEditorCode = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    // Primary: use the exposed editor handle (set in CodeEditorPanel handleMount)
    const handle = (window as unknown as { __scoreEditor?: { getValue?: () => string } }).__scoreEditor
    if (handle?.getValue) return handle.getValue()
    // Fallback: read visible text from Monaco's content layer
    return document.querySelector('.view-lines')?.textContent ?? ''
  })

/** Wait for code to contain a substring (up to 3s after action). */
const waitForCode = async (
  page: import('@playwright/test').Page,
  substring: string,
) => {
  await expect(async () => {
    const code = await readEditorCode(page)
    expect(code).toContain(substring)
  }).toPass({ timeout: 3000 })
}

// ── Add Track → code updated ──────────────────────────────────────────────────

test.describe('Code sync — add track', () => {

  test('picking Kick 808 inserts Kick808 into the editor', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /add track/i }).click()
    const dialog = page.getByRole('dialog', { name: /pick an instrument/i })
    await dialog.waitFor({ state: 'visible', timeout: 8000 })
    await dialog.getByRole('button', { name: 'Kick 808', exact: true }).click()

    // patchAddInstrument adds a new const + appends to tracks array
    await waitForCode(page, 'Kick808')
    // picker closed and new code is in editor
    await expect(dialog).not.toBeVisible()
  })

  test('picking Bass 303 inserts Bass303 into the editor', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /add track/i }).click()
    const dialog = page.getByRole('dialog', { name: /pick an instrument/i })
    await dialog.waitFor({ state: 'visible', timeout: 8000 })
    await dialog.getByRole('button', { name: 'Bass 303', exact: true }).click()

    await waitForCode(page, 'Bass303')
  })

  test('adding two tracks keeps both in code', async ({ livecode: { page } }) => {
    // Add Kick 808
    await page.getByRole('button', { name: /add track/i }).click()
    let dialog = page.getByRole('dialog', { name: /pick an instrument/i })
    await dialog.waitFor({ state: 'visible', timeout: 8000 })
    await dialog.getByRole('button', { name: 'Kick 808', exact: true }).click()
    await expect(dialog).not.toBeVisible()

    // Add Snare 909
    await page.getByRole('button', { name: /add track/i }).click()
    dialog = page.getByRole('dialog', { name: /pick an instrument/i })
    await dialog.waitFor({ state: 'visible', timeout: 8000 })
    await dialog.getByRole('button', { name: 'Snare 909', exact: true }).click()
    await expect(dialog).not.toBeVisible()

    const code = await readEditorCode(page)
    expect(code).toContain('Kick808')
    expect(code).toContain('Snare909')
  })

  test('added instrument variable has a unique name', async ({ livecode: { page } }) => {
    // Starter already has a kick variable — uniqueVarName should produce kick1 or kick2
    await page.getByRole('button', { name: /add track/i }).click()
    const dialog = page.getByRole('dialog', { name: /pick an instrument/i })
    await dialog.waitFor({ state: 'visible', timeout: 8000 })
    await dialog.getByRole('button', { name: 'Kick 808', exact: true }).click()

    await expect(async () => {
      const code = await readEditorCode(page)
      // uniqueVarName appends a number when the base name is taken
      expect(code).toMatch(/const kick\d\s*=/)
    }).toPass({ timeout: 3000 })
  })

  test('added instrument is appended to tracks array', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /add track/i }).click()
    const dialog = page.getByRole('dialog', { name: /pick an instrument/i })
    await dialog.waitFor({ state: 'visible', timeout: 8000 })
    await dialog.getByRole('button', { name: 'Pad', exact: true }).click()

    await expect(async () => {
      const code = await readEditorCode(page)
      // Pad should appear inside the tracks array, not just as a declaration
      const tracksSection = code.slice(code.indexOf('tracks:'))
      expect(tracksSection).toContain('pad')
    }).toPass({ timeout: 3000 })
  })

})

// ── BPM change → code updated ─────────────────────────────────────────────────

test.describe('Code sync — BPM change', () => {

  test('changing BPM in transport updates bpm: in editor', async ({ livecode: { page } }) => {
    const bpmInput = page.getByRole('spinbutton', { name: /bpm/i })
    await bpmInput.fill('140')
    await bpmInput.press('Enter')

    // patchBpm rewrites the bpm: value in the Song() call
    await waitForCode(page, 'bpm: 140')
  })

  test('BPM defaults to 128 in starter code', async ({ livecode: { page } }) => {
    // Monaco mounts async — poll until editor is populated
    await expect(async () => {
      const code = await readEditorCode(page)
      expect(code).toContain('bpm: 128')
    }).toPass({ timeout: 5000 })
  })

  test('multiple BPM changes reflect the latest value', async ({ livecode: { page } }) => {
    const bpmInput = page.getByRole('spinbutton', { name: /bpm/i })

    await bpmInput.fill('120')
    await bpmInput.press('Enter')
    await waitForCode(page, 'bpm: 120')

    await bpmInput.fill('160')
    await bpmInput.press('Enter')
    await waitForCode(page, 'bpm: 160')

    const code = await readEditorCode(page)
    // Code should contain the latest value, not both
    expect(code).not.toContain('bpm: 120')
  })

})
