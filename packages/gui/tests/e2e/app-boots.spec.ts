// app-boots.spec.ts — Smoke test: Score Studio Electron window boots correctly.

import { test, expect } from './fixtures.js'

test.describe('App boots', () => {
  test('window is visible', async ({ window }) => {
    expect(await window.isVisible('body')).toBe(true)
  })

  test('splash screen shows Score Studio heading', async ({ window }) => {
    await expect(window.getByRole('heading', { name: 'Score Studio' })).toBeVisible()
  })

  test('splash screen shows mode selector', async ({ window }) => {
    await expect(window.getByRole('main', { name: 'Score Studio mode selector' })).toBeVisible()
  })

  test('Live Code mode is pre-selected', async ({ window }) => {
    const liveCodeBtn = window.getByRole('button', { name: 'Live Code' })
    await expect(liveCodeBtn).toBeVisible()
    await expect(liveCodeBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('Start Live Code button is enabled', async ({ window }) => {
    await expect(window.getByRole('button', { name: 'Start Live Code' })).toBeEnabled()
  })
})
