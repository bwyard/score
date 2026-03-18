import type { PatternInput, PatternFn } from './types.js'
import { resolvePattern } from './types.js'

// fast(2, [1,0,1,0]) → runs pattern 2x faster (double-time feel over same bar)
// Implemented by repeating the pattern n times within the same length
export const fast = <T>(n: number, pattern: PatternInput<T>): PatternFn<T> =>
  (step: number, bar: number) => {
    const arr = Array.isArray(pattern)
      ? pattern
      : resolvePattern(pattern, Math.ceil(16 / n), bar)
    return arr[(step * n) % arr.length] as T
  }

// slow(2, [1,0,1,0,1,0,1,0]) → runs pattern 2x slower (half-time)
export const slow = <T>(n: number, pattern: PatternInput<T>): PatternFn<T> => {
  const baseLen = Array.isArray(pattern) ? pattern.length : 16
  return (step: number, bar: number) => {
    const expanded = resolvePattern(pattern, baseLen, bar)
    const slowStep = Math.floor(step / n) % expanded.length
    return expanded[slowStep] as T
  }
}

// rev(pattern) → reverses the pattern
export const rev = <T>(pattern: PatternInput<T>): PatternFn<T> =>
  (step: number, bar: number) => {
    const arr = resolvePattern(pattern, Array.isArray(pattern) ? pattern.length : 16, bar)
    return arr[arr.length - 1 - (step % arr.length)] as T
  }

// every(n, transform, pattern) → applies transform every n bars
export const every = <T>(
  n: number,
  transform: (p: PatternInput<T>) => PatternInput<T>,
  pattern: PatternInput<T>,
): PatternFn<T> =>
  (step: number, bar: number) => {
    const active = bar % n === 0 ? transform(pattern) : pattern
    const arr = resolvePattern(active, Array.isArray(active) ? (active as T[]).length : 16, bar)
    return arr[step % arr.length] as T
  }

// degrade(probability, pattern) → randomly drops hits (0 = keep all, 1 = drop all)
// Uses seeded randomness based on step+bar so it's consistent within a bar
export const degrade = (probability: number, pattern: PatternInput): PatternFn<number> =>
  (step: number, bar: number) => {
    const arr = resolvePattern(pattern, Array.isArray(pattern) ? pattern.length : 16, bar)
    const val = arr[step % arr.length] ?? 0
    if (val === 0) return 0
    // Simple deterministic "random" based on step + bar
    const seed = (step * 1237 + bar * 4567) % 9999
    return (seed / 9999) < probability ? 0 : val
  }

// shift(n, pattern) → rotates pattern by n steps
export const shift = <T>(n: number, pattern: PatternInput<T>): PatternFn<T> =>
  (step: number, bar: number) => {
    const arr = resolvePattern(pattern, Array.isArray(pattern) ? pattern.length : 16, bar)
    return arr[((step - n) % arr.length + arr.length) % arr.length] as T
  }
