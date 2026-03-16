// Generate a minimal valid WAV file (44-byte header + samples) for testing
// Produces a short sine wave at the given frequency

export const createTestWav = (options?: {
  sampleRate?: number
  durationMs?: number
  frequency?: number
}): Buffer => {
  const sampleRate = options?.sampleRate ?? 44100
  const durationMs = options?.durationMs ?? 100
  const frequency = options?.frequency ?? 440
  const numSamples = Math.floor(sampleRate * durationMs / 1000)
  const numChannels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const dataSize = numSamples * numChannels * bytesPerSample
  const headerSize = 44
  const buffer = Buffer.alloc(headerSize + dataSize)

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)

  // fmt chunk
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)           // chunk size
  buffer.writeUInt16LE(1, 20)            // PCM format
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28) // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32) // block align
  buffer.writeUInt16LE(bitsPerSample, 34)

  // data chunk
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  // Write sine wave samples
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate)
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)))
    buffer.writeInt16LE(intSample, headerSize + i * bytesPerSample)
  }

  return buffer
}
