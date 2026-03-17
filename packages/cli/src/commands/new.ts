import { resolve } from 'node:path'
import { writeFileSync, existsSync } from 'node:fs'
import { ScoreError } from '@score/core'

const SONG_TEMPLATE = `// Song — Score EDM Framework
// Docs: https://score.dev/docs/dsl/song

import { Song, Kick, Snare, HiHat, Intro, Drop, Outro } from '@score/dsl'

// ── DRUMS ──────────────────────────────────────────────────────────────
const kick = Kick({
  pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  volume: 0.9,
})

const snare = Snare({
  pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  volume: 0.8,
})

const hihat = HiHat({
  pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  volume: 0.6,
})

// ── ARRANGEMENT ────────────────────────────────────────────────────────
const arrangement = [
  Intro(4,  [hihat]),
  Drop(16,  [kick, snare, hihat]),
  Outro(4,  [hihat]),
]

export default Song({
  bpm: 140,
  tracks: [kick, snare, hihat],
  arrangement,
})
`

export const newSong = (args: string[]): void => {
  const [, name] = args
  if (!name) {
    throw ScoreError('Specify a song name', {
      received: undefined,
      fix: 'Usage: score new song <name.js>',
      docs: 'https://score.dev/docs/cli/new',
    })
  }
  const outPath = resolve(process.cwd(), name.endsWith('.js') ? name : `${name}.js`)
  if (existsSync(outPath)) {
    throw ScoreError(`File already exists: ${outPath}`, {
      received: outPath,
      fix: 'Choose a different name or delete the existing file first',
      docs: 'https://score.dev/docs/cli/new',
    })
  }
  writeFileSync(outPath, SONG_TEMPLATE, 'utf-8')
  console.log(`Score: Created ${outPath}`)
  console.log(`Score: Run with: score play ${name}`)
}
