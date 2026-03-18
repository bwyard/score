// euclidean(3, 8) → [1,0,0,1,0,0,1,0]  (classic clave rhythm)
// euclidean(5, 8) → [1,0,1,0,1,0,1,0]  (bossa nova)
// euclidean(4, 16) → [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]

export const euclidean = (hits: number, steps: number, rotation = 0): number[] => {
  // Ceiling-division placement: pos(i) = floor((i * steps + hits - 1) / hits)
  // Produces the canonical Bjorklund form — first hit always at position 0
  if (hits <= 0) return Array(steps).fill(0) as number[]
  if (hits >= steps) return Array(steps).fill(1) as number[]

  const positions = new Set(
    Array.from({ length: hits }, (_, i) => Math.floor((i * steps + hits - 1) / hits))
  )
  const pattern = Array.from({ length: steps }, (_, i) => (positions.has(i) ? 1 : 0))

  // Apply rotation
  if (rotation !== 0) {
    const r = ((rotation % steps) + steps) % steps
    return [...pattern.slice(r), ...pattern.slice(0, r)]
  }
  return pattern
}
