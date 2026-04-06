// accessibility.e2e.ts — WCAG 2.1 AA axe audits for Score Studio.
//
// Runs axe-core against each major view. Color contrast checks are enabled —
// dark theme palette must meet 4.5:1 text / 3:1 UI targets.
//
// NOTE: @axe-core/playwright uses browserContext.newPage() which Electron does
// not support (Protocol error: Target.createTarget). We inject axe-core directly
// via page.evaluate() instead — same analysis, Electron-compatible.

import { test, expect }  from './fixtures.js'
import { readFileSync }   from 'node:fs'
import { resolve }        from 'node:path'

// ── Axe injection ─────────────────────────────────────────────────────────────

type AxeViolation = {
  id:          string
  impact:      string | null
  description: string
  nodes:       ReadonlyArray<{ html: string }>
}
type AxeResults = { violations: AxeViolation[] }

/**
 * Resolve the axe-core min bundle. @axe-core/playwright lists axe-core as a
 * peer/direct dependency, so it's accessible from the packages/gui node_modules
 * via pnpm's symlink structure. Walk up until we find it.
 */
const resolveAxeSource = (): string => {
  // Try common locations relative to tests/e2e/
  const candidates = [
    // Monorepo root (4 up from tests/e2e)
    resolve(__dirname, '../../../../node_modules/axe-core/axe.min.js'),
    // pnpm virtual store (monorepo root)
    resolve(__dirname, '../../../../node_modules/.pnpm/axe-core@4.11.1/node_modules/axe-core/axe.min.js'),
    // packages/gui local (2 up from tests/e2e)
    resolve(__dirname, '../../node_modules/axe-core/axe.min.js'),
  ]
  for (const p of candidates) {
    try { return readFileSync(p, 'utf8') } catch { /* try next */ }
  }
  throw new Error('axe-core/axe.min.js not found — run pnpm install')
}

const AXE_SOURCE = resolveAxeSource()

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const runAxe = async (
  page:    import('@playwright/test').Page,
  include?: string,
): Promise<AxeViolation[]> => {
  const results: AxeResults = await page.evaluate(
    ([src, tags, selector]) => {
      // Inject axe-core if not already present
      if (!(window as unknown as { axe?: unknown }).axe) {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        new Function(src)()
      }
      const axe = (window as unknown as { axe: { run: (context: unknown, opts: unknown) => Promise<AxeResults> } }).axe
      const context = selector ? document.querySelector(selector) ?? document : document
      return axe.run(context, { runOnly: { type: 'tag', values: tags } })
    },
    [AXE_SOURCE, WCAG_TAGS, include ?? null] as const,
  )
  return results.violations
    .filter(v => v.impact === 'critical' || v.impact === 'serious')
}

// ── Splash screen ─────────────────────────────────────────────────────────────

test.describe('Accessibility — splash screen', () => {

  test('splash has no critical axe violations', async ({ raw: { page } }) => {
    const critical = await runAxe(page)
    if (critical.length > 0) {
      console.log('Splash axe violations:', JSON.stringify(critical.map(v => ({
        id: v.id, impact: v.impact, description: v.description,
        nodes: v.nodes.map(n => n.html),
      })), null, 2))
    }
    expect(critical).toHaveLength(0)
  })

})

// ── Live Code mode ────────────────────────────────────────────────────────────

test.describe('Accessibility — Live Code mode', () => {

  test('transport bar has no critical axe violations', async ({ livecode: { page } }) => {
    const critical = await runAxe(page, '[role="toolbar"]')
    if (critical.length > 0) {
      console.log('Transport axe violations:', JSON.stringify(critical.map(v => ({
        id: v.id, impact: v.impact, description: v.description,
      })), null, 2))
    }
    expect(critical).toHaveLength(0)
  })

  test('full Live Code view has no critical axe violations', async ({ livecode: { page } }) => {
    const critical = await runAxe(page)
    if (critical.length > 0) {
      console.log('Live Code axe violations:', JSON.stringify(critical.map(v => ({
        id: v.id, impact: v.impact, description: v.description,
        nodes: v.nodes.slice(0, 2).map(n => n.html),
      })), null, 2))
    }
    expect(critical).toHaveLength(0)
  })

})

// ── Modals ────────────────────────────────────────────────────────────────────

test.describe('Accessibility — modals', () => {

  test('instrument picker has no critical axe violations', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /add track/i }).click()
    const dialog = page.getByRole('dialog', { name: /pick an instrument/i })
    // Use 'attached' — fixed-position dialog may report invisible in hidden window
    await dialog.waitFor({ state: 'attached', timeout: 8000 })

    const critical = await runAxe(page, '[role="dialog"]')
    if (critical.length > 0) {
      console.log('Picker axe violations:', JSON.stringify(critical.map(v => ({
        id: v.id, impact: v.impact, description: v.description,
      })), null, 2))
    }
    expect(critical).toHaveLength(0)
  })

  test('bug report modal has no critical axe violations', async ({ livecode: { page } }) => {
    await page.getByRole('button', { name: /report.*issue/i }).click()
    await page.getByRole('dialog').waitFor()

    const critical = await runAxe(page, '[role="dialog"]')
    if (critical.length > 0) {
      console.log('Bug report axe violations:', JSON.stringify(critical.map(v => ({
        id: v.id, impact: v.impact, description: v.description,
      })), null, 2))
    }
    expect(critical).toHaveLength(0)
  })

})
