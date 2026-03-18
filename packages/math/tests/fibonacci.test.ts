import { describe, it, expect } from 'vitest'
import { fibonacci, fibonacciRhythm, padovan, tribonacci } from '../src/fibonacci.js'

describe('fibonacci', () => {
  it('returns [] for n=0', () => {
    expect(fibonacci(0)).toEqual([])
  })

  it('returns [1] for n=1', () => {
    expect(fibonacci(1)).toEqual([1])
  })

  it('returns first 8 Fibonacci numbers for n=8', () => {
    expect(fibonacci(8)).toEqual([1, 1, 2, 3, 5, 8, 13, 21])
  })

  it('returns exactly 10 elements for n=10', () => {
    expect(fibonacci(10)).toHaveLength(10)
  })
})

describe('fibonacciRhythm', () => {
  it('returns array of length 16 with hits at Fibonacci positions', () => {
    const rhythm = fibonacciRhythm(16)
    expect(rhythm).toHaveLength(16)
    // Fibonacci positions within 16: 0, 1, 2, 3, 5, 8, 13
    const hitPositions = rhythm
      .map((v, i) => (v === 1 ? i : -1))
      .filter(i => i !== -1)
    expect(hitPositions).toEqual([0, 1, 2, 3, 5, 8, 13])
  })
})

describe('padovan', () => {
  it('returns first 7 Padovan numbers', () => {
    expect(padovan(7)).toEqual([1, 1, 1, 2, 2, 3, 4])
  })
})

describe('tribonacci', () => {
  it('returns first 7 Tribonacci numbers', () => {
    expect(tribonacci(7)).toEqual([0, 0, 1, 1, 2, 4, 7])
  })
})
