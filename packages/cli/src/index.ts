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

const printGlobalUsage = (): void => {
  console.log('Score — EDM audio framework\n')
  console.log('Usage:')
  console.log('  score <command> [options]\n')
  console.log('Commands:')
  console.log('  play <song.js>        Play a song file')
  console.log('  play <song.js> -w     Hot-reload on every file save')
  console.log('  repl                  Interactive live coding REPL')
  console.log('  list <song.js>        Show song metadata and track info')
  console.log('  export <song.js>      Render song to WAV')
  console.log('  new song <name>       Create a new song from template')
  console.log('  doctor                Check system requirements\n')
  console.log('Options:')
  console.log('  -h, --help            Show help for a command')
  console.log('  -v, --version         Show version\n')
  console.log('Run `score <command> --help` for command-specific options.')
}

if (command === '--version' || command === '-v') {
  console.log('0.0.1')
  process.exit(0)
}

if (!command || command === '--help' || command === '-h' || command === 'help') {
  printGlobalUsage()
  process.exit(0)
}

const commands: Record<string, (args: string[]) => Promise<void> | void> = {
  play:   cmdArgs => play(cmdArgs),
  repl:   cmdArgs => repl(cmdArgs),
  list:   cmdArgs => list(cmdArgs),
  export: cmdArgs => exportSong(cmdArgs),
  new:    cmdArgs => { newSong(cmdArgs); },
  doctor: cmdArgs => { doctor(cmdArgs); },
}

const handler = commands[command]
if (!handler) {
  console.error(`Score: Unknown command — ${command}\n`)
  printGlobalUsage()
  process.exit(1)
}

void Promise.resolve(handler(args)).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
