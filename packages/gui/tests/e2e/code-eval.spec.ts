// code-eval.spec.ts — Smoke test: Ctrl+Enter triggers code evaluation without crash.
//
// Monaco editor is complex to interact with directly.
// Strategy: click the editor container to focus, then send Ctrl+Enter.
// The app must survive the eval — transport controls still visible = no crash.

import { test, expect, navigateToLiveCode } from './fixtures.js'

test.describe('Code eval', () => {
  test('transport controls are present after navigating to LiveCode', async ({ window }) => {
    await navigateToLiveCode(window)
    await expect(window.getByRole('toolbar', { name: 'Transport controls' })).toBeVisible()
  })

  test('Ctrl+Enter does not crash the app', async ({ window }) => {
    await navigateToLiveCode(window)

    // Click the editor container to focus it, then send Ctrl+Enter.
    // The .monaco-editor selector targets the Monaco DOM root.
    // Fallback to the editor section if Monaco is not yet painted.
    const editorContainer = window.locator('.monaco-editor').first()
    const editorSection   = window.locator('[aria-label="Score editor"]').first()

    const target = (await editorContainer.count()) > 0 ? editorContainer : editorSection
    await target.click({ timeout: 5_000 }).catch(() => { /* non-fatal if Monaco not mounted */ })

    await window.keyboard.press('Control+Enter')

    // App still alive — transport toolbar still present
    await expect(window.getByRole('toolbar', { name: 'Transport controls' })).toBeVisible()
  })

  test('console log panel is present', async ({ window }) => {
    await navigateToLiveCode(window)
    await expect(window.getByRole('log', { name: 'Engine console' })).toBeVisible()
  })
})
