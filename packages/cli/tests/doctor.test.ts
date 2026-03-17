import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock child_process before importing doctor
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

vi.mock('node:module', () => ({
  createRequire: vi.fn(() => ({
    resolve: vi.fn(),
  })),
}))

import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { doctor } from '../src/commands/doctor.js'

afterEach(() => {
  vi.clearAllMocks()
})

describe('doctor', () => {
  it('prints Node.js version', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.mocked(execSync).mockReturnValue('9.0.0\n' as unknown as string)
    vi.mocked(createRequire).mockReturnValue({ resolve: vi.fn() } as unknown as ReturnType<typeof createRequire>)

    doctor([])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('Node.js')
    expect(output).toContain(process.version)
    spy.mockRestore()
  })

  it('shows checkmark when Node >= 20', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.mocked(execSync).mockReturnValue('9.0.0\n' as unknown as string)
    vi.mocked(createRequire).mockReturnValue({ resolve: vi.fn() } as unknown as ReturnType<typeof createRequire>)

    doctor([])

    // process.version in test environment is >= 20 (Node 20 LTS)
    const nodeMajor = parseInt(process.version.slice(1), 10)
    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    if (nodeMajor >= 20) {
      expect(output).toContain('✓ Node.js')
    } else {
      expect(output).toContain('✗ Node.js')
    }
    spy.mockRestore()
  })

  it('shows pnpm version when available', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.mocked(execSync).mockReturnValue('9.0.0\n' as unknown as string)
    vi.mocked(createRequire).mockReturnValue({ resolve: vi.fn() } as unknown as ReturnType<typeof createRequire>)

    doctor([])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('✓ pnpm 9.0.0')
    spy.mockRestore()
  })

  it('shows error when pnpm not found', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not found') })
    vi.mocked(createRequire).mockReturnValue({ resolve: vi.fn() } as unknown as ReturnType<typeof createRequire>)

    doctor([])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('✗ pnpm')
    spy.mockRestore()
  })

  it('shows error when node-web-audio-api not found', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.mocked(execSync).mockReturnValue('9.0.0\n' as unknown as string)
    const mockResolve = vi.fn().mockImplementation(() => { throw new Error('Cannot find module') })
    vi.mocked(createRequire).mockReturnValue({ resolve: mockResolve } as unknown as ReturnType<typeof createRequire>)

    doctor([])

    const output = spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(output).toContain('✗ node-web-audio-api')
    spy.mockRestore()
  })
})
