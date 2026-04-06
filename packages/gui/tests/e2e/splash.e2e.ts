// splash.e2e.ts — Splash screen / mode selector e2e tests.

import { test, expect } from './fixtures.js'

test.describe('Splash screen', () => {

  test('renders title and tagline', async ({ raw: { page } }) => {
    await expect(page.getByText('Score Studio')).toBeVisible()
    await expect(page.getByText(/what are you doing today/i)).toBeVisible()
  })

  test('shows all four mode buttons', async ({ raw: { page } }) => {
    // Live Code is the only enabled button. Produce/DJ Set/Jam Session are disabled
    // with aria-label="X — coming soon" — match on the group container instead.
    const modeGroup = page.getByRole('group', { name: /studio modes/i })
    await expect(modeGroup).toBeVisible()
    await expect(modeGroup.getByRole('button', { name: 'Live Code', exact: true })).toBeVisible()
    await expect(modeGroup.getByText('Produce')).toBeVisible()
    await expect(modeGroup.getByText('DJ Set')).toBeVisible()
    await expect(modeGroup.getByText('Jam Session')).toBeVisible()
  })

  test('shows hardware selection buttons', async ({ raw: { page } }) => {
    await expect(page.getByRole('button', { name: /pc only/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /\+ controller/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /\+ aio/i })).toBeVisible()
  })

  test('start button is present', async ({ raw: { page } }) => {
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible()
  })

  test('selecting Live Code updates start button label', async ({ raw: { page } }) => {
    await page.getByRole('button', { name: 'Live Code', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Start Live Code', exact: true })).toBeVisible()
  })

  test('Live Code mode aria-pressed is true when selected', async ({ raw: { page } }) => {
    await page.getByRole('button', { name: 'Live Code', exact: true }).click()
    const btn = page.getByRole('button', { name: 'Live Code', exact: true })
    await expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  test('navigates to Live Code mode on start', async ({ raw: { page } }) => {
    await page.getByRole('button', { name: 'Live Code', exact: true }).click()
    await page.getByRole('button', { name: 'Start Live Code', exact: true }).click()
    await expect(page.getByRole('toolbar')).toBeVisible()
  })

})
