/**
 * Descriptor returned by {@link describe} — consumed by the Song engine to
 * configure an instrument. All fields are optional; missing fields fall back
 * to instrument defaults.
 */
export type InstrumentDescriptor = {
  /** Instrument type to instantiate (e.g. `'kick'`, `'synth'`, `'bass'`, `'pad'`, `'lead'`). */
  instrument?: string
  /** 16-step binary trigger pattern derived from rhythm vocabulary. */
  pattern?: number[]
  /** Output volume `0–1`. */
  volume?: number
  /** Suggested oscillator wave shape for synth-type instruments. */
  wave?: 'sine' | 'sawtooth' | 'square' | 'triangle'
  /** Suggested filter cutoff frequency in Hz. */
  filterFrequency?: number
  /** Suggested filter topology. */
  filterType?: 'lowpass' | 'highpass' | 'bandpass'
  /** Reverb send amount `0–1`. */
  reverb?: number
  /** Delay send amount `0–1`. */
  delay?: number
  /** Stereo pan position `−1` (hard left) to `1` (hard right). */
  pan?: number
  /** Raw tokens matched during parsing — useful for debugging. */
  _tokens?: string[]
}

/**
 * A single vocabulary entry mapping keywords to a partial descriptor.
 *
 * When any keyword in `keywords` appears in the input text, `descriptor`
 * is merged into the result.
 */
export type VocabEntry = {
  /** Words or short phrases that trigger this entry (case-insensitive). */
  keywords: string[]
  /** Partial descriptor merged when a keyword matches. Later entries win conflicts. */
  descriptor: Partial<InstrumentDescriptor>
}
