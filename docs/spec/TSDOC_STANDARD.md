# Score — TSDoc Standard

All public API exports in Score use **TSDoc** — the TypeScript-aware superset of JSDoc.
Generator: **TypeDoc** (`pnpm docs` → `docs/api/`).

This is mandatory on every exported function, type alias, interface, and enum.
It is NOT required on internal helpers or anything not exported from `index.ts`.

---

## Why TSDoc not JSDoc

- TypeDoc reads TypeScript types directly — no need to repeat `{string}` annotations
- Types appear automatically in generated docs from the `.d.ts` files
- TSDoc `@param` only needs the *description*, not the type
- Used by: TypeScript itself, Tone.js, RxJS, Rush monorepo, fast-check

---

## Format — The Rules

### 1. Every exported symbol gets a doc block

```ts
// ❌ Wrong — inline comment, no TSDoc
// fast(2, pat) — double time
export const fast = ...

// ✅ Correct — TSDoc block
/**
 * Double the playback speed of a pattern.
 * Each step plays twice as fast — a 4/4 kick becomes 4/2.
 *
 * @param n - Speed multiplier. `2` = double time, `4` = quadruple time.
 * @param pattern - The source pattern (array or function).
 * @returns A pattern function that plays the source at `n×` speed.
 *
 * @example
 * ```ts
 * const kick = Kick({ pattern: fast(2, [1, 0, 0, 0]) })
 * ```
 *
 * @see slow — the inverse operation
 */
export const fast = ...
```

### 2. `@param` — describe what it does, not its type

TypeScript already has the type. The description should answer:
"what does this value control, and what are the meaningful values?"

```ts
// ❌ Wrong
@param n {number} The number
@param pattern {PatternInput} The pattern

// ✅ Correct
@param n - Speed multiplier. `2` = double time. `0.5` = half time. Must be > 0.
@param pattern - Source pattern as an array `[1,0,0,0]` or step function `(step, bar) => value`.
```

### 3. `@returns` — describe what comes back and why it matters

```ts
// ❌ Wrong
@returns PatternFn

// ✅ Correct
@returns A step function `(step, bar) => T` — pass directly to any `pattern:` prop.
```

### 4. `@example` — always include a real song usage example

Examples should show how the function is used in a real song context, not in isolation.

```ts
/**
 * @example
 * ```ts
 * // Euclidean kick — 3 hits evenly spaced across 8 steps (classic clave)
 * const kick = Kick({ pattern: euclidean(3, 8) })
 *
 * // With rotation — shift the pattern 2 steps
 * const conga = Synth({ pattern: euclidean(5, 8, 2) })
 * ```
 */
```

Multiple examples are encouraged for functions with several common uses.

### 5. `@throws` — note ScoreError conditions

```ts
/**
 * @throws {ScoreError} If `amount` is outside `[0, 1]`.
 * @throws {ScoreError} If `pattern` is empty.
 */
```

### 6. `@remarks` — for longer explanations or design notes

```ts
/**
 * @remarks
 * Uses ceiling-division Bjorklund placement — `pos(i) = floor((i * steps + hits - 1) / hits)`.
 * This guarantees the canonical form: first hit always at step 0.
 * All known euclidean rhythm tables match this implementation.
 */
```

### 7. `@see` — link related functions

```ts
/**
 * @see {@link slow} — the inverse operation
 * @see {@link every} — apply transforms conditionally per bar
 */
```

### 8. Type aliases and interfaces need summaries too

```ts
/**
 * A pattern expressed as either a static array or a step function.
 *
 * - Array form `T[]` — resolved once, same values every bar.
 * - Function form `(step, bar) => T` — computed per step, can vary by bar.
 *
 * @example
 * ```ts
 * const static: PatternInput = [1, 0, 0, 0]
 * const dynamic: PatternInput = (step, bar) => bar % 2 === 0 ? 1 : 0
 * ```
 */
export type PatternInput<T = number> = T[] | PatternFn<T>
```

---

## What NOT to document

- Private/internal functions not exported from `index.ts`
- Test utilities in `tests/utils/`
- Type-only re-exports (e.g. `export type { Foo } from './foo.js'` — document at source)
- Obvious getters with self-explanatory names (`id`, `type`) — one-liner is fine

---

## The Music Voice Rule

Score docs are for **musicians who code** and **coders who make music**.
Write descriptions in musical terms first, then technical terms.

```ts
// ❌ Engineer voice
/** Multiplies step index by n modulo array length. */

// ✅ Music voice
/** Double the playback speed — turns 8th notes into 16th notes. */
```

---

## TypeDoc setup

TypeDoc is configured at root level. Run:
```bash
pnpm docs          # generate docs/api/
pnpm docs:watch    # watch mode
```

