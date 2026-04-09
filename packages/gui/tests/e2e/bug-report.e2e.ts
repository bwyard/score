// bug-report.e2e.ts — Bug report modal e2e tests.

import { test, expect } from './fixtures.js'
import path              from 'node:path'
import fs                from 'node:fs'

test.describe('Bug report modal — open/close', () => {

  test('Report Issue button opens modal', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    await expect(page.getByRole('dialog', { name: /report an issue/i })).toBeVisible()
  })

  test('modal has correct ARIA', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  test('close button dismisses modal', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    // Scope to dialog — other panels also have Close buttons (Close Step Grid, Close Mixer)
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Escape key dismisses modal', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Cancel button dismisses modal', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

})

test.describe('Bug report modal — content', () => {

  test('description textarea is present', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    await expect(page.getByRole('textbox', { name: /what happened/i })).toBeVisible()
  })

  test('Copy Report button is present', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    await expect(page.getByRole('button', { name: /copy report/i })).toBeVisible()
  })

  test('Save Report button is present', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    await expect(page.getByRole('button', { name: /save report/i })).toBeVisible()
  })

})

test.describe('Bug report modal — submission', () => {

  test('Save Report writes to debug/report.json', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    await page.getByRole('textbox', { name: /what happened/i }).fill('e2e test report')
    await page.getByRole('button', { name: /save report/i }).click()

    // Wait a moment for file write
    await page.waitForTimeout(1000)

    const reportPath = path.resolve(__dirname, '../../../../debug/report.json')
    const exists = fs.existsSync(reportPath)
    expect(exists).toBe(true)

    if (exists) {
      const content = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Record<string, unknown>
      expect(content).toHaveProperty('description')
      expect(content).toHaveProperty('code')
      expect(content).toHaveProperty('timestamp')
    }
  })

})
