import { describe, it, expect } from 'vitest'
import { wolframCA, wolframRow } from '../../src/chaos/wolfram.js'

describe('wolframCA', () => {
  it('returns the correct number of generations (rows)', () => {
    const grid = wolframCA(30, 16, 8)
    expect(grid).toHaveLength(8)
  })

  it('each row has the correct width', () => {
    const grid = wolframCA(30, 16, 8)
    for (const row of grid) {
      expect(row).toHaveLength(16)
    }
  })

  it('all cells are 0 or 1', () => {
    const grid = wolframCA(30, 16, 8)
    for (const row of grid) {
      for (const cell of row) {
        expect([0, 1]).toContain(cell)
      }
    }
  })

  it('rule 0 — all cells become 0 after first generation', () => {
    const grid = wolframCA(0, 10, 3)
    // row 0 is the seed, row 1+ should all be 0
    expect(grid[1]!.every(c => c === 0)).toBe(true)
    expect(grid[2]!.every(c => c === 0)).toBe(true)
  })

  it('rule 255 — all cells become 1 after first generation', () => {
    const grid = wolframCA(255, 10, 3)
    expect(grid[1]!.every(c => c === 1)).toBe(true)
    expect(grid[2]!.every(c => c === 1)).toBe(true)
  })

  it('center seed produces a symmetric pattern for rule 90', () => {
    // Rule 90 = XOR of left and right — symmetric by construction
    const grid = wolframCA(90, 17, 5)
    for (const row of grid) {
      const rev = [...row].reverse()
      expect(row).toEqual(rev)
    }
  })

  it('seed parameter overrides the default center seed', () => {
    const seed = [1, 0, 0, 0, 0, 0, 0, 0]
    const grid = wolframCA(30, 8, 1, seed)
    expect(grid[0]).toEqual(seed)
  })

  it('throws ScoreError if rule < 0', () => {
    expect(() => wolframCA(-1, 16, 8)).toThrow()
  })

  it('throws ScoreError if rule > 255', () => {
    expect(() => wolframCA(256, 16, 8)).toThrow()
  })

  it('throws ScoreError if width < 1', () => {
    expect(() => wolframCA(30, 0, 8)).toThrow()
  })

  it('throws ScoreError if generations < 1', () => {
    expect(() => wolframCA(30, 16, 0)).toThrow()
  })
})

describe('wolframRow', () => {
  it('returns an array of 64 cells', () => {
    const row = wolframRow(30, 0)
    expect(row).toHaveLength(64)
  })

  it('all cells are 0 or 1', () => {
    const row = wolframRow(30, 4)
    for (const cell of row) {
      expect([0, 1]).toContain(cell)
    }
  })

  it('different generations produce different rows (rule 30)', () => {
    const r0 = wolframRow(30, 0)
    const r4 = wolframRow(30, 4)
    expect(r0).not.toEqual(r4)
  })
})