Config: `typedoc.json` at repo root.
Output: `docs/api/` (gitignored — generated on CI).
Public site: `score.dev/docs/api` (Phase 16+).

---

## Reference examples — copy these patterns

### Factory function

```ts
/**
 * Create a delay effect with wet/dry mix control.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Delay configuration.
 * @param props.delayTime - Delay time in seconds. Common values: `0.125` (8th at 120BPM), `0.25` (quarter).
 * @param props.feedback - Feedback amount `0–1`. Above `0.9` risks runaway feedback — Score clamps to `0.95`.
 * @param props.mix - Wet/dry ratio `0–1`. `0` = fully dry, `1` = fully wet.
 * @returns An `AudioComponent` — connect to any track via the `effects` prop.
 *
 * @throws {ScoreError} If `delayTime` is negative or greater than `5`.
 * @throws {ScoreError} If `feedback` is greater than `0.95`.
 *
 * @example
 * ```ts
 * import { createDelay } from '@score/effects'
 *
 * const lead = Synth({
 *   note: 'F#3',
 *   effects: [
 *     createDelay(context, { delayTime: 0.375, feedback: 0.4, mix: 0.3 }),
 *   ],
 * })
 * ```
 *
 * @see {@link createReverb} — for space/room effects
 * @see {@link createEffectsChain} — to stack multiple effects
 */
export const createDelay = (context: BackendContext, props: DelayProps): AudioComponent => {
```

### Pure math function

```ts
/**
 * Distribute `hits` evenly across `steps` using the Bjorklund algorithm.
 *
 * Produces the canonical Euclidean rhythm — the most even distribution
 * mathematically possible. Used in traditional music worldwide:
 * `euclidean(3, 8)` = the Cuban clave, `euclidean(5, 8)` = bossa nova.
 *
 * @param hits - Number of active steps (beats). Must be ≥ 0.
 * @param steps - Total pattern length. Must be > 0.
 * @param rotation - Optional phase offset in steps. `0` = first hit at step 0.
 * @returns Binary array of length `steps` — `1` = hit, `0` = rest.
 *
 * @example
 * ```ts
 * euclidean(3, 8)     // → [1,0,0,1,0,0,1,0]  clave
 * euclidean(5, 8)     // → [1,0,1,0,1,0,1,1]  bossa nova
 * euclidean(4, 16)    // → four-on-the-floor
 * euclidean(3, 8, 2)  // → [0,0,1,0,0,1,0,1]  clave rotated
 * ```
 *
 * @see {@link patternOr} — combine two euclidean patterns
 * @see {@link polyrhythm} — overlay two rhythms at LCM grid
 */
export const euclidean = (hits: number, steps: number, rotation = 0): number[] => {
```

### DSL component

```ts
/**
 * A synthesised kick drum — low-frequency pitched body with exponential pitch drop.
 *
 * Modelled after the classic electronic kick: a sine wave at the root frequency
 * that drops rapidly to the sub register over `decay` time. The pitch drop
 * (`pitchDrop`) controls the character — `0.02` = tight techno, `0.12` = deep house.
 *
 * @param props - Kick configuration.
 * @param props.pattern - Step pattern — `1` = hit, `0` = rest. Accepts arrays or transforms.
 * @param props.volume - Output level `0–1`. Default `0.9`.
 * @param props.synth - Synthesis parameters.
 * @param props.synth.frequency - Root pitch in Hz. Default `60`. Try `50` for sub, `80` for punchy.
 * @param props.synth.pitchDrop - Pitch drop depth `0–1`. Default `0.05`. Higher = more woofy.
 * @param props.synth.decay - Decay time in seconds. Default `0.3`.
 * @param props.effects - Effect chain — applied in order before the mixer.
 * @returns A `TrackComponent` — pass directly to `Song({ tracks: [...] })`.
 *
 * @example
 * ```ts
 * // Four-on-the-floor kick
 * const kick = Kick({
 *   pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
 *   volume: 0.9,
 *   synth: { frequency: 58, pitchDrop: 0.08, decay: 0.35 },
 * })
 *
 * // Euclidean kick pattern
 * const kick = Kick({ pattern: euclidean(3, 8) })
 * ```
 *
 * @see {@link Snare} — for the snare drum
 * @see {@link HiHat} — for hi-hat patterns
 */
export const Kick = (props: KickProps): TrackComponent => {
```

---

## Enforcement

- ESLint rule `tsdoc/syntax` enforces correct TSDoc tag syntax
- TypeDoc build fails if a public export has no doc comment
- CI runs `pnpm docs:check` — fails if any public export is undocumented
- Code review: undocumented public exports are a blocking issue

Add to root `package.json` devDeps:
```json
"typedoc": "^0.26.0",
"eslint-plugin-tsdoc": "^0.3.0"
```
