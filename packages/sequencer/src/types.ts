export type PatternInput<T = number> = T[] | Pattern<T>
export type Pattern<T> = (step: number, bar: number) => T
export type TransportState = 'stopped' | 'playing' | 'paused'
export type Position = { bar: number; beat: number; tick: number }
export type SwingConfig = { amount: number } // 0-1, 0 = straight, 1 = full triplet
