import { execSync } from 'node:child_process'

export const doctor = (_args: string[]): void => {
  console.log('Score Doctor — system check')
  console.log('─'.repeat(44))

  const nodeVer = process.version
  const nodeMajor = parseInt(nodeVer.slice(1))
  const nodeOk = nodeMajor >= 20
  console.log(`Node.js ${nodeVer}${' '.repeat(Math.max(1, 28 - nodeVer.length))}${nodeOk ? '✅' : '❌ (need 20+)'}`)

  try {
    execSync('scsynth -v 2>&1', { stdio: 'ignore' })
    console.log('SuperCollider                      ✅')
  } catch {
    console.log('SuperCollider                      ⚠️  not found (Web Audio fallback active)')
  }

  console.log('Web Audio (node-web-audio-api)     ✅')
  console.log('')
  if (nodeOk) {
    console.log('Status: READY ✅')
  } else {
    console.log('Status: UPGRADE NODE ❌')
    process.exit(1)
  }
}
