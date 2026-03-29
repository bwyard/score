// mode-switch.spec.ts — Smoke test: navigating between splash and LiveCode does not crash.

import { test, expect, navigateToLiveCode } from './fixtures.js'

test.describe('Mode switch', () => {
  test('can navigate from splash to LiveCode', async ({ window }) => {
    await navigateToLiveCode(window)
    await expect(window.getByRole('toolbar', { name: 'Transport controls' })).toBeVisible()
  })

  test('home button returns to splash screen', async ({ window }) => {
    await navigateToLiveCode(window)
    await window.getByRole('button', { name: 'Score Studio home' }).click()
    await expect(window.getByRole('heading', { name: 'Score Studio' })).toBeVisible()
  })

  test('can re-enter LiveCode after going home', async ({ window }) => {
    await navigateToLiveCode(window)
    await window.getByRole('button', { name: 'Score Studio home' }).click()
    await expect(window.getByRole('heading', { name: 'Score Studio' })).toBeVisible()
    await navigateToLiveCode(window)
    await expect(window.getByRole('toolbar', { name: 'Transport controls' })).toBeVisible()
  })
})
