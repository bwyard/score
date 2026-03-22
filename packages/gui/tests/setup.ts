import { vi, afterEach }             from 'vitest'
import '@testing-library/jest-dom/vitest'
import 'vitest-axe/extend-expect'
import { configureAxe }              from 'vitest-axe'

// ── Axe accessibility helper ───────────────────────────────────────────────────
// vitest-axe extends Vitest's expect with toHaveNoViolations().
// Usage: const results = await axe(container); expect(results).toHaveNoViolations()

export const axe = configureAxe({
  rules: {
    // colour-contrast checks require real viewport rendering — skip in jsdom
    'color-contrast': { enabled: false },
  },
})

// ── Electron IPC bridge mock ───────────────────────────────────────────────────
// window.scoreBridge is injected by the Electron preload in production.
// In jsdom tests we provide a mock so components can be tested in isolation.

const mockHandlers = new Map<string, Set<(payload: unknown) => void>>()

const scoreBridgeMock = {
  send: vi.fn(),
  on:   vi.fn((channel: string, handler: (payload: unknown) => void) => {
    if (!mockHandlers.has(channel)) mockHandlers.set(channel, new Set())
    mockHandlers.get(channel)!.add(handler)
    return () => mockHandlers.get(channel)?.delete(handler)
  }),
}

Object.defineProperty(window, 'scoreBridge', {
  value:    scoreBridgeMock,
  writable: true,
})

/** Emit a mocked main→renderer event in tests. */
export const emitBridgeEvent = (channel: string, payload: unknown): void => {
  mockHandlers.get(channel)?.forEach(h => { h(payload); })
}

/** Reset all bridge mock call counts between tests. */
afterEach(() => {
  vi.clearAllMocks()
  mockHandlers.clear()
})
