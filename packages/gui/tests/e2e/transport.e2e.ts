// transport.e2e.ts — Transport bar e2e tests.
//
// NOTE: exact:true on play/stop buttons — "Eval song (load without playing)"
// also matches /play/i without exact, causing strict mode violations.

import { test, expect } from './fixtures.js'

test.describe('Transport bar', () => {

  test('renders with correct role', async ({ livecode: { page } }) => {
    await expect(page.getByRole('toolbar')).toBeVisible()
  })

  test('play button is present and labelled', async ({ livecode: { page } }) => {
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  })

  test('play button has aria-pressed false when stopped', async ({ livecode: { page } }) => {
    const btn = page.getByRole('button', { name: 'Play', exact: true })
    await expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  test('clicking play toggles to stop button', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible()
  })

  test('clicking stop after play returns to play button', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  })

  test('BPM input is present and has default value', async ({ livecode: { page } }) => {
    const bpm = page.getByRole('spinbutton', { name: /bpm/i })
    await expect(bpm).toBeVisible()
    const value = await bpm.inputValue()
    expect(Number(value)).toBeGreaterThan(0)
    expect(Number(value)).toBeLessThanOrEqual(300)
  })

  test('BPM input accepts valid value', async ({ livecode: { page } }) => {
    const bpm = page.getByRole('spinbutton', { name: /bpm/i })
    await bpm.fill('140')
    await bpm.press('Enter')
    await expect(bpm).toHaveValue('140')
  })

  test('report issue button is present', async ({ livecode: { page } }) => {
    await expect(page.getByRole('button', { name: /report.*issue/i })).toBeVisible()
  })

  test('Ctrl+. triggers panic stop', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible()
    await page.keyboard.press('Control+.')
    // Renderer keydown handler sends transport:stop — play button should reappear
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible({ timeout: 5000 })
  })

})
