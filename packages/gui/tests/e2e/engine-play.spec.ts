// engine-play.spec.ts — Smoke test: play button toggles transport state.

import { test, expect, navigateToLiveCode } from './fixtures.js'

test.describe('Engine play', () => {
  test('play button is present in LiveCode mode', async ({ window }) => {
    await navigateToLiveCode(window)
    await expect(window.getByRole('button', { name: 'Play' })).toBeVisible()
  })

  test('clicking Play changes button label to Stop', async ({ window }) => {
    await navigateToLiveCode(window)
    await window.getByRole('button', { name: 'Play' }).click()
    await expect(window.getByRole('button', { name: 'Stop' })).toBeVisible({ timeout: 5_000 })
  })

  test('clicking Stop returns button label to Play', async ({ window }) => {
    await navigateToLiveCode(window)
    await window.getByRole('button', { name: 'Play' }).click()
    await expect(window.getByRole('button', { name: 'Stop' })).toBeVisible({ timeout: 5_000 })
    await window.getByRole('button', { name: 'Stop' }).click()
    await expect(window.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 5_000 })
  })
})
