// Unique ID generator for AudioComponent instances
// Pattern: `${type}-${counter}` where counter increments globally

let counter = 0

export const uid = (type: string): string => `${type}-${String(++counter)}`

// Reset counter (for testing only)
export const resetUidCounter = (): void => { counter = 0 }
