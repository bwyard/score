#!/usr/bin/env node
import { register } from 'node:module'
register(new URL('./score-loader.js', import.meta.url).href)
import { play } from './commands/play.js'
import { repl } from './commands/repl.js'
import { newSong } from './commands/new.js'
import { doctor } from './commands/doctor.js'
import { list } from './commands/list.js'
import { exportSong } from './commands/export.js'

const [,, command, ...args] = process.argv

if (command === '--version' || command === '-v') {
  console.log('0.0.1')
  process.exit(0)
}

const commands: Record<string, (args: string[]) => Promise<void> | void> = {
  play:   args => play(args),
  repl:   args => repl(args),
  new:    args => { newSong(args); },
  doctor: args => { doctor(args); },
  list:   args => list(args),
  export: args => exportSong(args),
}

const handler = commands[command ?? '']
if (!handler) {
  console.log('Score — EDM audio framework')
  console.log('')
  console.log('Usage:')
  console.log('  score play <song.js>              Play a song file')
  console.log('  score play <song.js> --watch      Live reload on file save')
  console.log('  score repl [song.js]              Interactive live coding REPL')
  console.log('  score list <song.js>              Show song info and track list')
  console.log('  score export <song.js>            Render song to WAV')
  console.log('  score export <song.js> --bars 16  Render specified number of bars')
  console.log('  score new song <name>             Create a new song from template')
  console.log('  score doctor                      Check system requirements')
  console.log('  score --version                   Show version')
  process.exit(0)
}

void Promise.resolve(handler(args)).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
