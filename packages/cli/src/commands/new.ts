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

import { Song, Kick808, Snare909, Hihat808, Bass303 } from '@score/dsl'

// ── DRUMS ─────────────────────────────────────────────────────────────────────

const kick  = Kick808().hits(0, 4, 8, 12).volume(0.7)
const snare = Snare909().hits(4, 12).volume(0.55)
const hihat = Hihat808().euclidean(8, 16).volume(0.25)

// ── BASS ──────────────────────────────────────────────────────────────────────
// Chain API: .filter() .resonance() .pattern() .volume() etc.
// Use note names ('A2', 'D3', 'E3') or 0 for rest.

const bass = Bass303('A2')
  .filter(600)
  .resonance(0.4)
  .pattern(['A2', 0, 0, 0,  'D3', 0, 0, 0,  'A2', 0, 0, 0,  'D3', 0, 0, 0])
  .volume(0.6)

// ── SONG ──────────────────────────────────────────────────────────────────────
export default Song({
  bpm: 128,
  tracks: [kick, snare, hihat, bass],
})
`

  writeFileSync(filePath, template, 'utf-8')
  console.log(`Score: Created ${fileName}`)
  console.log(`Score: Play it — score play ${fileName}`)
}
