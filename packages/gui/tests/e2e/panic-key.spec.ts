// panic-key.spec.ts — Smoke test: Ctrl+. panic key stops the engine.
//
// The panic key (Cmd/Ctrl+.) triggers an immediate all-stop.
// After panic, the Play button should be visible (engine stopped).

import { test, expect, navigateToLiveCode } from './fixtures.js'

test.describe('Panic key', () => {
  test('Ctrl+. does not crash the app when engine is stopped', async ({ window }) => {
    await navigateToLiveCode(window)
    await window.keyboard.press('Control+.')
    // App still alive
    await expect(window.getByRole('toolbar', { name: 'Transport controls' })).toBeVisible()
  })

  test('Ctrl+. while playing returns to stopped state', async ({ window }) => {
    await navigateToLiveCode(window)

    // Start engine
    await window.getByRole('button', { name: 'Play' }).click()
    await expect(window.getByRole('button', { name: 'Stop' })).toBeVisible({ timeout: 5_000 })

    // Trigger panic
    await window.keyboard.press('Control+.')

    // Engine should stop — Play button returns
    await expect(window.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 5_000 })
  })
})
