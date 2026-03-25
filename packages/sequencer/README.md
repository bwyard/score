# @score/sequencer

> The authoritative timing engine for Score. Replaced Tone.js as the transport layer.
> See [ADR 027](../../docs/adr/027-conductor-shared-temporal-clock.md) for the architecture decision.

---

## Overview

`@score/sequencer` owns the canonical audio clock and step sequencer for the Score ecosystem. It provides:

- **`Clock`** — BPM-aware tick scheduler backed by `audioContext.currentTime`
- **`Transport`** — play/stop/pause/seek state machine with bar-beat-tick position tracking
- **`StepSequencer`** — pattern resolver that fires an `onStep` callback on every transport tick
- **`TemporalTick`** — canonical time snapshot consumed by all real-time Score consumers (visuals, GUI, future Conductor)

---

## Why not Tone.js?

Tone.js scheduled audio via its own `Transport` singleton that wrapped the Web Audio clock. Score requires:

1. A pure-functional, factory-based API with no global singleton state
2. Full control over tick scheduling for deterministic test injection
3. A canonical `TemporalTick` type shared across `@score/visuals`, `@score/gui`, and the future `@score/conductor` cross-tool sync layer
4. No runtime dependency on a 100 kB library when `AudioContext.currentTime` + `setTimeout` is sufficient

`@score/sequencer` provides all of these. `createClock` exposes a `schedule` injection point for tests; `createTransport` wraps it with position tracking; `createStepSequencer` drives instrument callbacks.

---

## API

### `createClock(context, props?): Clock`

A BPM-aware tick scheduler using the standard Web Audio double-buffering pattern: a `setTimeout` loop fires every `lookaheadMs` and pre-schedules all ticks within the next `scheduleAheadSec` window. Callbacks receive the **exact scheduled audio time** so downstream nodes can call `audioParam.setValueAtTime(value, tickTime)` without jitter.

```ts
import { createClock } from '@score/sequencer'

const ctx = new AudioContext()
const clock = createClock(ctx, { bpm: 140, ticksPerBeat: 4 })

clock.onTick((tickTime, tickNumber) => {
  osc.frequency.setValueAtTime(440, tickTime)
})

clock.start()
// later...
clock.setBPM(160)
clock.stop()
clock.dispose()
```

#### `ClockProps`

| Prop | Type | Default | Description |
|---|---|---|---|
| `bpm` | `number` | `120` | Beats per minute |
| `ticksPerBeat` | `number` | `4` | Subdivision ticks per beat (4 = 16th notes) |
| `lookaheadMs` | `number` | `25` | How often the lookahead loop fires (ms) |
| `scheduleAheadSec` | `number` | `0.1` | How far ahead to pre-schedule events (seconds) |
| `schedule` | `(fn, ms) => unknown` | `setTimeout` | Optional scheduler injection — use in tests for deterministic ticks |

#### `Clock` methods

| Method / getter | Description |
|---|---|
| `start()` | Start from tick 0. No-op if already running. |
| `stop()` | Stop and reset tick counter. |
| `setBPM(bpm)` | Update BPM at any time. Takes effect on the next scheduled tick. |
| `onTick(cb)` | Register `(tickTime: number, tickNumber: number) => void` callback. |
| `currentTick` | The most recently scheduled tick number. |
| `bpm` | Current BPM setting. |
| `isRunning` | Whether the clock is currently running. |
| `dispose()` | Stop and clear all callbacks. |

#### Deterministic test injection

```ts
let pending: (() => void) | null = null
const clock = createClock(ctx, {
  bpm: 120,
  schedule: (fn) => { pending = fn },
})
clock.start()
pending?.() // advance one lookahead cycle
```

---

### `createTransport(context, props?): Transport`

Wraps `createClock` and exposes higher-level transport controls with bar-beat-tick position tracking. Fires registered callbacks at tick, beat, and bar boundaries.

```ts
import { createTransport } from '@score/sequencer'

const ctx = new AudioContext()
const transport = createTransport(ctx, { bpm: 128, timeSignature: [4, 4] })

transport.onBar((pos) => console.log('bar', pos.bar))
transport.onBeat((pos) => console.log('beat', pos.beat))

transport.play()
// jump to bar 8 without stopping
transport.seek(8)
// change tempo
transport.setBPM(140)
// pause, preserving position
transport.pause()
// stop and reset to bar 0
transport.stop()
transport.dispose()
```

#### `TransportProps`

