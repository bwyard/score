import { writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export const newSong = (args: string[]): void => {
  if (args[0] !== 'song' || !args[1]) {
    console.log('Usage:')
    console.log('  score new song <name>    Create a new song from template')
    return
  }

  const name = args[1]
  const fileName = name.endsWith('.js') ? name : `${name}.js`
  const filePath = resolve(process.cwd(), fileName)

  if (existsSync(filePath)) {
    console.error(`Score: File already exists: ${fileName}`)
    process.exit(1)
  }

  const template = `// ${name} — Score song
// Run with:  score play ${fileName}
// Live mode: score play ${fileName} --watch

import { Song, Kick, Snare, HiHat, Synth, Intro, Drop, Outro } from '@score/dsl'

// ── DRUMS ─────────────────────────────────────────────────────────────────────
// Pattern: 16-step array. 1 = hit, 0 = rest.

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.85,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.5,
})

const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],
  volume: 0.2,
})

// ── SYNTHESIS ─────────────────────────────────────────────────────────────────
// Use note names ('A2', 'D3', 'F#3') or Hz values. 0 = rest.

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.25,
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.05 },
  filter: { type: 'lowpass', frequency: 900 },
  pattern: ['A2', 0, 'A2', 0,  0, 'A2', 0, 'D3',  'E3', 0, 'E3', 0,  0, 'A3', 0, 0],
})

// ── ARRANGEMENT ───────────────────────────────────────────────────────────────
export default Song({
  bpm: 128,
  key: 'Am',
  genre: 'electronic',
  tracks: [kick, snare, hihat, bass],
  arrangement: [
    Intro(4,  [kick, bass]),
    Drop(16,  [kick, snare, hihat, bass]),
    Outro(4,  [kick, bass]),
  ],
})
`

  writeFileSync(filePath, template, 'utf-8')
  console.log(`Score: Created ${fileName}`)
  console.log(`Score: Play it — score play ${fileName}`)
}
