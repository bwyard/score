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

// ── Canvas stub ───────────────────────────────────────────────────────────────
// jsdom does not implement canvas. Stub getContext so canvas components mount
// without throwing "Not implemented: HTMLCanvasElement.prototype.getContext".
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(),
  scale: vi.fn(), setTransform: vi.fn(), transform: vi.fn(),
  save: vi.fn(), restore: vi.fn(),
  beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
  arc: vi.fn(), fill: vi.fn(), measureText: vi.fn(() => ({ width: 0 })),
  set fillStyle(_: unknown) {}, set strokeStyle(_: unknown) {},
  set shadowColor(_: unknown) {}, set shadowBlur(_: unknown) {},
  set font(_: unknown) {}, set textAlign(_: unknown) {},
  set textBaseline(_: unknown) {}, set lineWidth(_: unknown) {},
  set lineCap(_: unknown) {}, set lineJoin(_: unknown) {},
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  set globalAlpha(_: unknown) {},
})) as unknown as typeof HTMLCanvasElement.prototype.getContext

// ── ResizeObserver stub ────────────────────────────────────────────────────────
// jsdom does not implement ResizeObserver. Provide a no-op stub so canvas
// components that use it for responsive sizing mount cleanly in tests.
globalThis.ResizeObserver = class {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}

// ── scrollIntoView stub ───────────────────────────────────────────────────────
// jsdom does not implement scrollIntoView. Stub it so ConsoleLog auto-scroll
// does not throw "scrollIntoView is not a function" in tests.
window.HTMLElement.prototype.scrollIntoView = vi.fn()

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
