// example-techno.js — working demo song
// Run with: score play songs/example-techno.js
//
// Uses oscillator-based synthesis — no sample files required.
// Live mode: exports run(context) so the CLI produces actual audio.

import { Synth } from '@score/components'
import { createTransport, createStepSequencer } from '@score/sequencer'
import { Song, Track, Drop, Intro, Outro } from '@score/dsl'

// ── DSL DESCRIPTOR (structure + metadata) ────────────────────────────────────

const _kick  = Track({ component: { id: 'kick-desc',  type: 'kick',  connect: () => {}, disconnect: () => {}, dispose: () => {} } })
const _bass  = Track({ component: { id: 'bass-desc',  type: 'synth', connect: () => {}, disconnect: () => {}, dispose: () => {} } })
const _lead  = Track({ component: { id: 'lead-desc',  type: 'synth', connect: () => {}, disconnect: () => {}, dispose: () => {} } })

export default Song({
  bpm: 140,
  key: 'Am',
  genre: 'techno',
  tracks: [_kick, _bass, _lead],
  arrangement: [
    Intro(4,  [_kick, _bass]),
    Drop(16,  [_kick, _bass, _lead]),
    Outro(4,  [_kick, _bass]),
  ],
})

// ── LIVE ENGINE (produces actual audio) ──────────────────────────────────────
// The CLI calls run(context) when this export is present.

const A2 = 110
const D3 = 147
const E3 = 165
const G3 = 196

// Bass sequence in A minor — 16-step
const bassPattern = [
  A2, 0,   A2, 0,   0,   A2, 0,   A2,
  D3, 0,   D3, 0,   E3,  0,  G3,  0,
]

// Lead stab pattern — sparse, on-beat hits
const leadPattern = [
  0,    0,    E3*2, 0,    0,    0,    G3*2, 0,
  0,    A2*4, 0,    0,    E3*2, 0,    0,    0,
]

// Kick pattern — four on the floor
const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]

export const run = (context) => {
  const t = context.currentTime

  // Bass synth — sawtooth, lowpass filter approximated via gain envelope
  const bass = Synth(context, { wave: 'sawtooth', frequency: A2, gain: 0.0 })
  bass.connect(context.destination)
  bass.start(t)

  // Lead synth — square wave, high register
  const lead = Synth(context, { wave: 'square', frequency: E3 * 2, gain: 0.0 })
  lead.connect(context.destination)
  lead.start(t)

  // Kick — sine sweep (oscillator drops from 100→40 Hz over 80ms)
  // Each hit creates a fresh oscillator so we get clean transients
  const triggerKick = (time) => {
    const osc  = context.createOscillator({ type: 'sine', frequency: 100 })
    const gain = context.createGain({ gain: 0.8 })
    osc.connect(gain)
    gain.connect(context.destination)
    osc.start(time)
    osc.setFrequency(40, time + 0.08)
    osc.stop(time + 0.2)
  }

  const transport = createTransport(context, { bpm: 140, ticksPerBeat: 4 })

  // Step duration in seconds
  const stepSec = () => 60 / (transport.bpm * 4)

  createStepSequencer(transport, { pattern: kickPattern }, (_val, _step) => {
    if (_val) triggerKick(context.currentTime + stepSec() * 0.5)
  })

  createStepSequencer(transport, { pattern: bassPattern }, (freq) => {
    if (freq > 0) {
      bass.setFrequency(freq, context.currentTime)
      bass.setGain(0.25, context.currentTime)
      bass.setGain(0.0,  context.currentTime + stepSec() * 0.75)
    }
  })

  createStepSequencer(transport, { pattern: leadPattern }, (freq) => {
    if (freq > 0) {
      lead.setFrequency(freq, context.currentTime)
      lead.setGain(0.12, context.currentTime)
      lead.setGain(0.0,  context.currentTime + stepSec() * 0.4)
    }
  })

  transport.play()

  return {
    dispose: () => {
      transport.dispose()
      bass.dispose()
      lead.dispose()
    },
  }
}
