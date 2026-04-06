// mixer.e2e.ts — Mixer and MixerStrip e2e tests.

import { test, expect } from './fixtures.js'

// NOTE: Mixer strip tests click "Run" to populate tracks.
// SCORE_TEST=1 is set in test fixtures — the engine mutes master output (volume=0)
// so the app processes the song but produces no audio from speakers.

test.describe('Mixer — rendering', () => {

  test('mixer panel is visible', async ({ livecode: { page } }) => {
    await expect(
      page.getByRole('heading', { name: /mixer/i })
        .or(page.locator('[aria-label*="mixer"]'))
        .first()
    ).toBeVisible({ timeout: 3000 })
  })

  test('starter song renders mixer strips after Run', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /run song/i }).click()
    // After eval the starter song has 7 tracks — at least one volume slider visible
    await expect(
      page.getByRole('slider', { name: /volume/i }).first()
    ).toBeVisible({ timeout: 8000 })
  })

})

test.describe('Mixer — mute', () => {

  test('mute button is present per strip', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /run song/i }).click()
    await expect(
      page.getByRole('button', { name: /mute/i }).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('mute button toggles aria-pressed', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /run song/i }).click()
    const muteBtn = page.getByRole('button', { name: /mute/i }).first()
    await muteBtn.waitFor({ timeout: 5000 })

    await expect(muteBtn).toHaveAttribute('aria-pressed', 'false')
    await muteBtn.click()
    await expect(muteBtn).toHaveAttribute('aria-pressed', 'true')
    await muteBtn.click()
    await expect(muteBtn).toHaveAttribute('aria-pressed', 'false')
  })

})

test.describe('Mixer — solo', () => {

  test('solo button is present per strip', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /run song/i }).click()
    await expect(
      page.getByRole('button', { name: /solo/i }).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('solo button toggles aria-pressed', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /run song/i }).click()
    const soloBtn = page.getByRole('button', { name: /solo/i }).first()
    await soloBtn.waitFor({ timeout: 5000 })

    await expect(soloBtn).toHaveAttribute('aria-pressed', 'false')
    await soloBtn.click()
    await expect(soloBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('soloing one track clears solo on another', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /run song/i }).click()
    const soloButtons = page.getByRole('button', { name: /solo/i })
    await soloButtons.first().waitFor({ timeout: 5000 })

    const count = await soloButtons.count()
    if (count < 2) test.skip()

    await soloButtons.nth(0).click()
    await expect(soloButtons.nth(0)).toHaveAttribute('aria-pressed', 'true')

    await soloButtons.nth(1).click()
    await expect(soloButtons.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(soloButtons.nth(0)).toHaveAttribute('aria-pressed', 'false')
  })

})

test.describe('Mixer — volume', () => {

  test('volume fader is present per strip', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /run song/i }).click()
    await expect(
      page.getByRole('slider', { name: /volume/i }).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('pan slider is present per strip', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /run song/i }).click()
    await expect(
      page.getByRole('slider', { name: /pan/i }).first()
    ).toBeVisible({ timeout: 5000 })
  })

})
