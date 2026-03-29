// @score/instruments — melodic/sequenced.ts
// Instruments with internal sequencing state that cycle through notes each step.
//
// Variants in INSTRUMENT_REGISTRY:
//   'arp'         → createArp  (this file)
//
// PLANNED: wobbleBass (LFO-on-filter sequencing)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, OscillatorType } from '@score/core'
import { uid } from '@score/core'

// ── Props ─────────────────────────────────────────────────────────────────────

/** ADSR envelope configuration for {@link ArpProps}. */
export type ArpEnvelope = {
  readonly attack?: number
  readonly decay?: number
  readonly sustain?: number
  readonly release?: number
}

/** Configuration for {@link createArp}. */
export type ArpProps = {
  /** Note names to arpeggiate in order, e.g. `['C4', 'E4', 'G4']`. Required. */
  readonly notes: readonly string[]
  /** Traversal mode. Default `'up'`. */
  readonly mode?: 'up' | 'down' | 'pingpong' | 'random'
  /** Steps per note advance — `1` = change every step, `2` = every other. Default `1`. */
  readonly rate?: number
  /** Oscillator waveform. Default `'triangle'`. */
  readonly wave?: OscillatorType
  /** Output gain 0–1. Default `0.3`. */
  readonly gain?: number
  /** Amplitude ADSR envelope. */
  readonly envelope?: ArpEnvelope
}

// ── ArpComponent ──────────────────────────────────────────────────────────────

/**
 * An arpeggiated voice component — extends {@link AudioComponent} with a `step()`
 * method that advances the internal note index and triggers the next note.
 */
export type ArpComponent = AudioComponent & {
  /**
   * Advance the arpeggio one step and trigger the current note at `time`.
   * Passes through silently when `active` is `0` (rest).
   *
   * @param active - Pre-resolved frequency in Hz, or `0` for rest.
   *                 The engine resolves note names to Hz before calling this.
   * @param time   - Schedule time in seconds.
   */
  readonly step: (active: number, time: number) => void
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create an arpeggiator component.
 *
 * Each `step()` call advances the internal note index (per `mode`) and triggers
 * a note using the same ephemeral osc+VCA pattern as {@link createGenericSynth}.
 * The note sequence cycles through `props.notes`. `rate` controls steps-per-note:
 * `rate: 2` means the note changes every 2 steps.
 *
 * HARDWARE BOUNDARY: `arpState` is a mutable step counter — sequential state required
 * for per-step note advancement across sequencer callbacks.
 *
 * @param context - Backend audio context.
 * @param props   - Arp configuration, including `notes` array (required).
 * @returns An {@link ArpComponent} with `type` set to `'arp'`.
 *
 * @example
 * ```ts
 * const arp = createArp(context, {
 *   notes: ['C4', 'E4', 'G4', 'B4'],
 *   mode: 'up',
 *   wave: 'triangle',
 *   gain: 0.3,
 * })
 * arp.connect(context.destination)
 * arp.step(261.63, context.currentTime)        // plays C4
 * arp.step(329.63, context.currentTime + 0.25) // plays E4
 * ```
 */
export const createArp = (
  context: ScoreAudioContext,
  props: ArpProps,
): ArpComponent => {
  const outputGain = context.createGain({ gain: props.gain ?? 0.3 })
  const mode       = props.mode ?? 'up'
  const rate       = props.rate ?? 1
  const notes      = props.notes

  // HARDWARE BOUNDARY: mutable step counter — sequential arpeggio state
  const arpState = { noteIndex: 0, pingDir: 1 }

  const triggerNote = (freq: number, time: number): void => {
    const env     = props.envelope ?? {}
    const attack  = env.attack  ?? 0.005
    const decay   = env.decay   ?? 0.08
    const sustain = env.sustain ?? 0.5
    const release = env.release ?? 0.1
    const peak    = props.gain  ?? 0.3
    const noteDur = attack + decay + release + 0.02

    const osc = context.createOscillator({ type: props.wave ?? 'triangle', frequency: freq })
    const vca = context.createGain({ gain: 0 })
    osc.connect(vca)
    vca.connect(outputGain)
    vca.scheduleEnvelope({ peak, attack, decay, sustain, release, startTime: time, duration: noteDur })
    osc.start(time)
    osc.stop(time + noteDur)
    osc.onended = () => {
      try { osc.disconnect() } catch { /* ok */ }
      try { vca.disconnect() } catch { /* ok */ }
    }
  }

  const advanceNoteIndex = (): void => {
    if (mode === 'up') {
      arpState.noteIndex += 1
    } else if (mode === 'down') {
      arpState.noteIndex -= 1
    } else if (mode === 'pingpong') {
      arpState.noteIndex += arpState.pingDir
      const realIdx = Math.floor(arpState.noteIndex / rate) % notes.length
      if (realIdx >= notes.length - 1 || realIdx <= 0) {
        arpState.pingDir *= -1
      }
    } else {
      // random — deterministic hash (no Math.random() — thesis compliance)
      const seed = (arpState.noteIndex * 7919) >>> 0
      arpState.noteIndex = seed % notes.length
    }
  }

  const component: ArpComponent = {
    id:   uid('arp'),
    type: 'arp' as const,

    step: (active: number, time: number) => {
      if (active <= 0) return
      const idx  = Math.floor(arpState.noteIndex / rate) % notes.length
      // active is the pre-resolved frequency from the engine's resolveFreq
      // When active === 1 (generic trigger), fall back to the indexed note's
      // placeholder frequency. Full note-name resolution lives in the engine.
      const freq = active > 1 ? active : (idx === 0 ? 261.63 : 440)
      triggerNote(freq, time)
      advanceNoteIndex()
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },
    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },
    dispose: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
