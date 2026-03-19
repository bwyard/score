import { describe, it, expect } from 'vitest'
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { validateSongFile } from '../src/validator/SongValidator.js'
import { validateSongExport } from '../src/validator/SongExportValidator.js'

// Helper — write a temp JS file and return its path
const writeTempFile = (content: string): string => {
  const dir = join(tmpdir(), 'score-validator-tests')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `test-song-${String(Date.now())}-${String(Math.random()).slice(2)}.mjs`)
  writeFileSync(path, content, 'utf-8')
  return path
}

describe('validateSongFile', () => {
  it('passes a valid song file without throwing', () => {
    const path = writeTempFile(`
      import { Song } from '@score/dsl'
      export default { _type: 'SongDefinition', bpm: 140, tracks: [], arrangement: [] }
    `)
    expect(() => { validateSongFile(path); }).not.toThrow()
    unlinkSync(path)
  })

  it('throws when file imports from "fs"', () => {
    const path = writeTempFile(`import fs from 'fs'\nexport default {}`)
    try {
      expect(() => { validateSongFile(path); }).toThrow(/fs/)
    } finally {
      unlinkSync(path)
    }
  })

  it('throws when file imports from "child_process"', () => {
    const path = writeTempFile(`import { exec } from 'child_process'\nexport default {}`)
    try {
      expect(() => { validateSongFile(path); }).toThrow()
    } finally {
      unlinkSync(path)
    }
  })

  it('throws when file calls eval()', () => {
    const path = writeTempFile(`eval('1 + 1')\nexport default {}`)
    try {
      expect(() => { validateSongFile(path); }).toThrow(/eval/)
    } finally {
      unlinkSync(path)
    }
  })

  it('throws when file uses new Function()', () => {
    const path = writeTempFile(`const f = new Function('return 1')\nexport default {}`)
    try {
      expect(() => { validateSongFile(path); }).toThrow()
    } finally {
      unlinkSync(path)
    }
  })

  it('throws when file accesses process.*', () => {
    const path = writeTempFile(`process.exit(0)\nexport default {}`)
    try {
      expect(() => { validateSongFile(path); }).toThrow(/process/)
    } finally {
      unlinkSync(path)
    }
  })
})

describe('validateSongExport', () => {
  it('passes a valid Song object without throwing', () => {
    const validSong = {
      _type: 'SongDefinition' as const,
      bpm: 140,
      tracks: [{ _type: 'TrackComponent', component: {} }],
      arrangement: [
        { _type: 'SectionDefinition', sectionType: 'drop', bars: 16, tracks: [] },
      ],
    }
    expect(() => { validateSongExport(validSong); }).not.toThrow()
  })

  it('throws when _type is not "SongDefinition"', () => {
    const bad = {
      _type: 'SomethingElse',
      bpm: 140,
      tracks: [{}],
      arrangement: [],
    }
    expect(() => { validateSongExport(bad); }).toThrow()
  })

  it('throws when bpm is 0', () => {
    const bad = {
      _type: 'SongDefinition',
      bpm: 0,
      tracks: [{}],
      arrangement: [],
    }
    expect(() => { validateSongExport(bad); }).toThrow()
  })

  it('throws when bpm is 500 (above max)', () => {
    const bad = {
      _type: 'SongDefinition',
      bpm: 500,
      tracks: [{}],
      arrangement: [],
    }
    expect(() => { validateSongExport(bad); }).toThrow()
  })

  it('throws when tracks array is empty', () => {
    const bad = {
      _type: 'SongDefinition',
      bpm: 140,
      tracks: [],
      arrangement: [],
    }
    expect(() => { validateSongExport(bad); }).toThrow()
  })

  it('throws when exported value is not an object', () => {
    expect(() => { validateSongExport(42); }).toThrow()
    expect(() => { validateSongExport('hello'); }).toThrow()
    expect(() => { validateSongExport(null); }).toThrow()
    expect(() => { validateSongExport(undefined); }).toThrow()
  })
})
