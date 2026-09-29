// Lightweight Web Audio API Synthesizer for quiet ambient luxury atmospheres
// Zero external sound files, 100% reliable, runs entirely in-browser.

class SanctuaryAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentMode: 'ocean' | 'rainforest' | 'breeze' = 'ocean';
  private timer: number | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // Whisper quiet
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(mode: 'ocean' | 'rainforest' | 'breeze' = 'ocean') {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      this.stop();

      this.currentMode = mode;
      this.isPlaying = true;

      // Create pink noise buffer for realistic nature swell
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter based on mood
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';

      if (mode === 'ocean') {
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        // Create wave swell LFO
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second wave period
        lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      } else if (mode === 'rainforest') {
        filter.frequency.setValueAtTime(550, this.ctx.currentTime);
      } else {
        filter.frequency.setValueAtTime(260, this.ctx.currentTime);
      }

      whiteNoise.connect(filter);
      filter.connect(this.masterGain);
      whiteNoise.start();
    } catch {
      // Audio autoplay gracefully handled
    }
  }

  public stop() {
    if (this.ctx && this.isPlaying) {
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      }
      setTimeout(() => {
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        }
      }, 300);
      this.isPlaying = false;
    }
  }

  public toggle(mode: 'ocean' | 'rainforest' | 'breeze' = 'ocean'): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play(mode);
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const sanctuaryAudio = new SanctuaryAudio();
