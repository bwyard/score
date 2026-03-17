import { describe, it, expect, vi } from 'vitest'
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('new command', () => {
  it('throws ScoreError when no name given', async () => {
    const { newSong } = await import('../src/commands/new.js')
    expect(() => { newSong(['song']); }).toThrow() // 'song' is subcommand, name is missing
  })

  it('creates song file with template content', async () => {
    const { newSong } = await import('../src/commands/new.js')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const dir = join(tmpdir(), 'score-new-test')
    mkdirSync(dir, { recursive: true })
    const name = join(dir, `test-${String(Date.now())}.js`)
    newSong(['song', name])
    const { readFileSync } = await import('node:fs')
    const content = readFileSync(name, 'utf-8')
    expect(content).toContain('export default Song(')
    expect(content).toContain('bpm:')
    unlinkSync(name)
    vi.restoreAllMocks()
  })

  it('throws ScoreError if file already exists', async () => {
    const { newSong } = await import('../src/commands/new.js')
    const dir = join(tmpdir(), 'score-new-test-2')
    mkdirSync(dir, { recursive: true })
    const name = join(dir, `existing-${String(Date.now())}.js`)
    writeFileSync(name, 'existing', 'utf-8')
    expect(() => { newSong(['song', name]); }).toThrow()
    unlinkSync(name)
  })
})
