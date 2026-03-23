import { writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseFlags } from '../flags.js'

const printUsage = (): void => {
  console.log('Score new — create a new song file\n')
  console.log('Usage:')
  console.log('  score new song <name>\n')
  console.log('Options:')
  console.log('  -h, --help    Show this help')
}

export const newSong = (args: string[]): void => {
  const { positionals } = parseFlags(args, {}, printUsage)

  if (positionals[0] !== 'song' || !positionals[1]) {
    console.error('Score: Usage — score new song <name>\n')
    printUsage()
    process.exit(1)
  }

  const name = positionals[1]
  const fileName = name.endsWith('.js') ? name : `${name}.js`
  const filePath = resolve(process.cwd(), fileName)

  if (existsSync(filePath)) {
    console.error(`Score: File already exists: ${fileName}`)
    process.exit(1)
  }

  const template = `// ${name} — Score song
// Run with:  score play ${fileName}
// Live mode: score play ${fileName} --watch

import { Song, Kick808, Snare, HiHat, Bass303, Pad } from '@score/dsl'

// ── DRUMS ─────────────────────────────────────────────────────────────────────
// Pattern: 16-step array. 1 = hit, 0 = rest.

const kick  = Kick808({ pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], volume: 0.75 })
const snare = Snare({   pattern: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], volume: 0.5  })
const hihat = HiHat({   pattern: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], volume: 0.2  })

// ── BASS ──────────────────────────────────────────────────────────────────────
// Chain API: Bass303, Pad, Pluck, Synth, FMSynth — .filter() .reverb() .volume() etc.

const bass = Bass303('A2')
  .filter(600)
  .resonance(0.4)
  .pattern([1,0,0,0, 0,0,1,0, 1,0,0,0, 0,1,0,0])
  .volume(0.7)

// ── PAD ───────────────────────────────────────────────────────────────────────

const pad = Pad('A3')
  .attack(0.3)
  .release(1.2)
  .reverb(0.3)
  .volume(0.35)

// ── SONG ──────────────────────────────────────────────────────────────────────
export default Song({
  bpm: 128,
  tracks: [kick, snare, hihat, bass, pad],
})
`

  writeFileSync(filePath, template, 'utf-8')
  console.log(`Score: Created ${fileName}`)
  console.log(`Score: Play it — score play ${fileName}`)
}
