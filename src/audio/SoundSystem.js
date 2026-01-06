// The Sentinel - Sound System
// Authentic 8-bit style sounds using Web Audio API

export class SoundSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.initialized = false;
    this.muted = false;
  }

  // Must be called after user interaction (browser requirement)
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3;  // Master volume
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  // Resume audio context if suspended
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.3;
    }
    return this.muted;
  }

  // Create an oscillator with envelope
  createTone(frequency, duration, type = 'square', startTime = 0) {
    if (!this.initialized || this.muted) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime + startTime;

    // Simple envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain.gain.linearRampToValueAtTime(0.3, now + duration * 0.3);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Create noise burst
  createNoise(duration, startTime = 0) {
    if (!this.initialized || this.muted) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    const gain = this.audioContext.createGain();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime + startTime;

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    noise.start(now);
    noise.stop(now + duration);
  }

  // === GAME SOUNDS ===

  // Transfer/Teleport - 5-note synth jingle "Whaaanggg"
  playTransfer() {
    if (!this.initialized) return;

    const notes = [220, 330, 440, 550, 660];  // Rising arpeggio
    notes.forEach((freq, i) => {
      this.createTone(freq, 0.15, 'sawtooth', i * 0.08);
    });
  }

  // Absorption - white noise swoosh
  playAbsorb() {
    if (!this.initialized) return;
    this.createNoise(0.4);
  }

  // Hyperspace - distinct 4-second jingle
  playHyperspace() {
    if (!this.initialized) return;

    // Descending then ascending pattern
    const notes = [880, 660, 440, 330, 220, 330, 440, 660, 880];
    notes.forEach((freq, i) => {
      this.createTone(freq, 0.35, 'triangle', i * 0.4);
    });
  }

  // U-Turn - short jingle
  playUTurn() {
    if (!this.initialized) return;

    this.createTone(440, 0.1, 'square', 0);
    this.createTone(330, 0.1, 'square', 0.1);
    this.createTone(440, 0.1, 'square', 0.2);
  }

  // Create object (tree/boulder/robot)
  playCreate() {
    if (!this.initialized) return;

    this.createTone(220, 0.08, 'square', 0);
    this.createTone(440, 0.08, 'square', 0.08);
    this.createTone(660, 0.15, 'square', 0.16);
  }

  // Error beep - invalid action
  playError() {
    if (!this.initialized) return;

    this.createTone(150, 0.2, 'square', 0);
  }

  // Sentinel/Sentry rotation - low-pitched creaky bleep
  playSentinelRotate() {
    if (!this.initialized) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.audioContext.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.15);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  // Detection warning - humming sound
  playDetectionHum() {
    if (!this.initialized || this.muted) return null;

    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = 100;

      // Add slight vibrato
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 8;
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(gain);
      gain.connect(this.masterGain);

      gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);

      lfo.start();
      osc.start();

      let stopped = false;

      // Return stop function for continuous hum
      return () => {
        if (stopped) return;
        stopped = true;
        try {
          gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
          setTimeout(() => {
            try {
              osc.stop();
              lfo.stop();
            } catch (e) {
              // Ignore - oscillators might already be stopped
            }
          }, 150);
        } catch (e) {
          // Ignore audio errors
        }
      };
    } catch (e) {
      console.warn('Error creating detection hum:', e);
      return null;
    }
  }

  // Meanie creation - hectic scratching
  playMeanieCreate() {
    if (!this.initialized) return;

    for (let i = 0; i < 8; i++) {
      this.createNoise(0.05, i * 0.06);
      this.createTone(200 + Math.random() * 300, 0.04, 'sawtooth', i * 0.06);
    }
  }

  // Meanie rotation - low clicking
  playMeanieClick() {
    if (!this.initialized) return;

    this.createTone(100, 0.03, 'square', 0);
  }

  // Game Over - short alien melody
  playGameOver() {
    if (!this.initialized) return;

    const notes = [440, 415, 392, 349, 330, 294, 262, 196];
    notes.forEach((freq, i) => {
      this.createTone(freq, 0.3, 'triangle', i * 0.25);
    });
  }

  // Level Complete jingle
  playLevelComplete() {
    if (!this.initialized) return;

    const notes = [262, 330, 392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.createTone(freq, 0.2, 'triangle', i * 0.15);
    });
  }

  // Title screen music - simple melodic loop
  playTitleMusic() {
    if (!this.initialized) return;

    const melody = [
      { note: 262, dur: 0.4 },  // C
      { note: 294, dur: 0.4 },  // D
      { note: 330, dur: 0.4 },  // E
      { note: 392, dur: 0.6 },  // G
      { note: 330, dur: 0.4 },  // E
      { note: 294, dur: 0.4 },  // D
      { note: 262, dur: 0.8 },  // C
    ];

    let time = 0;
    melody.forEach(({ note, dur }) => {
      this.createTone(note, dur * 0.9, 'triangle', time);
      time += dur;
    });

    return time * 1000;  // Return duration in ms
  }

  // Menu/UI selection beep
  playMenuSelect() {
    if (!this.initialized) return;
    this.createTone(880, 0.05, 'square', 0);
  }

  // Code entry beep
  playCodeEntry() {
    if (!this.initialized) return;
    this.createTone(660, 0.08, 'square', 0);
  }

  // Code accepted jingle
  playCodeAccepted() {
    if (!this.initialized) return;

    this.createTone(440, 0.1, 'square', 0);
    this.createTone(550, 0.1, 'square', 0.1);
    this.createTone(660, 0.1, 'square', 0.2);
    this.createTone(880, 0.2, 'square', 0.3);
  }

  // Code rejected
  playCodeRejected() {
    if (!this.initialized) return;

    this.createTone(200, 0.15, 'square', 0);
    this.createTone(150, 0.3, 'square', 0.15);
  }
}

// Singleton instance
export const soundSystem = new SoundSystem();
