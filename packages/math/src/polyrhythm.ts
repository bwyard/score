// Polyrhythm and boolean pattern operations

// lcm(a, b) → lowest common multiple
export const lcm = (a: number, b: number): number => {
  const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y)
  return Math.abs(a * b) / gcd(a, b)
}

// polyrhythm(rhythmA, rhythmB) → combined pattern over the LCM length
// Merges two patterns of different lengths by tiling them to the LCM length
// Returns 1 wherever either pattern has a hit
export const polyrhythm = (rhythmA: number[], rhythmB: number[]): number[] => {
  const length = lcm(rhythmA.length, rhythmB.length)
  return Array.from({ length }, (_, i) => {
    const a = rhythmA[i % rhythmA.length] ?? 0
    const b = rhythmB[i % rhythmB.length] ?? 0
    return a > 0 || b > 0 ? 1 : 0
  })
}

// patternOr(a, b) → union: 1 where either pattern has a hit
export const patternOr = (a: number[], b: number[]): number[] => {
  const length = Math.max(a.length, b.length)
  return Array.from({ length }, (_, i) => ((a[i] ?? 0) > 0 || (b[i] ?? 0) > 0) ? 1 : 0)
}

// patternAnd(a, b) → intersection: 1 only where both patterns have hits
export const patternAnd = (a: number[], b: number[]): number[] => {
  const length = Math.max(a.length, b.length)
  return Array.from({ length }, (_, i) => ((a[i] ?? 0) > 0 && (b[i] ?? 0) > 0) ? 1 : 0)
}

// patternXor(a, b) → exclusive or: 1 where exactly one has a hit
export const patternXor = (a: number[], b: number[]): number[] => {
  const length = Math.max(a.length, b.length)
  return Array.from({ length }, (_, i) => {
    const av = (a[i] ?? 0) > 0
    const bv = (b[i] ?? 0) > 0
    return av !== bv ? 1 : 0
  })
}

// patternNot(pattern) → complement: flip all hits and silences
export const patternNot = (pattern: number[]): number[] =>
  pattern.map(v => v > 0 ? 0 : 1)

// tile(pattern, length) → repeat pattern to fill exactly `length` steps
export const tile = (pattern: number[], length: number): number[] =>
  Array.from({ length }, (_, i) => pattern[i % pattern.length] ?? 0)
