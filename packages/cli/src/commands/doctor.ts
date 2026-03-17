import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

export const doctor = (_args: string[]): void => {
  console.log('Score Doctor — system check\n')

  // Node version
  const nodeVersion = process.version
  const nodeMajor = parseInt(nodeVersion.slice(1), 10)
  const nodeOk = nodeMajor >= 20
  console.log(`${nodeOk ? '✓' : '✗'} Node.js ${nodeVersion}${nodeOk ? '' : '  (requires v20+)'}`)

  // pnpm
  try {
    const v = execSync('pnpm --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    console.log(`✓ pnpm ${v}`)
  } catch {
    console.log('✗ pnpm — not found')
  }

  // node-web-audio-api
  const req = createRequire(import.meta.url)
  try {
    req.resolve('node-web-audio-api')
    console.log('✓ node-web-audio-api — available')
  } catch {
    console.log('✗ node-web-audio-api — not found  (run: pnpm install)')
  }

  console.log('\nAll checks complete.')
}