| Prop | Type | Default | Description |
|---|---|---|---|
| `bpm` | `number` | `120` | Beats per minute |
| `timeSignature` | `[number, number]` | `[4, 4]` | Time signature as `[beatsPerBar, beatUnit]` |
| `ticksPerBeat` | `number` | `4` | Subdivision ticks per beat |

#### `Transport` methods

| Method / getter | Description |
|---|---|
| `play()` | Begin playback from current position. No-op if already playing. |
| `stop()` | Stop and reset position to bar 0 beat 0. No-op if already stopped. |
| `pause()` | Pause, preserving current position. No-op if not playing. |
| `seek(bar, beat?, tick?)` | Jump to a position without affecting playback state. |
| `setBPM(bpm)` | Update BPM at any time. |
| `onTick(cb)` | Register `(position: Position) => void` — fires every tick. |
| `onBeat(cb)` | Register `(position: Position) => void` — fires every beat boundary. |
| `onBar(cb)` | Register `(position: Position) => void` — fires every bar boundary. |
| `position` | Current `{ bar, beat, tick, time }` snapshot (zero-indexed). |
| `state` | `'stopped' \| 'playing' \| 'paused'` |
| `bpm` | Current BPM. |
| `dispose()` | Stop, dispose the internal clock, clear all callbacks. |

---

### `createStepSequencer(transport, props, onStep): StepSequencer`

Advances through a `PatternInput` on every transport tick, resolving each step value and invoking `onStep`.

```ts
import { createTransport, createStepSequencer } from '@score/sequencer'

const ctx = new AudioContext()
const transport = createTransport(ctx, { bpm: 128 })

const seq = createStepSequencer(
  transport,
  { pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
  (value, step, position) => {
    if (value) kick.start(position.time)
  },
)

transport.play()

// Swap pattern at any time — takes effect on the next tick
seq.setPattern([1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0])
```

#### Generator patterns

`PatternInput<T>` accepts either a static array or a generator function:

```ts
// Generator: probabilistic pattern using bar number
const seq = createStepSequencer(
  transport,
  { pattern: (step, bar) => bar % 2 === 0 ? [1,0,0,0][step % 4] : 0 },
  (value, step) => { if (value) snare.start() },
)
```

#### `StepSequencerProps`

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `PatternInput<T>` | required | Static array or `(step, bar, seed?) => T` generator |
| `steps` | `number` | `pattern.length` (array) or `16` | Total steps before wrapping |
| `seed` | `number` | — | Song seed forwarded to generator functions for deterministic stochastic patterns |

#### `onStep` callback

```ts
onStep: (value: T, step: number, position: Position) => void
```

| Argument | Description |
|---|---|
| `value` | Resolved pattern value at this step |
| `step` | Current step index (0-based, wraps at `steps`) |
| `position` | Transport position `{ bar, beat, tick, time }` at this tick |

---

### `TemporalTick`

The canonical time snapshot passed to all real-time consumers — visuals, GUI hooks, future `@score/conductor`. Per ADR 027, `@score/sequencer` is the authoritative source. When `@score/conductor` is built, it re-exports `TemporalTick` unchanged.

```ts
import type { TemporalTick } from '@score/sequencer'
```

| Field | Type | Description |
|---|---|---|
| `step` | `number` | Current sequencer step (0-based, wraps at `stepCount`) |
| `bar` | `number` | Current bar number (0-based) |
| `beat` | `number` | Current beat within bar (0-based) |
| `bpm` | `number` | Current BPM |
| `time` | `number` | Absolute playback time in seconds (`audioContext.currentTime`) |
| `stepCount` | `number` | Total step count for the current pattern (default 16) |

All fields are `readonly`. The shape is frozen — changing it requires updating ADR 027.

---

## Exports

```ts
import {
  createClock,
  createTransport,
  createStepSequencer,
  createTempoMap,
} from '@score/sequencer'

import type {
  Clock, ClockProps,
  Transport, TransportProps,
  StepSequencer, StepSequencerProps,
  TemporalTick,
  PatternInput, Pattern,
  TransportState, Position,
  SwingConfig,
  TempoMapProps, TempoChange,
} from '@score/sequencer'
```

---

## Related

- [ADR 027 — Conductor: Shared Temporal Clock](../../docs/adr/027-conductor-shared-temporal-clock.md)
- [ADR 009 — IPC Bridge Design](../../docs/adr/009-ipc-bridge-design.md) — `engine:tick` supersedes `engine:step`
- [`@score/visuals`](../visuals/README.md) — consumes `TemporalTick` via `AudioVisualState`
