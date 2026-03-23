"use strict";
const electron = require("electron");
const path = require("node:path");
const node_fs = require("node:fs");
const node_url = require("node:url");
const nodeWebAudioApi = require("node-web-audio-api");
const node_crypto = require("node:crypto");
const ScoreError = (message, context) => {
  const error = new Error(message);
  error.name = "ScoreError";
  error.context = context;
  return error;
};
const MIN_RAMP = 0.01;
const RAW = Symbol("web-audio-raw");
const BUFFER = Symbol("web-audio-buffer");
const getRaw = (node) => node[RAW];
const getRawBuffer = (buf) => buf[BUFFER];
const fillWhiteNoise = (data) => {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
};
const fillPinkNoise = (data) => {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
};
const fillBrownNoise = (data) => {
  let lastOut = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + white * 0.02) / 1.02;
    data[i] = lastOut * 3.5;
  }
};
const noiseFiller = {
  white: fillWhiteNoise,
  pink: fillPinkNoise,
  brown: fillBrownNoise
};
const wrapNode = (raw) => ({
  [RAW]: raw,
  connect: (dest) => {
    raw.connect(getRaw(dest));
  },
  disconnect: (dest) => {
    if (dest) {
      raw.disconnect(getRaw(dest));
    } else {
      raw.disconnect();
    }
  }
});
const createBackendContext = (ctx) => {
  const destination = wrapNode(ctx.destination);
  return {
    get currentTime() {
      return ctx.currentTime;
    },
    get sampleRate() {
      return ctx.sampleRate;
    },
    get state() {
      return ctx.state;
    },
    destination,
    createOscillator: (props) => {
      const osc = ctx.createOscillator();
      osc.type = props?.type ?? "sine";
      osc.frequency.value = props?.frequency ?? 440;
      osc.detune.value = props?.detune ?? 0;
      const base = wrapNode(osc);
      return {
        ...base,
        _connectTo: (destination2) => {
          osc.connect(destination2);
        },
        frequencyParam: {
          connectModulator: (source) => {
            const s = source;
            if (s._connectTo) s._connectTo(osc.frequency);
          },
          disconnectModulator: () => {
          }
        },
        start: (time) => {
          osc.start(time ?? ctx.currentTime);
        },
        stop: (time) => {
          osc.stop(time ?? ctx.currentTime);
        },
        setFrequency: (value, time) => {
          const t = time ?? ctx.currentTime;
          osc.frequency.setValueAtTime(osc.frequency.value, t);
          osc.frequency.linearRampToValueAtTime(value, t + MIN_RAMP);
        },
        setDetune: (value, time) => {
          const t = time ?? ctx.currentTime;
          osc.detune.setValueAtTime(osc.detune.value, t);
          osc.detune.linearRampToValueAtTime(value, t + MIN_RAMP);
        }
      };
    },
    createGain: (props) => {
      const gainNode = ctx.createGain();
      gainNode.gain.value = props?.gain ?? 1;
      const base = wrapNode(gainNode);
      return {
        ...base,
        gainParam: {
          connectModulator: (source) => {
            const s = source;
            if (s._connectTo) s._connectTo(gainNode.gain);
          },
          disconnectModulator: () => {
            try {
              gainNode.gain.value = gainNode.gain.value;
            } catch {
            }
          }
        },
        get gain() {
          return gainNode.gain.value;
        },
        setGain: (value, time) => {
          const t = time ?? ctx.currentTime;
          gainNode.gain.setValueAtTime(gainNode.gain.value, t);
          gainNode.gain.linearRampToValueAtTime(value, t + MIN_RAMP);
        },
        scheduleEnvelope: ({ peak, attack, decay, sustain, release, startTime }) => {
          const g = gainNode.gain;
          g.cancelScheduledValues(startTime);
          g.setValueAtTime(0, startTime);
          g.linearRampToValueAtTime(peak, startTime + attack);
          g.linearRampToValueAtTime(peak * sustain, startTime + attack + decay);
          g.linearRampToValueAtTime(0, startTime + attack + decay + release);
        }
      };
    },
    createNoise: (props) => {
      const noiseType = props?.type ?? "white";
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      noiseFiller[noiseType](buffer.getChannelData(0));
      const outputGain = ctx.createGain();
      const outputBase = wrapNode(outputGain);
      let source = null;
      return {
        ...outputBase,
        start: (time) => {
          if (source) {
            try {
              source.stop();
            } catch {
            }
            try {
              source.disconnect();
            } catch {
            }
          }
          source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          source.connect(outputGain);
          source.start(time);
        },
        stop: (time) => {
          if (source) {
            source.stop(time);
            source.disconnect();
            source = null;
          }
        }
      };
    },
    decodeAudio: async (data) => {
      try {
        const audioBuffer = await ctx.decodeAudioData(data);
        return {
          [BUFFER]: audioBuffer,
          duration: audioBuffer.duration,
          length: audioBuffer.length,
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels
        };
      } catch (err) {
        throw ScoreError("Failed to decode audio data", {
          fix: "Ensure the file is a valid audio format (WAV, MP3, OGG, FLAC)",
          received: err instanceof Error ? err.message : String(err),
          docs: "https://score.dev/docs/core#sample"
        });
      }
    },
    createBufferSource: (buffer, props) => {
      const rawBuffer = getRawBuffer(buffer);
      const source = ctx.createBufferSource();
      source.buffer = rawBuffer;
      source.loop = props?.loop ?? false;
      if (props?.playbackRate !== void 0) {
        source.playbackRate.value = props.playbackRate;
      }
      const base = wrapNode(source);
      let loopState = props?.loop ?? false;
      return {
        ...base,
        get loop() {
          return loopState;
        },
        setLoop: (loop) => {
          loopState = loop;
          source.loop = loop;
        },
        setPlaybackRate: (rate, time) => {
          const t = time ?? ctx.currentTime;
          source.playbackRate.setValueAtTime(source.playbackRate.value, t);
          source.playbackRate.linearRampToValueAtTime(rate, t + MIN_RAMP);
        },
        start: (time, offset, duration) => {
          source.start(time, offset, duration);
        },
        stop: (time) => {
          source.stop(time);
        }
      };
    },
    createFilter: (props) => {
      const filter = ctx.createBiquadFilter();
      filter.type = props?.type ?? "lowpass";
      filter.frequency.value = props?.frequency ?? 1e3;
      filter.Q.value = props?.Q ?? 1;
      filter.gain.value = props?.gain ?? 0;
      const base = wrapNode(filter);
      return {
        ...base,
        frequencyParam: {
          connectModulator: (source) => {
            const s = source;
            if (s._connectTo) s._connectTo(filter.frequency);
          },
          disconnectModulator: () => {
            try {
              filter.frequency.value = filter.frequency.value;
            } catch {
            }
          }
        },
        setFrequency: (value, time) => {
          const t = time ?? ctx.currentTime;
          filter.frequency.setValueAtTime(filter.frequency.value, t);
          filter.frequency.linearRampToValueAtTime(value, t + MIN_RAMP);
        },
        setQ: (value, time) => {
          const t = time ?? ctx.currentTime;
          filter.Q.setValueAtTime(filter.Q.value, t);
          filter.Q.linearRampToValueAtTime(value, t + MIN_RAMP);
        },
        setFilterGain: (value, time) => {
          const t = time ?? ctx.currentTime;
          filter.gain.setValueAtTime(filter.gain.value, t);
          filter.gain.linearRampToValueAtTime(value, t + MIN_RAMP);
        }
      };
    },
    createDelay: (props) => {
      const maxDelay = props?.maxDelayTime ?? 5;
      const delay = ctx.createDelay(maxDelay);
      delay.delayTime.value = props?.delayTime ?? 0;
      const base = wrapNode(delay);
      return {
        ...base,
        setDelayTime: (value, time) => {
          const t = time ?? ctx.currentTime;
          delay.delayTime.setValueAtTime(delay.delayTime.value, t);
          delay.delayTime.linearRampToValueAtTime(value, t + MIN_RAMP);
        }
      };
    },
    createCompressor: (props) => {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = props?.threshold ?? -24;
      comp.ratio.value = props?.ratio ?? 12;
      comp.knee.value = props?.knee ?? 30;
      comp.attack.value = props?.attack ?? 3e-3;
      comp.release.value = props?.release ?? 0.25;
      const base = wrapNode(comp);
      return {
        ...base,
        setThreshold: (value, time) => {
          const t = time ?? ctx.currentTime;
          comp.threshold.setValueAtTime(comp.threshold.value, t);
          comp.threshold.linearRampToValueAtTime(value, t + MIN_RAMP);
        },
        setRatio: (value, time) => {
          const t = time ?? ctx.currentTime;
          comp.ratio.setValueAtTime(comp.ratio.value, t);
          comp.ratio.linearRampToValueAtTime(value, t + MIN_RAMP);
        },
        setKnee: (value, time) => {
          const t = time ?? ctx.currentTime;
          comp.knee.setValueAtTime(comp.knee.value, t);
          comp.knee.linearRampToValueAtTime(value, t + MIN_RAMP);
        },
        setAttack: (value, time) => {
          const t = time ?? ctx.currentTime;
          comp.attack.setValueAtTime(comp.attack.value, t);
          comp.attack.linearRampToValueAtTime(value, t + MIN_RAMP);
        },
        setRelease: (value, time) => {
          const t = time ?? ctx.currentTime;
          comp.release.setValueAtTime(comp.release.value, t);
          comp.release.linearRampToValueAtTime(value, t + MIN_RAMP);
        }
      };
    },
    createWaveShaper: (props) => {
      const shaper = ctx.createWaveShaper();
      if (props?.curve) {
        shaper.curve = props.curve;
      }
      shaper.oversample = props?.oversample ?? "none";
      const base = wrapNode(shaper);
      return {
        ...base,
        setCurve: (curve) => {
          shaper.curve = curve;
        },
        setOversample: (value) => {
          shaper.oversample = value;
        }
      };
    },
    createStereoPanner: (props) => {
      const panner = ctx.createStereoPanner();
      panner.pan.value = props?.pan ?? 0;
      const base = wrapNode(panner);
      return {
        ...base,
        setPan: (value, time) => {
          const t = time ?? ctx.currentTime;
          panner.pan.setValueAtTime(panner.pan.value, t);
          panner.pan.linearRampToValueAtTime(value, t + MIN_RAMP);
        }
      };
    },
    suspend: () => ctx.suspend(),
    resume: () => ctx.resume(),
    close: () => {
      const maybeCloseable = ctx;
      return typeof maybeCloseable.close === "function" ? maybeCloseable.close() : Promise.resolve();
    }
  };
};
const webAudioBackend = {
  name: "web-audio",
  createContext: (options) => {
    try {
      if (options?.offline) {
        const sampleRate = options.sampleRate ?? 44100;
        const ctx = new nodeWebAudioApi.OfflineAudioContext(
          options.offline.numberOfChannels ?? 1,
          options.offline.length,
          sampleRate
        );
        return createBackendContext(ctx);
      }
      return createBackendContext(new nodeWebAudioApi.AudioContext(options));
    } catch (err) {
      throw ScoreError("Failed to create AudioContext", {
        fix: "Ensure node-web-audio-api is installed: pnpm add node-web-audio-api",
        received: err instanceof Error ? err.message : String(err),
        docs: "https://score.dev/docs/core#audio-context"
      });
    }
  }
};
const uid = (type) => `${type}-${node_crypto.randomUUID()}`;
const decodeSample = async (context, data) => {
  if (data.byteLength === 0) {
    throw ScoreError("Cannot decode empty audio data", {
      received: `ArrayBuffer(byteLength=${String(data.byteLength)})`,
      fix: "Provide a non-empty ArrayBuffer containing valid audio data (WAV, MP3, OGG, FLAC)",
      docs: "https://score.dev/docs/core#sample"
    });
  }
  return context.decodeAudio(data);
};
const createSamplePlayer = (context, buffer, props) => {
  const gainNode = context.createGain({ gain: props?.gain ?? 1 });
  const state = { activeSource: null };
  const component = {
    id: uid("sample"),
    type: "sample",
    buffer,
    start: (time, offset, duration) => {
      if (state.activeSource) {
        try {
          state.activeSource.stop();
        } catch {
        }
        try {
          state.activeSource.disconnect();
        } catch {
        }
      }
      const newSource = context.createBufferSource(buffer, {
        loop: props?.loop ?? false,
        playbackRate: props?.playbackRate ?? 1
      });
      state.activeSource = newSource;
      newSource.connect(gainNode);
      newSource.start(time, offset, duration);
    },
    stop: (time) => {
      if (state.activeSource) {
        try {
          state.activeSource.stop(time);
        } catch {
        }
        state.activeSource = null;
      }
    },
    setPlaybackRate: (rate, time) => {
      if (state.activeSource) {
        state.activeSource.setPlaybackRate(rate, time);
      }
    },
    setGain: (value, time) => {
      gainNode.setGain(value, time);
    },
    connect: (destination) => {
      gainNode.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        gainNode.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      if (state.activeSource) {
        try {
          state.activeSource.stop();
        } catch {
        }
        try {
          state.activeSource.disconnect();
        } catch {
        }
        state.activeSource = null;
      }
      try {
        gainNode.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createLFO = (context, props) => {
  const rate = props?.rate ?? 0.5;
  const depth = props?.depth ?? 100;
  const shape = props?.shape;
  if (rate < 0) {
    throw ScoreError("LFO rate must be non-negative", {
      received: `rate: ${String(rate)}`,
      fix: "Use a positive rate value in Hz (e.g. 0.5 for a slow sweep)",
      docs: "https://score.dev/docs/modulation/lfo"
    });
  }
  const osc = context.createOscillator({ type: shape, frequency: rate });
  const depthGain = context.createGain({ gain: depth });
  osc.connect(depthGain);
  osc.start();
  const MIN_RAMP2 = 0.01;
  const component = {
    id: uid("lfo"),
    type: "lfo",
    connect: (param) => {
      param.connectModulator(depthGain);
    },
    setRate: (hz, time) => {
      const t = time ?? context.currentTime;
      osc.setFrequency(hz, t + MIN_RAMP2);
    },
    setDepth: (d, time) => {
      depthGain.setGain(d, time);
    },
    setShape: (_shape) => {
    },
    disconnect: () => {
      try {
        depthGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        osc.stop();
      } catch {
      }
      try {
        osc.disconnect();
      } catch {
      }
      try {
        depthGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const NOTE_TO_MIDI = (() => {
  const SEMITONES = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11
  };
  const SHARPS = ["C", "D", "E", "F", "G", "A", "B"];
  const FLATS = { "Db": 1, "Eb": 3, "Fb": 4, "Gb": 6, "Ab": 8, "Bb": 10, "Cb": 11 };
  const map = {};
  for (let octave = 0; octave <= 8; octave++) {
    for (const letter of SHARPS) {
      const semi = SEMITONES[letter];
      const midi = (octave + 1) * 12 + semi;
      if (midi >= 0 && midi <= 127) {
        map[`${letter}${String(octave)}`] = midi;
        if (semi < 11) {
          const sharpMidi = midi + 1;
          if (sharpMidi <= 127) {
            map[`${letter}#${String(octave)}`] = sharpMidi;
          }
        }
      }
    }
    for (const [flatName, semi] of Object.entries(FLATS)) {
      const midi = (octave + 1) * 12 + semi;
      if (midi >= 0 && midi <= 127) {
        map[`${flatName}${String(octave)}`] = midi;
      }
    }
  }
  return map;
})();
const noteToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const noteNameToHz = (name) => {
  const midi = NOTE_TO_MIDI[name];
  return midi !== void 0 ? noteToHz(midi) : 440;
};
const Theremin = (context, props) => {
  const baseFreq = noteNameToHz(props?.note ?? "A4");
  const vibratoRate = props?.vibratoRate ?? 5;
  const vibratoDepth = props?.vibratoDepth ?? 8;
  const initialGain = props?.gain ?? 0.4;
  const oscNode = context.createOscillator({ type: "sine", frequency: baseFreq });
  const gainNode = context.createGain({ gain: initialGain });
  const lfo = createLFO(context, { rate: vibratoRate, shape: "sine", depth: vibratoDepth });
  lfo.connect(oscNode.frequencyParam);
  oscNode.connect(gainNode);
  const component = {
    id: uid("theremin"),
    type: "theremin",
    start: (time) => {
      oscNode.start(time);
    },
    stop: (time) => {
      oscNode.stop(time);
    },
    setFrequency: (hz, time) => {
      oscNode.setFrequency(hz, time);
    },
    setGain: (value, time) => {
      gainNode.setGain(value, time);
    },
    connect: (destination) => {
      gainNode.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        gainNode.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        oscNode.stop();
      } catch {
      }
      lfo.dispose();
      try {
        oscNode.disconnect();
      } catch {
      }
      try {
        gainNode.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const Sax = (context, props) => {
  const freq = noteNameToHz(props?.note ?? "A4");
  const peakGain = props?.gain ?? 0.4;
  const oscNode = context.createOscillator({ type: "sawtooth", frequency: freq });
  const filterNode = context.createFilter({ type: "bandpass", frequency: 1200, Q: 2 });
  const gainNode = context.createGain({ gain: 0 });
  oscNode.connect(filterNode);
  filterNode.connect(gainNode);
  const component = {
    id: uid("sax"),
    type: "sax",
    start: (time) => {
      oscNode.start(time);
    },
    stop: (time) => {
      oscNode.stop(time);
    },
    trigger: (time, duration = 0.35) => {
      gainNode.scheduleEnvelope({
        peak: peakGain,
        attack: 0.015,
        // 15ms — classic sax tongue attack
        decay: 0.1,
        sustain: 0.6,
        release: 0.08,
        startTime: time,
        duration
      });
    },
    setFrequency: (hz, time) => {
      oscNode.setFrequency(hz, time);
    },
    connect: (destination) => {
      gainNode.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        gainNode.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        oscNode.stop();
      } catch {
      }
      try {
        oscNode.disconnect();
      } catch {
      }
      try {
        filterNode.disconnect();
      } catch {
      }
      try {
        gainNode.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createFilter = (context, props) => {
  const filterNode = context.createFilter({
    type: props?.type ?? "lowpass",
    frequency: props?.frequency ?? 1e3,
    Q: props?.Q ?? 1,
    gain: props?.gain ?? 0
  });
  const component = {
    id: uid("filter"),
    type: "filter",
    /**
     * Set the filter cutoff or center frequency.
     *
     * @param value - Frequency in Hz. Typical range `20–20000`.
     * @param time - Optional schedule time in seconds.
     */
    setFrequency: (value, time) => {
      filterNode.setFrequency(value, time);
    },
    /**
     * Set the resonance (Q factor). Higher values produce a pronounced peak at the cutoff.
     *
     * @param value - Q factor. `0.707` = Butterworth (no peak), `10+` = sharp resonance.
     * @param time - Optional schedule time in seconds.
     */
    setQ: (value, time) => {
      filterNode.setQ(value, time);
    },
    /**
     * Set the filter gain in dB. Only meaningful for `'peaking'`, `'lowshelf'`, and `'highshelf'` types.
     *
     * @param value - Gain in dB. Positive = boost, negative = cut.
     * @param time - Optional schedule time in seconds.
     */
    setGain: (value, time) => {
      filterNode.setFilterGain(value, time);
    },
    connect: (destination) => {
      filterNode.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        filterNode.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        filterNode.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createDelay = (context, props) => {
  const delayTime = props?.time ?? 0.25;
  const feedbackAmount = Math.min(props?.feedback ?? 0.3, 0.95);
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1));
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const dryGain = context.createGain({ gain: 1 - mixAmount });
  const wetGain = context.createGain({ gain: mixAmount });
  const feedbackGain = context.createGain({ gain: feedbackAmount });
  const delayNode = context.createDelay({ delayTime, maxDelayTime: 5 });
  inputGain.connect(dryGain);
  dryGain.connect(outputGain);
  inputGain.connect(delayNode);
  delayNode.connect(wetGain);
  wetGain.connect(outputGain);
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  const component = {
    id: uid("delay"),
    type: "delay",
    /**
     * Set the delay time in seconds.
     *
     * @param value - Delay time in seconds. `0.25` = quarter note at 120 BPM.
     * @param time - Optional schedule time in seconds.
     */
    setTime: (value, time) => {
      delayNode.setDelayTime(value, time);
    },
    /**
     * Set the feedback amount. Controls how many echoes are heard before silence.
     * Clamped to `0.95` to prevent runaway feedback.
     *
     * @param value - Feedback `0–0.95`. `0.8+` creates long, dense echo tails.
     * @param time - Optional schedule time in seconds.
     */
    setFeedback: (value, time) => {
      feedbackGain.setGain(Math.min(value, 0.95), time);
    },
    /**
     * Set the wet/dry mix. `0` = dry signal only, `1` = delay only.
     *
     * @param value - Mix ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (value, time) => {
      const clamped = Math.max(0, Math.min(value, 1));
      dryGain.setGain(1 - clamped, time);
      wetGain.setGain(clamped, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        dryGain.disconnect();
      } catch {
      }
      try {
        wetGain.disconnect();
      } catch {
      }
      try {
        feedbackGain.disconnect();
      } catch {
      }
      try {
        delayNode.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createReverb = (context, props) => {
  const decay = props?.decay ?? 2;
  const mixAmount = props?.mix ?? 0.3;
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const dryGain = context.createGain({ gain: 1 - mixAmount });
  const wetGain = context.createGain({ gain: mixAmount });
  inputGain.connect(dryGain);
  dryGain.connect(outputGain);
  const taps = 6;
  const tapNodes = Array.from({ length: taps }, (_, i) => {
    const tapDelay = context.createDelay({
      delayTime: (i + 1) * decay / taps,
      maxDelayTime: decay + 1
    });
    const tapGain = context.createGain({ gain: Math.pow(0.6, i + 1) });
    inputGain.connect(tapDelay);
    tapDelay.connect(tapGain);
    tapGain.connect(wetGain);
    return { tapDelay, tapGain };
  });
  wetGain.connect(outputGain);
  const component = {
    id: uid("reverb"),
    type: "reverb",
    /**
     * Set the wet/dry mix. `0` = fully dry, `1` = fully reverberant.
     *
     * @param value - Mix ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (value, time) => {
      dryGain.setGain(1 - value, time);
      wetGain.setGain(value, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      tapNodes.forEach(({ tapGain, tapDelay }) => {
        try {
          tapGain.disconnect();
        } catch {
        }
        try {
          tapDelay.disconnect();
        } catch {
        }
      });
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        dryGain.disconnect();
      } catch {
      }
      try {
        wetGain.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createCompressor = (context, props) => {
  const compNode = context.createCompressor({
    threshold: props?.threshold ?? -24,
    ratio: props?.ratio ?? 12,
    knee: props?.knee ?? 30,
    attack: props?.attack ?? 3e-3,
    release: props?.release ?? 0.25
  });
  const component = {
    id: uid("compressor"),
    type: "compressor",
    /**
     * Set the compression threshold in dBFS. Signals above this level are compressed.
     *
     * @param value - Threshold in dBFS. Typically `-40` to `0`.
     * @param time - Optional schedule time in seconds.
     */
    setThreshold: (value, time) => {
      compNode.setThreshold(value, time);
    },
    /**
     * Set the compression ratio. Higher ratios = more aggressive compression.
     *
     * @param value - Ratio (e.g. `4` = 4:1). `20+` approaches hard limiting.
     * @param time - Optional schedule time in seconds.
     */
    setRatio: (value, time) => {
      compNode.setRatio(value, time);
    },
    connect: (destination) => {
      compNode.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        compNode.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        compNode.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createEQ = (context, props) => {
  const lowFilter = context.createFilter({
    type: "lowshelf",
    frequency: 320,
    gain: props?.low ?? 0
  });
  const midFilter = context.createFilter({
    type: "peaking",
    frequency: 1e3,
    Q: 1,
    gain: props?.mid ?? 0
  });
  const highFilter = context.createFilter({
    type: "highshelf",
    frequency: 3200,
    gain: props?.high ?? 0
  });
  lowFilter.connect(midFilter);
  midFilter.connect(highFilter);
  const component = {
    id: uid("eq"),
    type: "eq",
    input: lowFilter,
    /**
     * Set the low shelf gain at 320 Hz.
     *
     * @param value - Gain in dB. `+3` = warm bass boost, `-6` = sub cut.
     * @param time - Optional schedule time in seconds.
     */
    setLow: (value, time) => {
      lowFilter.setFilterGain(value, time);
    },
    /**
     * Set the mid peak gain at 1000 Hz.
     *
     * @param value - Gain in dB. `+3` = more presence, `-6` = removes midrange mud.
     * @param time - Optional schedule time in seconds.
     */
    setMid: (value, time) => {
      midFilter.setFilterGain(value, time);
    },
    /**
     * Set the high shelf gain at 3200 Hz.
     *
     * @param value - Gain in dB. `+3` = air and sparkle, `-3` = tame brightness.
     * @param time - Optional schedule time in seconds.
     */
    setHigh: (value, time) => {
      highFilter.setFilterGain(value, time);
    },
    connect: (destination) => {
      highFilter.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        highFilter.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        lowFilter.disconnect();
      } catch {
      }
      try {
        midFilter.disconnect();
      } catch {
      }
      try {
        highFilter.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const makeSoftCurve = (amount) => {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const k = amount * 100;
  for (let i = 0; i < samples; i++) {
    const x = i * 2 / samples - 1;
    curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
  }
  return curve;
};
const makeHardCurve = (amount) => {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const threshold = 1 - amount * 0.9;
  for (let i = 0; i < samples; i++) {
    const x = i * 2 / samples - 1;
    curve[i] = Math.max(-threshold, Math.min(threshold, x)) / threshold;
  }
  return curve;
};
const makeFoldbackCurve = (amount) => {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const threshold = 1 - amount * 0.8;
  for (let i = 0; i < samples; i++) {
    const x = i * 2 / samples - 1;
    if (Math.abs(x) > threshold) {
      curve[i] = Math.abs(Math.abs((x - threshold) % (threshold * 4)) - threshold * 2) - threshold;
    } else {
      curve[i] = x;
    }
  }
  return curve;
};
const curveGenerators = {
  soft: makeSoftCurve,
  hard: makeHardCurve,
  foldback: makeFoldbackCurve
};
const createDistortion = (context, props) => {
  const amount = Math.max(0, Math.min(props?.amount ?? 0.5, 1));
  const mode = props?.mode ?? "soft";
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1));
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const dryGain = context.createGain({ gain: 1 - mixAmount });
  const wetGain = context.createGain({ gain: mixAmount });
  const shaper = context.createWaveShaper({ curve: curveGenerators[mode](amount), oversample: "2x" });
  inputGain.connect(dryGain);
  dryGain.connect(outputGain);
  inputGain.connect(shaper);
  shaper.connect(wetGain);
  wetGain.connect(outputGain);
  const component = {
    id: uid("distortion"),
    type: "distortion",
    /**
     * Set the distortion amount and optionally switch the mode.
     * Regenerates the transfer curve immediately.
     *
     * @param value - Distortion amount `0–1`.
     * @param mode - Optional new mode (`'soft'`, `'hard'`, `'foldback'`). Defaults to the initially configured mode.
     */
    setAmount: (value, newMode) => {
      const clamped = Math.max(0, Math.min(value, 1));
      const m = newMode ?? mode;
      shaper.setCurve(curveGenerators[m](clamped));
    },
    /**
     * Set the wet/dry mix. `0` = dry, `1` = fully distorted.
     *
     * @param value - Mix ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (value, time) => {
      const clamped = Math.max(0, Math.min(value, 1));
      dryGain.setGain(1 - clamped, time);
      wetGain.setGain(clamped, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        dryGain.disconnect();
      } catch {
      }
      try {
        wetGain.disconnect();
      } catch {
      }
      try {
        shaper.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createLimiter = (context, props) => {
  const ceilingDb = props?.ceiling ?? -0.3;
  const lookaheadTime = props?.lookahead ?? 5e-3;
  const releaseTime = props?.release ?? 0.1;
  const inputGain = context.createGain({ gain: 1 });
  const lookaheadDelay = context.createDelay({ delayTime: lookaheadTime, maxDelayTime: 0.05 });
  const compressor = context.createCompressor({
    threshold: ceilingDb,
    ratio: 20,
    knee: 0,
    attack: 1e-3,
    release: releaseTime
  });
  const outputGain = context.createGain({ gain: 1 });
  inputGain.connect(lookaheadDelay);
  lookaheadDelay.connect(compressor);
  compressor.connect(outputGain);
  const component = {
    id: uid("limiter"),
    type: "limiter",
    input: inputGain,
    /**
     * Set the ceiling threshold in dBFS. The compressor limits at this level.
     * Lower values (more negative) leave more headroom.
     *
     * @param value - Ceiling in dBFS. Typical range `-6` to `0`. Default `-0.3`.
     * @param time - Optional schedule time in seconds.
     */
    setCeiling: (value, time) => {
      compressor.setThreshold(value, time);
    },
    /**
     * Set the lookahead delay time. Longer lookahead catches faster transients
     * but adds latency.
     *
     * @param value - Lookahead in seconds. `0.005` = 5ms, max `0.05`.
     * @param time - Optional schedule time in seconds.
     */
    setLookahead: (value, time) => {
      lookaheadDelay.setDelayTime(value, time);
    },
    /**
     * Set the gain reduction release time.
     *
     * @param value - Release in seconds. Default `0.1` (100ms).
     * @param time - Optional schedule time in seconds.
     */
    setRelease: (value, time) => {
      compressor.setRelease(value, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        lookaheadDelay.disconnect();
      } catch {
      }
      try {
        compressor.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createStereoWidener = (context, props) => {
  const width = Math.max(0, Math.min(props?.width ?? 1, 2));
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const midGain = context.createGain({ gain: 2 - width });
  const sideGain = context.createGain({ gain: width });
  const panLeft = context.createStereoPanner({ pan: -1 });
  const panRight = context.createStereoPanner({ pan: 1 });
  inputGain.connect(midGain);
  midGain.connect(outputGain);
  inputGain.connect(sideGain);
  sideGain.connect(panLeft);
  sideGain.connect(panRight);
  panLeft.connect(outputGain);
  panRight.connect(outputGain);
  const component = {
    id: uid("stereo-widener"),
    type: "stereo-widener",
    /**
     * Set the stereo width. `1.0` = unity (no change). `0` = mono. `2.0` = maximum width.
     *
     * @param value - Width `0–2.0`.
     * @param time - Optional schedule time in seconds.
     */
    setWidth: (value, time) => {
      const clamped = Math.max(0, Math.min(value, 2));
      midGain.setGain(2 - clamped, time);
      sideGain.setGain(clamped, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        midGain.disconnect();
      } catch {
      }
      try {
        sideGain.disconnect();
      } catch {
      }
      try {
        panLeft.disconnect();
      } catch {
      }
      try {
        panRight.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createGate = (context, props) => {
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const gateComp = context.createCompressor({
    threshold: props?.threshold ?? -40,
    ratio: 20,
    knee: 0,
    attack: props?.attack ?? 1e-3,
    release: props?.release ?? 0.05
  });
  inputGain.connect(gateComp);
  gateComp.connect(outputGain);
  const component = {
    id: uid("gate"),
    type: "gate",
    /**
     * Set the gate threshold in dBFS. Signal below this level is silenced.
     *
     * @param value - Threshold in dBFS. Lower values = only very quiet signals are gated.
     * @param time - Optional schedule time in seconds.
     */
    setThreshold: (value, _time) => {
      gateComp.setThreshold(value);
    },
    /**
     * Set how quickly the gate opens when the signal rises above threshold.
     *
     * @param value - Attack time in seconds. `0.001` = 1ms (fast, snappy gate).
     * @param time - Optional schedule time in seconds.
     */
    setAttack: (value, _time) => {
      gateComp.setAttack(value);
    },
    /**
     * Set how quickly the gate closes after the signal drops below threshold.
     *
     * @param value - Release time in seconds. Longer = natural decay; shorter = abrupt cutoff.
     * @param time - Optional schedule time in seconds.
     */
    setRelease: (value, _time) => {
      gateComp.setRelease(value);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        gateComp.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createChorus = (context, props) => {
  const voiceCount = Math.max(2, Math.min(props?.voices ?? 3, 4));
  const depth = Math.max(0, Math.min(props?.depth ?? 2e-3, 0.02));
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1));
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const dryGain = context.createGain({ gain: 1 - mixAmount });
  const wetGain = context.createGain({ gain: mixAmount });
  inputGain.connect(dryGain);
  dryGain.connect(outputGain);
  const mixNode = context.createGain({ gain: 1 / voiceCount });
  const voices = Array.from({ length: voiceCount }, (_, i) => {
    const offset = depth * ((i + 1) / voiceCount);
    const voiceDelay = context.createDelay({ delayTime: 0.01 + offset, maxDelayTime: 0.05 });
    const voiceGain = context.createGain({ gain: 1 });
    inputGain.connect(voiceDelay);
    voiceDelay.connect(voiceGain);
    voiceGain.connect(mixNode);
    return { voiceDelay, voiceGain };
  });
  mixNode.connect(wetGain);
  wetGain.connect(outputGain);
  const component = {
    id: uid("chorus"),
    type: "chorus",
    /**
     * Set the voice delay depth. Controls the spread between chorus voices.
     * Higher values create more pitch movement and widening.
     *
     * @param value - Depth in seconds `0–0.02`. `0.002` = subtle, `0.015` = wide.
     * @param time - Optional schedule time in seconds.
     */
    setDepth: (value, time) => {
      const clamped = Math.max(0, Math.min(value, 0.02));
      voices.forEach((v, i) => {
        const offset = clamped * ((i + 1) / voices.length);
        v.voiceDelay.setDelayTime(0.01 + offset, time);
      });
    },
    /**
     * Set the wet/dry mix. `0` = dry, `1` = full chorus.
     *
     * @param value - Mix ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (value, time) => {
      const clamped = Math.max(0, Math.min(value, 1));
      dryGain.setGain(1 - clamped, time);
      wetGain.setGain(clamped, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        dryGain.disconnect();
      } catch {
      }
      try {
        wetGain.disconnect();
      } catch {
      }
      try {
        mixNode.disconnect();
      } catch {
      }
      voices.forEach((v) => {
        try {
          v.voiceDelay.disconnect();
        } catch {
        }
        try {
          v.voiceGain.disconnect();
        } catch {
        }
      });
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createFlanger = (context, props) => {
  const depth = Math.max(0, Math.min(props?.depth ?? 2e-3, 0.01));
  const feedbackAmount = Math.min(props?.feedback ?? 0.5, 0.95);
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 0.5, 1));
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const dryGain = context.createGain({ gain: 1 - mixAmount });
  const wetGain = context.createGain({ gain: mixAmount });
  const flangeDelay = context.createDelay({ delayTime: depth, maxDelayTime: 0.02 });
  const feedbackGain = context.createGain({ gain: feedbackAmount });
  inputGain.connect(dryGain);
  dryGain.connect(outputGain);
  inputGain.connect(flangeDelay);
  flangeDelay.connect(wetGain);
  wetGain.connect(outputGain);
  flangeDelay.connect(feedbackGain);
  feedbackGain.connect(flangeDelay);
  const component = {
    id: uid("flanger"),
    type: "flanger",
    /**
     * Set the flange delay depth. Controls the comb-filter frequency spacing.
     * Shorter delays = higher-frequency notches; longer = lower.
     *
     * @param value - Depth in seconds `0–0.01`. `0.002` = subtle, `0.008` = dramatic.
     * @param time - Optional schedule time in seconds.
     */
    setDepth: (value, time) => {
      flangeDelay.setDelayTime(Math.max(0, Math.min(value, 0.01)), time);
    },
    /**
     * Set the feedback amount. Higher values create sharper, more metallic resonance.
     * Clamped to `0.95` to prevent instability.
     *
     * @param value - Feedback `0–0.95`.
     * @param time - Optional schedule time in seconds.
     */
    setFeedback: (value, time) => {
      feedbackGain.setGain(Math.min(value, 0.95), time);
    },
    /**
     * Set the wet/dry mix. `0` = dry, `1` = fully flanged.
     *
     * @param value - Mix ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (value, time) => {
      const clamped = Math.max(0, Math.min(value, 1));
      dryGain.setGain(1 - clamped, time);
      wetGain.setGain(clamped, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        dryGain.disconnect();
      } catch {
      }
      try {
        wetGain.disconnect();
      } catch {
      }
      try {
        flangeDelay.disconnect();
      } catch {
      }
      try {
        feedbackGain.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createPhaser = (context, props) => {
  const stageCount = Math.max(2, Math.min(props?.stages ?? 4, 12));
  const feedbackAmount = Math.min(props?.feedback ?? 0.3, 0.95);
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const wetGain = context.createGain({ gain: 0.5 });
  const feedbackGain = context.createGain({ gain: feedbackAmount });
  const filters = Array.from({ length: stageCount }, (_, i) => {
    const freq = 200 * Math.pow(2, i / stageCount * 4);
    return context.createFilter({ type: "allpass", frequency: freq, Q: 0.7 });
  });
  const firstFilter = filters[0];
  const lastFilter = filters[filters.length - 1];
  if (!firstFilter || !lastFilter) {
    throw ScoreError("Phaser requires at least 2 stages", {
      received: String(filters.length),
      fix: "Set stages to a value between 2 and 12",
      docs: "https://score.dev/docs/effects#phaser"
    });
  }
  inputGain.connect(firstFilter);
  filters.forEach((current, i) => {
    const next = filters[i + 1];
    if (next) current.connect(next);
  });
  lastFilter.connect(wetGain);
  wetGain.connect(outputGain);
  inputGain.connect(outputGain);
  lastFilter.connect(feedbackGain);
  feedbackGain.connect(firstFilter);
  const component = {
    id: uid("phaser"),
    type: "phaser",
    /**
     * Set the phaser feedback amount. Higher feedback creates sharper, more resonant notches.
     * Clamped to `0.95` to prevent instability.
     *
     * @param value - Feedback `0–0.95`.
     * @param time - Optional schedule time in seconds.
     */
    setFeedback: (value, time) => {
      feedbackGain.setGain(Math.min(value, 0.95), time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        wetGain.disconnect();
      } catch {
      }
      try {
        feedbackGain.disconnect();
      } catch {
      }
      filters.forEach((f) => {
        try {
          f.disconnect();
        } catch {
        }
      });
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createBitCrusher = (context, props) => {
  const bits = Math.max(1, Math.min(props?.bits ?? 8, 16));
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 1, 1));
  const step = Math.pow(2, bits);
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const dryGain = context.createGain({ gain: 1 - mixAmount });
  const wetGain = context.createGain({ gain: mixAmount });
  const crushUpGain = context.createGain({ gain: step });
  const crushDownGain = context.createGain({ gain: 1 / step });
  inputGain.connect(dryGain);
  dryGain.connect(outputGain);
  inputGain.connect(crushUpGain);
  crushUpGain.connect(crushDownGain);
  crushDownGain.connect(wetGain);
  wetGain.connect(outputGain);
  const component = {
    id: uid("bitcrusher"),
    type: "bitcrusher",
    /**
     * Set the bit depth. Lower values = more quantization noise and aliasing.
     * Takes effect immediately — no ramp needed as the result is non-continuous.
     *
     * @param value - Bit depth `1–16`. `8` = classic lo-fi, `1` = 1-bit square wave mayhem.
     */
    setBits: (value) => {
      const clamped = Math.max(1, Math.min(value, 16));
      const newStep = Math.pow(2, clamped);
      crushUpGain.setGain(newStep);
      crushDownGain.setGain(1 / newStep);
    },
    /**
     * Set the wet/dry mix. `0` = clean signal, `1` = fully crushed.
     *
     * @param value - Mix ratio `0–1`.
     * @param time - Optional schedule time in seconds.
     */
    setMix: (value, time) => {
      const clamped = Math.max(0, Math.min(value, 1));
      dryGain.setGain(1 - clamped, time);
      wetGain.setGain(clamped, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        dryGain.disconnect();
      } catch {
      }
      try {
        wetGain.disconnect();
      } catch {
      }
      try {
        crushUpGain.disconnect();
      } catch {
      }
      try {
        crushDownGain.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createEffectsChain = (context, effects) => {
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const first = effects[0];
  const last = effects[effects.length - 1];
  if (!first || !last) {
    inputGain.connect(outputGain);
  } else {
    inputGain.connect(first);
    for (let i = 0; i < effects.length - 1; i++) {
      const current = effects[i];
      const next = effects[i + 1];
      if (current && next) {
        current.connect(next);
      }
    }
    last.connect(outputGain);
  }
  const component = {
    id: uid("effects-chain"),
    type: "effects-chain",
    /** The raw input node — connect upstream audio here when building custom routing. */
    input: inputGain,
    /**
     * Retrieve an effect by index for runtime parameter changes.
     *
     * @param index - Zero-based position in the effects array.
     * @returns The `AudioComponent` at that index, or `undefined` if out of range.
     */
    getEffect: (index) => effects[index],
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        inputGain.disconnect();
      } catch {
      }
      for (const effect of effects) {
        try {
          effect.dispose();
        } catch {
        }
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createChannel = (context, props, onSoloChange) => {
  const channelName = props?.name ?? "Channel";
  const state = {
    mute: props?.mute ?? false,
    solo: props?.solo ?? false,
    sends: []
  };
  const inputGain = context.createGain({ gain: 1 });
  const effects = props?.effects ? [...props.effects] : [];
  const chain = effects.length > 0 ? createEffectsChain(context, effects) : null;
  if (chain) {
    inputGain.connect(chain.input);
  }
  const eq = createEQ(context, props?.eq);
  if (chain) {
    chain.connect(eq.input);
  } else {
    inputGain.connect(eq.input);
  }
  const panNode = context.createStereoPanner({ pan: props?.pan ?? 0 });
  const volumeGain = context.createGain({ gain: props?.volume ?? 0.8 });
  const muteGain = context.createGain({ gain: state.mute ? 0 : 1 });
  const outputGain = context.createGain({ gain: 1 });
  eq.connect(panNode);
  panNode.connect(volumeGain);
  volumeGain.connect(muteGain);
  muteGain.connect(outputGain);
  const component = {
    id: uid("channel"),
    type: "channel",
    input: inputGain,
    get name() {
      return channelName;
    },
    get mute() {
      return state.mute;
    },
    get solo() {
      return state.solo;
    },
    setVolume: (value, time) => {
      volumeGain.setGain(value, time);
    },
    setPan: (value, time) => {
      panNode.setPan(value, time);
    },
    setMute: (value) => {
      state.mute = value;
      muteGain.setGain(value ? 0 : 1);
    },
    setSolo: (value) => {
      state.solo = value;
      if (onSoloChange) {
        onSoloChange();
      }
    },
    setEQ: (eqProps) => {
      if (eqProps.low !== void 0) {
        eq.setLow(eqProps.low);
      }
      if (eqProps.mid !== void 0) {
        eq.setMid(eqProps.mid);
      }
      if (eqProps.high !== void 0) {
        eq.setHigh(eqProps.high);
      }
    },
    createSend: (returnInput) => {
      const sendGain = context.createGain({ gain: 0.5 });
      muteGain.connect(sendGain);
      sendGain.connect(returnInput);
      state.sends.push({ gainNode: sendGain });
      const sendState = { disposed: false };
      return {
        setLevel: (value, time) => {
          sendGain.setGain(value, time);
        },
        dispose: () => {
          if (!sendState.disposed) {
            sendState.disposed = true;
            state.sends = state.sends.filter((s) => s.gainNode !== sendGain);
            try {
              sendGain.disconnect();
            } catch {
            }
          }
        }
      };
    },
    // Internal: allows mixer to override mute gain for solo logic
    setMuteGain: (value) => {
      muteGain.setGain(value);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      for (const send2 of state.sends) {
        try {
          send2.gainNode.disconnect();
        } catch {
        }
      }
      if (chain) {
        try {
          chain.dispose();
        } catch {
        }
      }
      try {
        eq.dispose();
      } catch {
      }
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        panNode.disconnect();
      } catch {
      }
      try {
        volumeGain.disconnect();
      } catch {
      }
      try {
        muteGain.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createReturn = (context, props) => {
  const returnName = props.name ?? "Return";
  const inputGain = context.createGain({ gain: 1 });
  const volumeGain = context.createGain({ gain: props.volume ?? 0.8 });
  const outputGain = context.createGain({ gain: 1 });
  inputGain.connect(props.effect.input);
  props.effect.connect(volumeGain);
  volumeGain.connect(outputGain);
  const component = {
    id: uid("return"),
    type: "return",
    input: inputGain,
    get name() {
      return returnName;
    },
    setVolume: (value, time) => {
      volumeGain.setGain(value, time);
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      try {
        props.effect.dispose();
      } catch {
      }
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        volumeGain.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createGroup = (context, props) => {
  const groupName = props?.name ?? "Group";
  const inputGain = context.createGain({ gain: 1 });
  const outputGain = context.createGain({ gain: 1 });
  const effects = props?.effects ? [...props.effects] : [];
  const chain = effects.length > 0 ? createEffectsChain(context, effects) : null;
  if (chain) {
    inputGain.connect(chain.input);
  }
  const eq = createEQ(context, props?.eq);
  if (chain) {
    chain.connect(eq);
  } else {
    inputGain.connect(eq);
  }
  const volumeGain = context.createGain({ gain: props?.volume ?? 0.8 });
  eq.connect(volumeGain);
  volumeGain.connect(outputGain);
  const component = {
    id: uid("group"),
    type: "group",
    input: inputGain,
    get name() {
      return groupName;
    },
    setVolume: (value, time) => {
      volumeGain.setGain(value, time);
    },
    setEQ: (eqProps) => {
      if (eqProps.low !== void 0) {
        eq.setLow(eqProps.low);
      }
      if (eqProps.mid !== void 0) {
        eq.setMid(eqProps.mid);
      }
      if (eqProps.high !== void 0) {
        eq.setHigh(eqProps.high);
      }
    },
    connect: (destination) => {
      outputGain.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        outputGain.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      if (chain) {
        try {
          chain.dispose();
        } catch {
        }
      }
      try {
        eq.dispose();
      } catch {
      }
      try {
        inputGain.disconnect();
      } catch {
      }
      try {
        volumeGain.disconnect();
      } catch {
      }
      try {
        outputGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createMixer = (context, props) => {
  const masterGain = context.createGain({ gain: props?.masterVolume });
  const masterEQ = createEQ(context);
  const limiter = createLimiter(context, { ceiling: props?.limiterCeiling ?? -0.3 });
  masterGain.connect(masterEQ.input);
  masterEQ.connect(limiter.input);
  limiter.connect(context.destination);
  const state = { channels: [], returns: [], groups: [] };
  const updateSoloState = (channels) => {
    const anySoloed = channels.some((ch) => ch.solo);
    for (const ch of channels) {
      ch.setMuteGain(anySoloed ? ch.solo ? ch.mute ? 0 : 1 : 0 : ch.mute ? 0 : 1);
    }
  };
  if (props?.channels) {
    for (const chProps of props.channels) {
      const ch = createChannel(context, chProps, () => {
        updateSoloState(state.channels);
      });
      ch.connect(masterGain);
      state.channels.push(ch);
    }
  }
  if (props?.returns) {
    for (const retProps of props.returns) {
      const ret = createReturn(context, retProps);
      ret.connect(masterGain);
      state.returns.push(ret);
    }
  }
  if (props?.groups) {
    for (const grpProps of props.groups) {
      const grp = createGroup(context, grpProps);
      grp.connect(masterGain);
      state.groups.push(grp);
    }
  }
  const component = {
    id: uid("mixer"),
    type: "mixer",
    getChannel: (index) => state.channels[index],
    getReturn: (index) => state.returns[index],
    getGroup: (index) => state.groups[index],
    setMasterVolume: (value, time) => {
      masterGain.setGain(value, time);
    },
    addChannel: (channelProps) => {
      const ch = createChannel(context, channelProps, () => {
        updateSoloState(state.channels);
      });
      const targetGroup = channelProps?.groupId ? state.groups.find((g) => g.id === channelProps.groupId) : void 0;
      ch.connect(targetGroup ? targetGroup.input : masterGain);
      state.channels.push(ch);
      return ch;
    },
    addGroup: (groupProps) => {
      const grp = createGroup(context, groupProps);
      grp.connect(masterGain);
      state.groups.push(grp);
      return grp;
    },
    removeChannel: (index) => {
      const ch = state.channels[index];
      if (ch) {
        ch.disconnect();
        ch.dispose();
        state.channels = state.channels.filter((_, i) => i !== index);
        updateSoloState(state.channels);
      }
    },
    connect: (destination) => {
      limiter.disconnect();
      limiter.connect(destination);
      return component;
    },
    disconnect: () => {
      try {
        limiter.disconnect();
      } catch {
      }
      return component;
    },
    dispose: () => {
      for (const ch of state.channels) {
        try {
          ch.disconnect();
        } catch {
        }
        try {
          ch.dispose();
        } catch {
        }
      }
      for (const ret of state.returns) {
        try {
          ret.disconnect();
        } catch {
        }
        try {
          ret.dispose();
        } catch {
        }
      }
      for (const grp of state.groups) {
        try {
          grp.disconnect();
        } catch {
        }
        try {
          grp.dispose();
        } catch {
        }
      }
      try {
        masterEQ.dispose();
      } catch {
      }
      try {
        limiter.dispose();
      } catch {
      }
      try {
        masterGain.disconnect();
      } catch {
      }
    }
  };
  return component;
};
const createClock = (context, props) => {
  const ticksPerBeat = props?.ticksPerBeat;
  const lookaheadMs = props?.lookaheadMs ?? 25;
  const scheduleAheadSec = props?.scheduleAheadSec ?? 0.1;
  const scheduleFn = props?.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const state = {
    bpm: props?.bpm ?? 120,
    tickDuration: 60 / ((props?.bpm ?? 120) * ticksPerBeat),
    running: false,
    tick: 0,
    nextTickTime: 0,
    timerId: null
  };
  const callbacks = [];
  const schedule = () => {
    while (state.nextTickTime < context.currentTime + scheduleAheadSec) {
      const currentTickNumber = state.tick;
      const currentTickTime = state.nextTickTime;
      for (const cb of callbacks) {
        cb(currentTickTime, currentTickNumber);
      }
      state.tick += 1;
      state.nextTickTime += state.tickDuration;
    }
  };
  const loop = () => {
    if (!state.running) return;
    schedule();
    state.timerId = scheduleFn(loop, lookaheadMs);
  };
  const clock = {
    start: () => {
      if (state.running) return;
      state.running = true;
      state.nextTickTime = context.currentTime;
      state.tick = 0;
      loop();
    },
    stop: () => {
      if (state.timerId !== null) {
        clearTimeout(state.timerId);
      }
      state.running = false;
      state.tick = 0;
      state.timerId = null;
    },
    setBPM: (bpm) => {
      state.bpm = bpm;
      state.tickDuration = 60 / (bpm * ticksPerBeat);
    },
    onTick: (callback) => {
      callbacks.push(callback);
    },
    get currentTick() {
      return state.tick;
    },
    get bpm() {
      return state.bpm;
    },
    get isRunning() {
      return state.running;
    },
    dispose: () => {
      clock.stop();
      callbacks.length = 0;
    }
  };
  return clock;
};
const createTransport = (context, props) => {
  const ticksPerBeat = props?.ticksPerBeat;
  const beatsPerBar = props?.timeSignature?.[0] ?? 4;
  const state = {
    transportState: "stopped",
    pos: { bar: 0, beat: 0, tick: 0, time: 0 }
  };
  const tickCallbacks = [];
  const beatCallbacks = [];
  const barCallbacks = [];
  const clock = createClock(context, {
    bpm: props?.bpm ?? 120,
    ticksPerBeat
  });
  clock.onTick((tickTime, _tickNumber) => {
    const prevBeat = state.pos.beat;
    const prevBar = state.pos.bar;
    const rawTick = state.pos.tick + 1;
    const nextTick = rawTick >= ticksPerBeat ? 0 : rawTick;
    const advBeat = rawTick >= ticksPerBeat;
    const rawBeat = advBeat ? state.pos.beat + 1 : state.pos.beat;
    const nextBeat = rawBeat >= beatsPerBar ? 0 : rawBeat;
    const nextBar = advBeat && rawBeat >= beatsPerBar ? state.pos.bar + 1 : state.pos.bar;
    state.pos = { bar: nextBar, beat: nextBeat, tick: nextTick, time: tickTime };
    const snapshot = { ...state.pos };
    for (const cb of tickCallbacks) {
      cb(snapshot);
    }
    if (state.pos.beat !== prevBeat || state.pos.bar !== prevBar) {
      for (const cb of beatCallbacks) {
        cb(snapshot);
      }
    }
    if (state.pos.bar !== prevBar) {
      for (const cb of barCallbacks) {
        cb(snapshot);
      }
    }
  });
  const transport = {
    play: () => {
      if (state.transportState === "playing") return;
      state.transportState = "playing";
      clock.start();
    },
    stop: () => {
      if (state.transportState === "stopped") return;
      state.transportState = "stopped";
      state.pos = { bar: 0, beat: 0, tick: 0, time: 0 };
      clock.stop();
    },
    pause: () => {
      if (state.transportState !== "playing") return;
      state.transportState = "paused";
      clock.stop();
    },
    seek: (bar, beat, tick) => {
      state.pos = { bar, beat: beat ?? 0, tick: tick ?? 0, time: state.pos.time };
    },
    get position() {
      return { ...state.pos };
    },
    get state() {
      return state.transportState;
    },
    get bpm() {
      return clock.bpm;
    },
    setBPM: (bpm) => {
      clock.setBPM(bpm);
    },
    onBeat: (callback) => {
      beatCallbacks.push(callback);
    },
    onBar: (callback) => {
      barCallbacks.push(callback);
    },
    onTick: (callback) => {
      tickCallbacks.push(callback);
    },
    dispose: () => {
      if (state.transportState === "playing") {
        state.transportState = "stopped";
      }
      clock.dispose();
      tickCallbacks.length = 0;
      beatCallbacks.length = 0;
      barCallbacks.length = 0;
    }
  };
  return transport;
};
const createStepSequencer = (transport, props, onStep) => {
  const state = {
    pattern: props.pattern,
    steps: props.steps ?? (Array.isArray(props.pattern) ? props.pattern.length : 16),
    step: 0
  };
  const resolvePattern = (currentStep, bar) => {
    if (Array.isArray(state.pattern)) {
      const index = currentStep % state.pattern.length;
      const value = state.pattern[index];
      return value;
    }
    return state.pattern(currentStep, bar);
  };
  transport.onTick((position) => {
    const currentStepNumber = state.step % state.steps;
    const value = resolvePattern(currentStepNumber, position.bar);
    onStep(value, currentStepNumber, position);
    state.step += 1;
  });
  const sequencer = {
    setPattern: (pattern) => {
      state.pattern = pattern;
      if (Array.isArray(pattern)) {
        state.steps = props.steps ?? pattern.length;
      }
    },
    get currentStep() {
      return state.step;
    },
    dispose: () => {
      state.step = 0;
    }
  };
  return sequencer;
};
const Song = (props) => {
  if (!props.bpm || props.bpm <= 0) {
    throw ScoreError("Song bpm must be a positive number", {
      received: props.bpm,
      fix: "Provide a positive bpm — e.g. Song({ bpm: 140, tracks: [...] })",
      docs: "https://score.dev/docs/dsl/song"
    });
  }
  if (props.tracks.length === 0) {
    throw ScoreError("Song requires at least one track", {
      received: props.tracks,
      fix: "Provide an array of tracks — e.g. Song({ bpm: 140, tracks: [kick] })",
      docs: "https://score.dev/docs/dsl/song"
    });
  }
  return {
    _type: "SongDefinition",
    bpm: props.bpm,
    tracks: props.tracks,
    arrangement: props.arrangement ?? [],
    ...props.key !== void 0 && { key: props.key },
    ...props.genre !== void 0 && { genre: props.genre },
    ...props.backend !== void 0 && { backend: props.backend },
    ...props.xdj !== void 0 && { xdj: props.xdj }
  };
};
const Track = (component, props) => ({
  _type: "TrackComponent",
  component,
  ...props?.volume !== void 0,
  ...props?.pan !== void 0,
  ...props?.mute !== void 0,
  ...props?.solo !== void 0
});
const makeDescriptor = (instrumentType, props) => {
  const desc = {
    _type: "InstrumentDescriptor",
    instrumentType,
    props,
    id: uid(instrumentType),
    type: instrumentType,
    connect: (_dest) => desc,
    disconnect: () => desc,
    dispose: () => {
    }
  };
  return desc;
};
const Kick = (props) => makeDescriptor("kick", props ?? {});
const Synth = (props) => makeDescriptor("synth", props ?? {});
const NOTE_SEMITONES = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};
const noteHz = (name) => {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(name);
  if (!match) {
    throw ScoreError(`Invalid note name: "${name}"`, {
      received: name,
      fix: "Expected format: C4, F#3, Bb2 — letter, optional # or b, octave number.",
      docs: "https://score.dev/docs/dsl#note-hz"
    });
  }
  const letter = match[1];
  const accidental = match[2];
  const octaveStr = match[3];
  const semitone = NOTE_SEMITONES[letter] ?? 0;
  const acc = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  const octave = parseInt(octaveStr, 10);
  const midi = semitone + acc + (octave + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
};
const resolveFreq = (val) => {
  if (typeof val === "string") return noteHz(val);
  return val;
};
const hydrateEffect = (ctx, desc) => {
  const p = desc.props;
  switch (desc.effectType) {
    case "delay":
      return createDelay(ctx, p);
    case "reverb":
      return createReverb(ctx, p);
    case "filter":
      return createFilter(ctx, p);
    case "compressor":
      return createCompressor(ctx, p);
    case "eq":
      return createEQ(ctx, p);
    case "distortion":
      return createDistortion(ctx, p);
    case "limiter":
      return createLimiter(ctx, p);
    case "bitcrusher":
      return createBitCrusher(ctx, p);
    case "chorus":
      return createChorus(ctx, p);
    case "phaser":
      return createPhaser(ctx, p);
    case "flanger":
      return createFlanger(ctx, p);
    case "stereo-widener":
      return createStereoWidener(ctx, p);
    case "gate":
      return createGate(ctx, p);
    default:
      return createEQ(ctx);
  }
};
const buildEffectsChain = (ctx, descriptors) => {
  if (!descriptors || descriptors.length === 0) return [];
  return descriptors.map((d) => hydrateEffect(ctx, d));
};
const isInstrumentDescriptor = (comp) => {
  if (typeof comp !== "object" || comp === null) return false;
  return comp._type === "InstrumentDescriptor";
};
const DEFAULT_KICK_PATTERN = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
const DEFAULT_SNARE_PATTERN = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const DEFAULT_HIHAT_PATTERN = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
const DEFAULT_SYNTH_PATTERN = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0];
const triggerKick = (ctx, time, props, dest) => {
  const freq = props.synth?.frequency ?? 80;
  const drop = props.synth?.pitchDrop ?? 0.1;
  const gain = props.volume ?? 0.85;
  const dur = drop + 0.15;
  const osc = ctx.createOscillator({ type: "sine", frequency: freq });
  const vol = ctx.createGain({ gain: 0 });
  osc.connect(vol);
  vol.connect(dest);
  vol.scheduleEnvelope({ peak: gain, attack: 3e-3, decay: dur - 3e-3, sustain: 0, release: 0, startTime: time, duration: dur });
  osc.start(time);
  osc.setFrequency(30, time + drop);
  osc.stop(time + dur);
};
const triggerSnare = (ctx, time, props, dest) => {
  const gain = props.volume ?? 0.5;
  const body = ctx.createOscillator({ type: "sine", frequency: 185 });
  const bGain = ctx.createGain({ gain: gain * 0.7 });
  body.connect(bGain);
  bGain.connect(dest);
  body.start(time);
  body.setFrequency(100, time + 0.05);
  body.stop(time + 0.08);
  const noise = ctx.createNoise({ type: "white" });
  const filter = ctx.createFilter({ type: "bandpass", frequency: 5e3, Q: 0.8 });
  const nGain = ctx.createGain({ gain: gain * 0.5 });
  noise.connect(filter);
  filter.connect(nGain);
  nGain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.12);
};
const triggerHiHat = (ctx, time, props, dest) => {
  const gain = props.volume ?? 0.25;
  const dur = props.open ? 0.3 : 0.06;
  const noise = ctx.createNoise({ type: "white" });
  const filter = ctx.createFilter({ type: "highpass", frequency: 8e3 });
  const vol = ctx.createGain({ gain });
  noise.connect(filter);
  filter.connect(vol);
  vol.connect(dest);
  noise.start(time);
  noise.stop(time + dur);
};
const triggerSynth = (ctx, time, props, freq, dest) => {
  const env = props.envelope ?? {};
  const attack = env.attack ?? 5e-3;
  const decay = env.decay ?? 0.08;
  const sustain = env.sustain ?? 0.7;
  const release = env.release ?? 0.05;
  const peak = props.gain ?? 0.25;
  const noteDur = attack + decay + release + 0.02;
  const osc = ctx.createOscillator({ type: props.wave ?? "sawtooth", frequency: freq });
  const gain = ctx.createGain({ gain: 0 });
  if (props.filter) {
    const filt = ctx.createFilter({
      type: props.filter.type ?? "lowpass",
      frequency: props.filter.frequency ?? 2e3,
      ...props.filter.Q !== void 0 && { Q: props.filter.Q }
    });
    osc.connect(filt);
    filt.connect(gain);
  } else {
    osc.connect(gain);
  }
  gain.connect(dest);
  gain.scheduleEnvelope({ peak, attack, decay, sustain, release, startTime: time, duration: noteDur });
  osc.start(time);
  osc.stop(time + noteDur);
};
const muteEnvelope = (bar, arrangement, trackId) => {
  if (arrangement.length === 0) return false;
  const totalBars = arrangement.reduce((sum, s) => sum + s.bars, 0);
  const currentBar = bar % totalBars;
  const { sections } = arrangement.reduce(
    ({ sections: sections2, cursor }, section) => {
      const endBar = cursor + section.bars;
      return { sections: [...sections2, { ...section, startBar: cursor, endBar }], cursor: endBar };
    },
    { sections: [], cursor: 0 }
  );
  const active = sections.find((s) => currentBar >= s.startBar && currentBar < s.endBar);
  if (!active) return false;
  const activeIds = new Set(
    active.tracks.map((t) => isInstrumentDescriptor(t) ? t : t.component).filter(isInstrumentDescriptor).map((d) => d.id)
  );
  return !activeIds.has(trackId);
};
const createScoreEngine = async (song) => {
  const ctx = webAudioBackend.createContext();
  const mixer = createMixer(ctx, { masterVolume: 0.85 });
  const transport = createTransport(ctx, { bpm: song.bpm, ticksPerBeat: 4 });
  const descriptors = song.tracks.map((t) => isInstrumentDescriptor(t) ? t : t.component).filter(isInstrumentDescriptor);
  const sampleBuffers = /* @__PURE__ */ new Map();
  await Promise.all(
    descriptors.filter((d) => d.instrumentType === "sample").map(async (d) => {
      const props = d.props;
      const raw = node_fs.readFileSync(props.path);
      const arrayBuffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
      const buf = await decodeSample(ctx, arrayBuffer);
      sampleBuffers.set(d.id, buf);
    })
  );
  const channelInputs = descriptors.map((comp) => {
    const props = comp.props;
    const hydratedEffects = buildEffectsChain(ctx, props.effects);
    const channel = mixer.addChannel({
      name: comp.instrumentType,
      effects: hydratedEffects
    });
    return channel.input;
  });
  descriptors.forEach((comp, i) => {
    const dest = channelInputs[i];
    if (!dest) return;
    switch (comp.instrumentType) {
      case "kick": {
        const props = comp.props;
        const pattern = props.pattern ?? DEFAULT_KICK_PATTERN;
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerKick(ctx, pos.time, props, dest);
        });
        break;
      }
      case "snare": {
        const props = comp.props;
        const pattern = props.pattern ?? DEFAULT_SNARE_PATTERN;
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerSnare(ctx, pos.time, props, dest);
        });
        break;
      }
      case "hihat": {
        const props = comp.props;
        const pattern = props.pattern ?? DEFAULT_HIHAT_PATTERN;
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) triggerHiHat(ctx, pos.time, props, dest);
        });
        break;
      }
      case "synth": {
        const props = comp.props;
        const rawPattern = props.pattern ?? props.sequence ?? DEFAULT_SYNTH_PATTERN;
        const pattern = Array.isArray(rawPattern) ? rawPattern : DEFAULT_SYNTH_PATTERN;
        createStepSequencer(transport, { pattern }, (val, _step, pos) => {
          const freq = resolveFreq(val);
          if (freq > 0) triggerSynth(ctx, pos.time, props, freq, dest);
        });
        break;
      }
      case "sample": {
        const props = comp.props;
        const buf = sampleBuffers.get(comp.id);
        if (!buf) break;
        const player = createSamplePlayer(ctx, buf, {
          loop: props.loop ?? false,
          playbackRate: props.rate ?? 1,
          gain: props.volume ?? 1
        });
        player.connect(dest);
        const pattern = props.pattern ?? [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        createStepSequencer(transport, { pattern }, (hit, _step, pos) => {
          if (hit) player.start(pos.time);
        });
        break;
      }
      case "theremin": {
        const props = comp.props;
        const t = Theremin(ctx, {
          ...props.note !== void 0 && { note: props.note },
          ...props.vibratoRate !== void 0 && { vibratoRate: props.vibratoRate },
          ...props.vibratoDepth !== void 0 && { vibratoDepth: props.vibratoDepth },
          ...props.gain !== void 0 && { gain: props.gain }
        });
        t.connect(dest);
        t.start();
        break;
      }
      case "sax": {
        const props = comp.props;
        const s = Sax(ctx, {
          ...props.note !== void 0 && { note: props.note },
          ...props.gain !== void 0 && { gain: props.gain }
        });
        s.connect(dest);
        s.start();
        const rawPattern = props.pattern ?? ["A4", 0, 0, 0, "A4", 0, 0, 0, "A4", 0, 0, 0, "A4", 0, 0, 0];
        createStepSequencer(transport, { pattern: rawPattern }, (val, _step, pos) => {
          const freq = resolveFreq(val);
          if (freq > 0) {
            s.setFrequency(freq);
            s.trigger(pos.time, props.duration ?? 0.35);
          }
        });
        break;
      }
      case "arp": {
        const props = comp.props;
        const notes = props.notes;
        const mode = props.mode ?? "up";
        const rate = props.rate ?? 1;
        const arpState = { noteIndex: 0, pingDir: 1 };
        const defaultPattern = Array.from({ length: 16 }, () => 1);
        const rawPattern = props.pattern ?? defaultPattern;
        createStepSequencer(transport, { pattern: rawPattern }, (val, _step, pos) => {
          const active = typeof val === "number" ? val : resolveFreq(val);
          if (active <= 0) return;
          const idx = Math.floor(arpState.noteIndex / rate) % notes.length;
          const note = notes[idx] ?? notes[0] ?? "C4";
          const freq = resolveFreq(note);
          if (freq > 0) triggerSynth(ctx, pos.time, {
            wave: props.wave ?? "triangle",
            gain: props.gain ?? 0.3,
            envelope: props.envelope
          }, freq, dest);
          if (mode === "up") {
            arpState.noteIndex += 1;
          } else if (mode === "down") {
            arpState.noteIndex -= 1;
          } else if (mode === "pingpong") {
            arpState.noteIndex += arpState.pingDir;
            const realIdx = Math.floor(arpState.noteIndex / rate) % notes.length;
            if (realIdx >= notes.length - 1 || realIdx <= 0) {
              arpState.pingDir *= -1;
            }
          } else {
            const seed = arpState.noteIndex * 7919 >>> 0;
            arpState.noteIndex = seed % notes.length;
          }
        });
        break;
      }
    }
  });
  if (song.arrangement.length > 0) {
    transport.onBar((position) => {
      descriptors.forEach((desc, i) => {
        const channel = mixer.getChannel(i);
        if (!channel) return;
        channel.setMute(muteEnvelope(position.bar, song.arrangement, desc.id));
      });
    });
  }
  return {
    start: () => {
      transport.play();
    },
    stop: () => {
      transport.stop();
    },
    dispose: () => {
      transport.dispose();
      mixer.dispose();
      ctx.close().catch(() => {
      });
    },
    get bpm() {
      return transport.bpm;
    },
    get bars() {
      return transport.position.bar;
    },
    onBar: (callback) => {
      transport.onBar(callback);
    },
    patch: (props) => {
      if (props.bpm !== void 0) transport.setBPM(props.bpm);
      if (props.masterVolume !== void 0) mixer.setMasterVolume(props.masterVolume);
      if (props.tracks) {
        for (const t of props.tracks) {
          const channel = mixer.getChannel(t.index);
          if (!channel) continue;
          if (t.volume !== void 0) channel.setVolume(t.volume);
          if (t.mute !== void 0) channel.setMute(t.mute);
        }
      }
    },
    update: (nextSong) => {
      if (nextSong.bpm !== transport.bpm) transport.setBPM(nextSong.bpm);
      const nextDescriptors = nextSong.tracks.map((t) => isInstrumentDescriptor(t) ? t : t.component).filter(isInstrumentDescriptor);
      nextDescriptors.forEach((nextDesc, i) => {
        const curDesc = descriptors[i];
        if (!curDesc || curDesc.instrumentType !== nextDesc.instrumentType) {
          return;
        }
        const channel = mixer.getChannel(i);
        if (!channel) return;
        const nextProps = nextDesc.props;
        const curProps = curDesc.props;
        if (nextProps.volume !== curProps.volume && nextProps.volume !== void 0) {
          channel.setVolume(nextProps.volume);
        }
      });
    }
  };
};
const defaultSong = () => Song({
  bpm: 128,
  tracks: [
    Track(Kick({
      pattern: [1, 0, 0, 0, 1, 0, 0, 0],
      volume: 0.9
    })),
    Track(Synth({
      wave: "sawtooth",
      frequency: 65.41,
      pattern: [1, 0, 1, 0, 0, 1, 0, 0],
      filter: { type: "lowpass", frequency: 400 },
      gain: 0.7
    }))
  ]
});
const slotRef = { value: null };
const winRef = { value: null };
const pendingRef = { value: null };
const send = (channel, payload) => {
  const win = winRef.value;
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, payload);
};
const pushState = () => {
  const slot = slotRef.value;
  if (!slot) return;
  send("engine:state", { playing: slot.playing, bpm: slot.bpm, bars: slot.bars });
};
const pushSong = (song) => {
  const tracks = song.tracks.map((t) => {
    const desc = t.component;
    const pattern = desc.props.pattern ?? [];
    return { name: desc.instrumentType, type: desc.instrumentType, pattern };
  });
  send("song:update", { tracks });
};
const teardown = () => {
  const slot = slotRef.value;
  if (!slot) return;
  slotRef.value = null;
  try {
    slot.engine.stop();
  } catch {
  }
  setTimeout(() => {
    try {
      slot.engine.dispose();
    } catch {
    }
  }, 300);
};
const boot = async (song) => {
  teardown();
  const engine = await createScoreEngine(song);
  slotRef.value = { engine, playing: false, bpm: song.bpm, bars: 0 };
  engine.onBar(() => {
    const s = slotRef.value;
    if (!s) return;
    s.bars = engine.bars;
    const pending = pendingRef.value;
    if (pending) {
      pendingRef.value = null;
      const wasPlaying = s.playing;
      void boot(pending).then(() => {
        if (wasPlaying) {
          const next = slotRef.value;
          if (next && !next.playing) {
            next.engine.start();
            next.playing = true;
            pushState();
          }
        }
      });
      return;
    }
    pushState();
  });
  pushState();
  pushSong(song);
};
const createWindow = () => {
  const win = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0c0c0e",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    void win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    void win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    void electron.shell.openExternal(url);
    return { action: "deny" };
  });
  return win;
};
electron.app.on("ready", () => {
  winRef.value = createWindow();
  electron.globalShortcut.register("F12", () => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (win) win.webContents.toggleDevTools();
  });
});
electron.app.on("window-all-closed", () => {
  teardown();
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    winRef.value = createWindow();
  }
});
electron.ipcMain.on("mode:selected", (_event, payload) => {
  console.log("[score-studio] mode selected", payload);
  void boot(defaultSong());
});
electron.ipcMain.on("transport:play", () => {
  const slot = slotRef.value;
  if (!slot || slot.playing) return;
  slot.engine.start();
  slot.playing = true;
  pushState();
});
electron.ipcMain.on("transport:stop", () => {
  const slot = slotRef.value;
  if (!slot || !slot.playing) return;
  slot.engine.stop();
  slot.playing = false;
  slot.bars = 0;
  pushState();
});
electron.ipcMain.on("transport:bpm-set", (_event, { bpm }) => {
  const slot = slotRef.value;
  if (!slot) return;
  slot.engine.patch({ bpm });
  slot.bpm = bpm;
  pushState();
});
electron.ipcMain.on("engine:eval", (_event, { code }) => {
  const evalDir = path.join(__dirname, "..", "..", "tmp");
  node_fs.mkdirSync(evalDir, { recursive: true });
  const tmp = path.join(evalDir, `score-eval-${String(Date.now())}.mjs`);
  try {
    node_fs.writeFileSync(tmp, code, "utf8");
  } catch (err) {
    console.error("[score-studio] eval write error", err);
    send("error:report", { message: "Failed to write eval temp file." });
    return;
  }
  void import(node_url.pathToFileURL(tmp).href).then((mod) => {
    try {
      node_fs.unlinkSync(tmp);
    } catch {
    }
    const song = mod.default;
    if (!song || typeof song !== "object") return;
    const slot = slotRef.value;
    if (slot?.playing) {
      pendingRef.value = song;
      pushSong(song);
    } else {
      void boot(song);
    }
  }).catch((err) => {
    try {
      node_fs.unlinkSync(tmp);
    } catch {
    }
    console.error("[score-studio] eval error", err);
    send("error:report", {
      message: err instanceof Error ? err.message : String(err)
    });
  });
});
