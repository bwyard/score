// instrument-picker.e2e.ts — InstrumentPicker modal e2e tests.
//
// NOTE: exact:true required for ambiguous names — "Kick" is a substring of
// "Kick 808", "Kick 909", etc. Without exact the locator resolves to many elements.
// Category labels scoped to the dialog to avoid matching button text ("Bass" appears
// in "Wobble Bass", "Bass 303", etc.).

import { test, expect } from './fixtures.js'

// Helper — open the picker and wait for the dialog to be ready
const openPicker = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: /add track/i }).click()
  const dialog = page.getByRole('dialog', { name: /pick an instrument/i })
  await dialog.waitFor({ state: 'visible', timeout: 8000 })
  return dialog
}

test.describe('Instrument picker — open/close', () => {

  test('Add Track button opens picker', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await expect(dialog).toBeVisible()
  })

  test('picker has dialog role and aria-modal', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  test('close button dismisses picker', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('Escape key dismisses picker', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

})

test.describe('Instrument picker — categories', () => {

  test('shows Drums category', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await expect(dialog.getByText('Drums', { exact: true })).toBeVisible()
  })

  test('shows Bass category', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await expect(dialog.getByText('Bass', { exact: true })).toBeVisible()
  })

  test('shows Synths category', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await expect(dialog.getByText('Synths', { exact: true })).toBeVisible()
  })

  test('shows Other category', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await expect(dialog.getByText('Other', { exact: true })).toBeVisible()
  })

})

test.describe('Instrument picker — instruments', () => {

  const drums  = ['Kick 808', 'Kick 909', 'Kick Hardstyle', 'Kick Hardcore', 'Kick',
                  'Snare 909', 'Snare', 'Clap 909', 'Hi-Hat 808', 'Open Hat 808', 'Hi-Hat', 'Cowbell 808']
  const bass   = ['Bass 303', 'Wobble Bass', 'Sub Synth']
  const synths = ['Supersaw', 'Pad', 'FM Synth', 'Rhodes', 'Pluck', 'Synth']
  const other  = ['Arp', 'Theremin', 'Sax', 'Sample']

  for (const name of [...drums, ...bass, ...synths, ...other]) {
    test(`shows ${name} button`, async ({ livecode: { page } }) => {
      const dialog = await openPicker(page)
      // exact:true — "Kick" must not match "Kick 808", "Synth" must not match "FM Synth", etc.
      await expect(dialog.getByRole('button', { name, exact: true })).toBeVisible()
    })
  }

})

test.describe('Instrument picker — selection', () => {

  test('selecting Kick 808 closes picker', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await dialog.getByRole('button', { name: 'Kick 808', exact: true }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('selecting Bass 303 closes picker', async ({ livecode: { page } }) => {
    const dialog = await openPicker(page)
    await dialog.getByRole('button', { name: 'Bass 303', exact: true }).click()
    await expect(dialog).not.toBeVisible()
  })

})

test.describe('Instrument picker — focus trap', () => {

  test('Tab cycles within dialog', async ({ livecode: { page } }) => {
    await openPicker(page)
    // Tab several times — focus should stay within the dialog
    for (let i = 0; i < 10; i++) await page.keyboard.press('Tab')
    const focused = await page.evaluate(
      () => document.activeElement?.closest('[role="dialog"]') !== null
    )
    expect(focused).toBe(true)
  })

})
