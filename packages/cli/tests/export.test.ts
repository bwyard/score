import { describe, it, expect, vi, afterEach } from 'vitest'
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ── helpers ───────────────────────────────────────────────────────────────────

const writeTempSong = (content: string): string => {
  const dir = join(tmpdir(), 'score-cli-export-tests')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `export-song-${String(Date.now())}.mjs`)
  writeFileSync(path, content, 'utf-8')
  return path
}

const outPath = (name: string): string => {
  const dir = join(tmpdir(), 'score-cli-export-tests')
  mkdirSync(dir, { recursive: true })
  return join(dir, name)
}

const MINIMAL_SONG = `
import { Song, Kick } from '@score/dsl'
export default Song({ bpm: 128, tracks: [Kick()] })
`

// ── unit tests for encodeWav ──────────────────────────────────────────────────

describe('encodeWav', () => {
  it('produces a valid RIFF WAV header', async () => {
    const { encodeWav } = await import('../src/renderer.js')
    const numSamples = 4410  // 0.1s at 44100 Hz
    const channelData = new Float32Array(numSamples).fill(0.5)
    const buf = encodeWav({
      length:          numSamples,
      sampleRate:      44100,
      numberOfChannels: 1,
      getChannelData:  () => channelData,
    })
    // RIFF header magic bytes
    expect(buf.toString('ascii', 0, 4)).toBe('RIFF')
    expect(buf.toString('ascii', 8, 12)).toBe('WAVE')
    expect(buf.toString('ascii', 12, 16)).toBe('fmt ')
    expect(buf.toString('ascii', 36, 40)).toBe('data')
  })

  it('encodes correct file size for 1 channel', async () => {
    const { encodeWav } = await import('../src/renderer.js')
    const numSamples = 100
    const channelData = new Float32Array(numSamples)
    const buf = encodeWav({
      length:          numSamples,
      sampleRate:      44100,
      numberOfChannels: 1,
      getChannelData:  () => channelData,
    })
    // 44 bytes header + numSamples * 1 channel * 2 bytes per sample
    expect(buf.length).toBe(44 + numSamples * 2)
  })

  it('encodes correct file size for 2 channels', async () => {
    const { encodeWav } = await import('../src/renderer.js')
    const numSamples = 100
    const channelData = new Float32Array(numSamples)
    const buf = encodeWav({
      length:          numSamples,
      sampleRate:      44100,
      numberOfChannels: 2,
      getChannelData:  () => channelData,
    })
    // 44 bytes header + numSamples * 2 channels * 2 bytes per sample
    expect(buf.length).toBe(44 + numSamples * 4)
  })

  it('clips samples to [-1, 1] range', async () => {
    const { encodeWav } = await import('../src/renderer.js')
    // Channels: one above +1, one below -1
    const channelData = new Float32Array([2.0, -2.0])
    const buf = encodeWav({
      length:          2,
      sampleRate:      44100,
      numberOfChannels: 1,
      getChannelData:  () => channelData,
    })
    // PCM data starts at byte 44
    const s0 = buf.readInt16LE(44)
    const s1 = buf.readInt16LE(46)
    expect(s0).toBe(32767)   // clipped to +1 → max int16
    expect(s1).toBe(-32767)  // clipped to -1 → min int16 (round)
  })
})

// ── export command ────────────────────────────────────────────────────────────

describe('export command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws ScoreError when no file arg given', async () => {
    const { exportSong } = await import('../src/commands/export.js')
    await expect(exportSong([])).rejects.toThrow()
  })

  it('throws ScoreError when file does not exist', async () => {
    const { exportSong } = await import('../src/commands/export.js')
    await expect(exportSong(['/nonexistent/song.js'])).rejects.toThrow()
  })

  it('throws ScoreError when --bars is not a valid integer', async () => {
    const { exportSong } = await import('../src/commands/export.js')
    const path = writeTempSong(MINIMAL_SONG)
    await expect(exportSong([path, '--bars', 'abc', '--trust'])).rejects.toThrow()
  })

  it('renders a minimal song and writes a WAV file', async () => {
    const { exportSong } = await import('../src/commands/export.js')
    const songPath = writeTempSong(MINIMAL_SONG)
    const wav = outPath(`minimal-${String(Date.now())}.wav`)
    await exportSong([songPath, '--out', wav, '--bars', '1', '--trust'])
    expect(existsSync(wav)).toBe(true)
    // Must be a valid RIFF WAV
    const { readFileSync } = await import('node:fs')
    const data = readFileSync(wav)
    expect(data.toString('ascii', 0, 4)).toBe('RIFF')
    expect(data.toString('ascii', 8, 12)).toBe('WAVE')
    if (existsSync(wav)) unlinkSync(wav)
  }, 30000)  // offline render can take a few seconds

  it('defaults output path to <song>.wav', async () => {
    const { exportSong } = await import('../src/commands/export.js')
    const dir = join(tmpdir(), 'score-cli-export-tests')
    mkdirSync(dir, { recursive: true })
    const songName = `default-out-${String(Date.now())}`
    const songPath = join(dir, `${songName}.mjs`)
    writeFileSync(songPath, MINIMAL_SONG, 'utf-8')
    const expectedWav = join(dir, `${songName}.wav`)
    await exportSong([songPath, '--bars', '1', '--trust'])
    expect(existsSync(expectedWav)).toBe(true)
    if (existsSync(expectedWav)) unlinkSync(expectedWav)
  }, 30000)
})
