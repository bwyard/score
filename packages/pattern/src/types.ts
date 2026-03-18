// A pattern is either a static array or a function from (step, bar) → value
export type PatternArray<T> = T[]
export type PatternFn<T> = (step: number, bar: number) => T
export type PatternInput<T = number> = PatternArray<T> | PatternFn<T>

// Resolve any PatternInput to an array of `length` steps at bar `bar`
export const resolvePattern = <T>(input: PatternInput<T>, length: number, bar = 0): T[] => {
  if (Array.isArray(input)) return input
  return Array.from({ length }, (_, step) => input(step, bar))
}
