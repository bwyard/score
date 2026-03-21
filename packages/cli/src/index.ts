#!/usr/bin/env node
import { register } from 'node:module'
register(new URL('./score-loader.js', import.meta.url).href)
import { play } from './commands/play.js'
import { playlist } from './commands/playlist.js'
import { newSong } from './commands/new.js'
import { doctor } from './commands/doctor.js'

const [,, command, ...args] = process.argv

if (command === '--version' || command === '-v') {
  console.log('0.0.1')
  process.exit(0)
}

const commands: Record<string, (args: string[]) => Promise<void> | void> = {
  play:     args => play(args),
  playlist: args => playlist(args),
  new:      args => { newSong(args); },
  doctor:   args => { doctor(args); },
}

const handler = commands[command ?? '']
if (!handler) {
  console.log('Score — EDM audio framework')
  console.log('')
  console.log('Usage:')
  console.log('  score play <song.js>         Play a song file')
  console.log('  score play <song.js> --watch  Live reload on file save')
  console.log('  score playlist               Play all examples and songs')
  console.log('  score playlist --examples    Play examples only (8-bar samples)')
  console.log('  score playlist --songs       Play full songs only')
  console.log('  score new song <name>        Create a new song from template')
  console.log('  score doctor                 Check system requirements')
  console.log('  score --version              Show version')
  process.exit(0)
}

void Promise.resolve(handler(args)).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
