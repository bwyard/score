# ADR 016 — Project File Format and Autosave

**Date:** 2026-03-23
**Status:** Proposed
**Deciders:** Project owner

---

## Context

Score needs a project format that is git-diffable, human-readable, and simple enough that "open a project" means opening a folder. Binary formats (Ableton `.als`, Logic `.logicx`) are opaque and not diffable. The song file is already the source of truth — the project format must reflect that without adding overhead.

---

## Decision

A Score project is a **directory**, not a single file.

```
my-project/
  song.ts          # the song — source of truth
  samples/         # gitignored; symlinked or downloaded at open time
  assets/          # waveforms, analysis data, cached renders
  score.json       # machine-generated project metadata
```

`score.json` schema:

```json
{
  "name": "my-project",
  "bpm": 128,
  "created": "2026-03-23T00:00:00Z",
  "lastOpened": "2026-03-23T12:00:00Z",
  "samplePaths": ["samples/kick.wav"]
}
```

`score.json` is **never hand-edited**. It exists only for the GUI's recent-files list and sample path resolution.

**Autosave:** every eval cycle (Ctrl+Enter) writes the current editor content to `song.ts`. Score Studio maintains a 20-entry in-memory undo buffer (ADR 017). There is no background autosave timer — eval is the save trigger.

**File > Save As** copies the entire project directory.
**File > Open** shows a directory picker; a valid project must contain `song.ts`.

---

## Consequences

**Positive:**
- `git diff my-project/song.ts` works — projects are fully version-controllable
- `score.json` never clutters diffs with audio data
- "Save" is a no-op concept — the file is always current after eval
- Directory structure is self-documenting

**Negative:**
- `samples/` must be re-resolved on every machine — no bundled audio (by design, ADR rules)
- "File > Open" as a directory picker is unfamiliar to users expecting a single file
- `score.json` will drift if a user hand-edits `song.ts` outside Score Studio

---

## Alternatives Considered

- **Single `.score` file** (zip archive of song.ts + metadata) — diffable only with zip-aware git tooling. Rejected: unnecessary complexity.
- **Background autosave timer** — writes every N seconds regardless of eval. Rejected: creates saves that don't correspond to any eval'd state, corrupting the undo buffer relationship.
- **No `score.json`** — store metadata in song.ts comments. Rejected: pollutes the music-authoring surface with tooling metadata.
