import { GAME_CONFIG } from "../config/gameConfig";

export class GameAudioSystem {
  private context?: AudioContext;
  private ambient?: GainNode;
  private ambientSources: AudioScheduledSourceNode[] = [];
  private ambientTimer?: number;
  private ambientRequested = false;
  private melodyIndex = 0;

  startAmbient() {
    this.ambientRequested = true;
    const context = this.getContext();
    if (!context || this.ambient) return;
    void context.resume().then(() => {
      if (this.ambientRequested && !this.ambient) this.createAmbient(context);
    });
  }

  unlock() {
    const context = this.getContext();
    if (!context) return;
    void context.resume().then(() => {
      if (this.ambientRequested && !this.ambient) this.createAmbient(context);
    });
  }

  private createAmbient(context: AudioContext) {
    const config = GAME_CONFIG.audio.ambient;
    const master = context.createGain();
    master.gain.value = config.volume;
    master.connect(context.destination);
    this.ambient = master;

    // An audible diminished chord creates a quiet, unsettling musical bed.
    [config.rootFrequency, config.rootFrequency * 1.1892, config.rootFrequency * 1.4983].forEach(
      (frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = index === 0 ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        const voice = context.createGain();
        voice.gain.value = index === 0 ? 0.55 : 0.27;
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420 + index * 120;
        oscillator.connect(filter).connect(voice).connect(master);
        oscillator.start();
        this.ambientSources.push(oscillator);
      },
    );

    const pulse = context.createOscillator();
    pulse.frequency.value = config.pulseSpeed;
    const pulseDepth = context.createGain();
    pulseDepth.gain.value = config.volume * 0.32;
    pulse.connect(pulseDepth).connect(master.gain);
    pulse.start();
    this.ambientSources.push(pulse);

    this.playAmbientNote();
    this.ambientTimer = window.setInterval(
      () => this.playAmbientNote(),
      config.melodyIntervalMs,
    );
  }

  stopAmbient() {
    this.ambientRequested = false;
    if (this.ambientTimer !== undefined) window.clearInterval(this.ambientTimer);
    this.ambientTimer = undefined;
    this.ambientSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // The source may already have ended.
      }
    });
    this.ambientSources = [];
    this.ambient?.disconnect();
    this.ambient = undefined;
  }

  private playAmbientNote() {
    const context = this.context;
    const destination = this.ambient;
    if (!context || !destination) return;
    const config = GAME_CONFIG.audio.ambient;
    const notes = [293.66, 311.13, 261.63, 220, 233.08];
    const start = context.currentTime;
    const end = start + config.melodyNoteSeconds;
    const note = context.createOscillator();
    note.type = "sine";
    note.frequency.value = notes[this.melodyIndex % notes.length]!;
    this.melodyIndex += 1;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(0.17, start + 0.8);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 720;
    note.connect(filter).connect(envelope).connect(destination);
    note.start(start);
    note.stop(end);
  }

  playBowShot() {
    const context = this.getContext();
    if (!context) return;
    void context.resume();
    const start = context.currentTime;
    const config = GAME_CONFIG.audio.bowShot;
    const gain = context.createGain();
    gain.gain.setValueAtTime(config.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + config.durationSeconds);
    gain.connect(context.destination);

    const string = context.createOscillator();
    string.type = "triangle";
    string.frequency.setValueAtTime(185, start);
    string.frequency.exponentialRampToValueAtTime(55, start + config.durationSeconds);
    string.connect(gain);
    string.start(start);
    string.stop(start + config.durationSeconds);

    const noise = this.createNoise(config.durationSeconds);
    if (noise) {
      const filter = context.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1400;
      noise.connect(filter).connect(gain);
      noise.start(start);
      noise.stop(start + config.durationSeconds);
    }
  }

  playEvilLaugh() {
    const context = this.getContext();
    if (!context) return;
    void context.resume();
    const config = GAME_CONFIG.audio.evilLaugh;
    const start = context.currentTime;
    const master = context.createGain();
    master.gain.value = config.volume;
    master.connect(context.destination);

    // Four falling, breathy syllables form a short demonic laugh.
    [0, 0.16, 0.31, 0.46].forEach((offset, index) => {
      const syllableStart = start + offset;
      const syllableEnd = syllableStart + 0.19;
      const voice = context.createOscillator();
      voice.type = "sawtooth";
      voice.frequency.setValueAtTime(245 - index * 17, syllableStart);
      voice.frequency.exponentialRampToValueAtTime(105 - index * 5, syllableEnd);
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0.0001, syllableStart);
      envelope.gain.exponentialRampToValueAtTime(0.72, syllableStart + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001, syllableEnd);
      const distortion = context.createWaveShaper();
      distortion.curve = this.distortionCurve(42);
      distortion.oversample = "2x";
      voice.connect(distortion).connect(envelope).connect(master);
      voice.start(syllableStart);
      voice.stop(syllableEnd);
    });

    const breath = this.createNoise(config.durationSeconds);
    if (breath) {
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 620;
      filter.Q.value = 0.8;
      const breathGain = context.createGain();
      breathGain.gain.setValueAtTime(0.3, start);
      breathGain.gain.exponentialRampToValueAtTime(0.0001, start + config.durationSeconds);
      breath.connect(filter).connect(breathGain).connect(master);
      breath.start(start);
      breath.stop(start + config.durationSeconds);
    }
  }

  private getContext() {
    try {
      this.context ??= new AudioContext();
      return this.context;
    } catch {
      return undefined;
    }
  }

  private createNoise(duration: number) {
    const context = this.context;
    if (!context) return undefined;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1)
      samples[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  private distortionCurve(amount: number) {
    const curve = new Float32Array(256);
    for (let index = 0; index < curve.length; index += 1) {
      const value = (index * 2) / curve.length - 1;
      curve[index] = ((3 + amount) * value * 20 * (Math.PI / 180)) /
        (Math.PI + amount * Math.abs(value));
    }
    return curve;
  }
}
