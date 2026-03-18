// Fibonacci, Padovan, and Tribonacci sequences as rhythm generators
// These produce self-similar, non-periodic patterns with musical coherence

// fibonacci(n) → first n Fibonacci numbers: [1, 1, 2, 3, 5, 8, 13, 21, ...]
export const fibonacci = (n: number): number[] => {
  if (n <= 0) return []
  if (n === 1) return [1]
  const seq = [1, 1]
  while (seq.length < n) {
    seq.push((seq[seq.length - 1] ?? 0) + (seq[seq.length - 2] ?? 0))
  }
  return seq.slice(0, n)
}

// fibonacciRhythm(steps) → binary pattern using Fibonacci intervals
// Hits land at Fibonacci positions: 0, 1, 2, 3, 5, 8, 13...
// Creates an irregular but self-similar groove
export const fibonacciRhythm = (steps: number): number[] => {
  const fibPositions = new Set<number>()
  let a = 0, b = 1
  while (a < steps) {
    fibPositions.add(a)
    const next = a + b
    a = b
    b = next
  }
  return Array.from({ length: steps }, (_, i) => fibPositions.has(i) ? 1 : 0)
}

// padovan(n) → first n Padovan numbers: [1, 1, 1, 2, 2, 3, 4, 5, 7, 9, 12, ...]
// P(n) = P(n-2) + P(n-3)
export const padovan = (n: number): number[] => {
  if (n <= 0) return []
  if (n <= 3) return Array(n).fill(1) as number[]
  const seq = [1, 1, 1]
  while (seq.length < n) {
    seq.push((seq[seq.length - 2] ?? 0) + (seq[seq.length - 3] ?? 0))
  }
  return seq.slice(0, n)
}

// tribonacci(n) → first n Tribonacci numbers: [0, 0, 1, 1, 2, 4, 7, 13, ...]
// T(n) = T(n-1) + T(n-2) + T(n-3)
export const tribonacci = (n: number): number[] => {
  if (n <= 0) return []
  if (n === 1) return [0]
  if (n === 2) return [0, 0]
  const seq = [0, 0, 1]
  while (seq.length < n) {
    seq.push((seq[seq.length - 1] ?? 0) + (seq[seq.length - 2] ?? 0) + (seq[seq.length - 3] ?? 0))
  }
  return seq.slice(0, n)
}
