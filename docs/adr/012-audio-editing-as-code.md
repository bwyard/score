# ADR 012 — Audio Editing as Code

## Status
Accepted

## Context

Score's thesis is "a song is a pure function of time." Traditional audio editors (Audacity, Logic, Pro Tools) contradict this — they edit audio destructively or store binary project files that cannot be diffed, versioned, or run from the CLI.

Score needs full audio editing capability (trim, fade, normalize, pitch shift, time stretch, waveform display, multi-track timeline) to compete with Ableton. The question is whether these operations follow the same code-first model as synthesis, or use a traditional binary/GUI-only model.

## Decision

**All audio editing operations are pure functions. The source audio file is never mutated.**

An audio clip is a descriptor object (like an instrument descriptor) carrying a file path and a chain of operations. Operations are applied at render time by the `@score/clips` package.

```ts
const vocal = AudioClip({ file: './stems/vocal.wav' })

const edited = vocal
  |> trim({ start: 2.4, end: 18.0 })
  |> fade({ in: 0.02, out: 0.15 })
  |> normalize({ target: -3 })
  |> pitchShift({ semitones: -2 })
  |> timeStretch({ factor: 1.05 })

export default Song({ bpm: 128, tracks: [kick, bass, Track(edited)] })
```

### Rules

1. `AudioClip` is a factory function returning a plain descriptor — no class, no mutation
2. Every operation is a pure function: takes a descriptor, returns a new descriptor
3. The render pipeline reads the descriptor chain and applies operations at export/playback time
4. The source `.wav`/`.mp3`/`.flac` file is never written to
5. The edit history is the code — undo is removing a line, variations are different parameters
6. The GUI waveform editor generates code — clicking to set a trim point writes `trim({ start: X })` into the song file, it does not move bytes in an audio file

### `@score/clips` package scope

- `AudioClip({ file })` — load descriptor
- `trim(clip, { start, end })` — returns new clip
- `fade(clip, { in, out })` — returns new clip
- `normalize(clip, { target })` — target in dBFS
- `reverse(clip)` — returns new clip
- `pitchShift(clip, { semitones })` — returns new clip
- `timeStretch(clip, { factor })` — returns new clip
- `slice(clip, markers)` — split at cue points, returns array of clips
- `record({ source, duration })` — capture from mic/line-in, returns clip descriptor

### GUI rule

The waveform editor in Score Studio is a **code generator**, not a binary editor. Every interaction (drag trim handles, draw fade curves, set cue points) writes the equivalent function call into the song file. The waveform display is read-only from the file perspective.

This is the same principle as codePatcher for synthesis parameters.

## Consequences

- Audio editing is reproducible: same `.ts` file always produces the same rendered output
- Edit sessions are versionable with git — `git diff` shows what changed in plain text
- Batch processing is trivial: apply the same pipeline to many files with `map`
- Score competes with Ableton/Logic/Pro Tools on audio editing while offering something none of them can: a text-first, CLI-runnable edit pipeline
- `@score/clips` must be a new package — not in the current package list; Phase 13c scope
- Stem separation (Phase 12h) follows the same model: `separate(clip)` returns `{ drums, bass, vocal, other }` — each a clip descriptor
- Audio record-in: `record({ source: 'mic', duration: 4 })` returns a clip descriptor referencing a temp file
