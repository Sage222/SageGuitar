import { DetectedPitch } from '../types/guitar';
import { frequencyToNote, getFretFrequency } from './guitarConstants';

export const ROOT_FREQUENCIES: Record<string, number> = {
  'E': 82.41,
  'F': 87.31,
  'F#': 92.50,
  'G': 98.00,
  'G#': 103.83,
  'A': 110.00,
  'A#': 116.54,
  'B': 123.47,
  'C': 130.81,
  'C#': 138.59,
  'D': 146.83,
  'D#': 155.56,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private isListening = false;
  private noiseThreshold = 0.015; // Noise gate RMS
  private micListeners: Array<(pitch: DetectedPitch | null, rms: number) => void> = [];
  private animFrameId: number | null = null;

  // Master output gain
  private masterGain: GainNode | null = null;
  private backingGain: GainNode | null = null;

  public getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (!this.backingGain && this.ctx && this.masterGain) {
      this.backingGain = this.ctx.createGain();
      this.backingGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.backingGain.connect(this.masterGain);
    }
    return this.ctx;
  }

  public setNoiseThreshold(val: number) {
    this.noiseThreshold = Math.max(0.002, Math.min(0.08, val));
  }

  public getNoiseThreshold(): number {
    return this.noiseThreshold;
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (this.isListening && this.analyser) {
        return true;
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.micSource = ctx.createMediaStreamSource(this.micStream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 4096; // 4096 gives fine low frequency resolution down to 80Hz
      this.analyser.smoothingTimeConstant = 0.1;

      this.micSource.connect(this.analyser);
      this.buffer = new Float32Array(this.analyser.fftSize);
      this.isListening = true;

      this.runDetectionLoop();
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      this.isListening = false;
      return false;
    }
  }

  public stopMicrophone() {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {
        // ignore
      }
      this.micSource = null;
    }
    this.analyser = null;
  }

  public subscribePitch(listener: (pitch: DetectedPitch | null, rms: number) => void): () => void {
    this.micListeners.push(listener);
    return () => {
      this.micListeners = this.micListeners.filter((l) => l !== listener);
    };
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  private runDetectionLoop = () => {
    if (!this.isListening || !this.analyser || !this.buffer || !this.ctx) {
      return;
    }

    this.analyser.getFloatTimeDomainData(this.buffer);

    // 1. Calculate RMS energy
    let sumSquares = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.buffer.length);

    let detected: DetectedPitch | null = null;

    if (rms > this.noiseThreshold) {
      const pitchFreq = this.detectPitchYIN(this.buffer, this.ctx.sampleRate);
      if (pitchFreq && pitchFreq >= 70 && pitchFreq <= 1200) {
        const noteInfo = frequencyToNote(pitchFreq);
        if (noteInfo) {
          detected = {
            freq: Math.round(pitchFreq * 10) / 10,
            noteName: noteInfo.noteName,
            octave: noteInfo.octave,
            cents: noteInfo.cents,
            midi: noteInfo.midi,
            confidence: Math.min(1, rms * 15),
            rms,
          };
        }
      }
    }

    // Broadcast to subscribers
    for (let i = 0; i < this.micListeners.length; i++) {
      this.micListeners[i](detected, rms);
    }

    this.animFrameId = requestAnimationFrame(this.runDetectionLoop);
  };

  /**
   * YIN-style / Normalized Autocorrelation pitch detector
   */
  private detectPitchYIN(buf: Float32Array, sampleRate: number): number | null {
    const minFreq = 70;
    const maxFreq = 1200;
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    const length = buf.length;
    const halfLength = Math.floor(length / 2);
    if (maxPeriod >= halfLength) return null;

    const diff = new Float32Array(maxPeriod + 1);
    for (let tau = 1; tau <= maxPeriod; tau++) {
      let sum = 0;
      for (let i = 0; i < halfLength; i++) {
        const delta = buf[i] - buf[i + tau];
        sum += delta * delta;
      }
      diff[tau] = sum;
    }

    const cmndf = new Float32Array(maxPeriod + 1);
    cmndf[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau <= maxPeriod; tau++) {
      runningSum += diff[tau];
      cmndf[tau] = runningSum > 0 ? (diff[tau] * tau) / runningSum : 1;
    }

    const threshold = 0.15;
    let tauEstimate = -1;

    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      if (cmndf[tau] < threshold) {
        while (tau + 1 <= maxPeriod && cmndf[tau + 1] < cmndf[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    if (tauEstimate === -1) {
      let minVal = 1;
      let minTau = -1;
      for (let tau = minPeriod; tau <= maxPeriod; tau++) {
        if (cmndf[tau] < minVal) {
          minVal = cmndf[tau];
          minTau = tau;
        }
      }
      if (minVal < 0.35 && minTau !== -1) {
        tauEstimate = minTau;
      } else {
        return null;
      }
    }

    let betterTau = tauEstimate;
    if (tauEstimate > 1 && tauEstimate < maxPeriod) {
      const s0 = cmndf[tauEstimate - 1];
      const s1 = cmndf[tauEstimate];
      const s2 = cmndf[tauEstimate + 1];
      const delta = (s2 - s0) / (2 * (2 * s1 - s2 - s0) || 1);
      betterTau = tauEstimate + delta;
    }

    return sampleRate / betterTau;
  }

  /**
   * Synthesize acoustic guitar pluck
   */
  public playGuitarPluck(frequency: number, duration = 1.8, gainLevel = 0.45) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const pluckGain = ctx.createGain();
      pluckGain.gain.setValueAtTime(gainLevel, now);
      pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(frequency * 6, 8000), now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(frequency * 1.5, 300), now + duration * 0.5);

      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(frequency, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(frequency * 2, now);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.35, now);
      osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.4);

      const pickBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.035), ctx.sampleRate);
      const data = pickBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
      }
      const pickSource = ctx.createBufferSource();
      pickSource.buffer = pickBuffer;
      const pickFilter = ctx.createBiquadFilter();
      pickFilter.type = 'bandpass';
      pickFilter.frequency.setValueAtTime(3200, now);
      pickFilter.Q.setValueAtTime(2, now);

      const pickGain = ctx.createGain();
      pickGain.gain.setValueAtTime(0.4, now);

      pickSource.connect(pickFilter);
      pickFilter.connect(pickGain);
      pickGain.connect(filter);

      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);

      filter.connect(pluckGain);
      pluckGain.connect(this.masterGain || ctx.destination);

      osc1.start(now);
      osc2.start(now);
      pickSource.start(now);

      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {
      // AudioContext policy handled gracefully
    }
  }

  public playGuitarFret(stringIndex: number, fret: number, duration = 1.5) {
    const freq = getFretFrequency(stringIndex, fret);
    this.playGuitarPluck(freq, duration, 0.4);
  }

  public playGuitarChord(frets: number[], direction: 'down' | 'up' = 'down', duration = 2.2) {
    try {
      const stringsToPlay: { stringIndex: number; fret: number }[] = [];
      for (let s = 0; s < 6; s++) {
        const fret = frets[s];
        if (fret !== undefined && fret >= 0) {
          stringsToPlay.push({ stringIndex: s, fret });
        }
      }

      if (direction === 'down') {
        stringsToPlay.sort((a, b) => b.stringIndex - a.stringIndex);
      } else {
        stringsToPlay.sort((a, b) => a.stringIndex - b.stringIndex);
      }

      const stringDelay = 0.024;
      stringsToPlay.forEach((item, idx) => {
        setTimeout(() => {
          this.playGuitarFret(item.stringIndex, item.fret, duration - idx * 0.05);
        }, idx * stringDelay * 1000);
      });
    } catch {
      // graceful fallback
    }
  }

  public playMetronomeClick(isAccent = false) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1200 : 800, now);

      gain.gain.setValueAtTime(isAccent ? 0.35 : 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignored
    }
  }

  /**
   * Rich Full Band Accompaniment Engine
   * Plays synchronized drums, root bassline, and rhythm harmonic backing
   */
  public playFullBandBeat(params: {
    beatInBar: number;
    rootNote?: string;
    chordFrets?: number[];
    genre?: string;
    isBarStart?: boolean;
  }) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const dest = this.backingGain || this.masterGain || ctx.destination;
      const { beatInBar, rootNote = 'E', chordFrets, isBarStart } = params;

      // 1. DRUMS
      if (beatInBar === 0) {
        // Kick on beat 1
        this.playSynthesizedKick(dest, now, 0.45);
        if (isBarStart) {
          this.playCrashCymbal(dest, now, 0.15);
        }
      } else if (beatInBar === 2) {
        // Snare on beat 3
        this.playSynthesizedSnare(dest, now, 0.38);
      } else {
        // Hi-hat on beats 2 and 4
        this.playSynthesizedHiHat(dest, now, 0.14);
      }

      // 2. ROOT BASSLINE (tracks the active song chord root note)
      const rootClean = rootNote.replace(/m|maj|7|sus4|dim|add9/g, '').trim();
      const bassFreq = ROOT_FREQUENCIES[rootClean] || 82.41;

      if (beatInBar === 0 || beatInBar === 2) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        const bassFilter = ctx.createBiquadFilter();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(320, now);
        bassFilter.frequency.exponentialRampToValueAtTime(140, now + 0.3);

        bassGain.gain.setValueAtTime(0.24, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(dest);

        bassOsc.start(now);
        bassOsc.stop(now + 0.4);
      }

      // 3. RHYTHM GUITAR HARMONY (Soft acoustic / crunch strum on beat 1 and 3)
      if (chordFrets && (beatInBar === 0 || beatInBar === 2)) {
        setTimeout(() => {
          this.playGuitarChord(chordFrets, beatInBar === 0 ? 'down' : 'up', 1.4);
        }, 15);
      }
    } catch {
      // ignored
    }
  }

  private playSynthesizedKick(dest: AudioNode, now: number, gainVal = 0.4) {
    const ctx = this.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  private playSynthesizedSnare(dest: AudioNode, now: number, gainVal = 0.35) {
    const ctx = this.getAudioContext();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    // Body tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.connect(oscGain);
    oscGain.connect(dest);

    src.start(now);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  private playSynthesizedHiHat(dest: AudioNode, now: number, gainVal = 0.12) {
    const ctx = this.getAudioContext();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(now);
  }

  private playCrashCymbal(dest: AudioNode, now: number, gainVal = 0.15) {
    const ctx = this.getAudioContext();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.4));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(now);
  }

  /**
   * Sound effect for note hit in game
   */
  public playHitSound(rating: 'perfect' | 'great') {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(rating === 'perfect' ? 880 : 660, now);
      osc.frequency.exponentialRampToValueAtTime(rating === 'perfect' ? 1174 : 880, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // ignored
    }
  }
}

export const audioEngine = new AudioEngine();
