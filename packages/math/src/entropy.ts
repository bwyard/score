// Shannon entropy of binary patterns
// Measures how unpredictable/complex a pattern is
// Most musical patterns land in the 0.6–0.95 range
// 0 = totally predictable (all 0s or all 1s)
// 1 = maximum entropy (perfectly alternating or random)

// entropy(pattern) → Shannon entropy of binary pattern, normalized 0-1
export const entropy = (pattern: number[]): number => {
  if (pattern.length === 0) return 0
  const ones = pattern.filter(v => v > 0).length
  const zeros = pattern.length - ones
  const p1 = ones / pattern.length
  const p0 = zeros / pattern.length
  if (p1 === 0 || p0 === 0) return 0
  return -(p1 * Math.log2(p1) + p0 * Math.log2(p0))
}

// isMusical(pattern) → true if entropy is in the 0.6–0.95 range
// Use to validate programmatically generated patterns
export const isMusical = (pattern: number[]): boolean => {
  const e = entropy(pattern)
  return e >= 0.6 && e <= 0.95
}

// density(pattern) → fraction of steps that are hits (0-1)
// 0.25 = one hit per 4 steps (sparse), 0.5 = half are hits (normal), 0.75 = dense
export const density = (pattern: number[]): number => {
  if (pattern.length === 0) return 0
  return pattern.filter(v => v > 0).length / pattern.length
}
