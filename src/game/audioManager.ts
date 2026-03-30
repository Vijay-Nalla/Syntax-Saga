// ============= Audio Manager =============
// Manages background music and sound effects using Web Audio API oscillators
// No external audio files needed — generates retro chiptune sounds programmatically

const STORAGE_KEY = 'syntax-saga-audio-settings';

interface AudioSettings {
  volume: number; // 0–1
  muted: boolean;
}

function loadSettings(): AudioSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (_e) { return { volume: 0.5, muted: false }; }
  return { volume: 0.5, muted: false };
}

function saveSettings(settings: AudioSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private settings: AudioSettings;
  private bgmOsc: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmPlaying = false;

  constructor() {
    this.settings = loadSettings();
  }

  // --- Mobile compatibility: Resume AudioContext on user interaction ---
  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        console.log('AudioContext resumed successfully');
      }).catch(err => {
        console.error('Failed to resume AudioContext:', err);
      });
    } else if (!this.ctx) {
      this.ensureContext();
    }
  }

  private ensureContext() {
    if (!this.ctx) {
      // Create context using a cross-browser approach
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx!.createGain();
        this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.volume;
        this.masterGain.connect(this.ctx!.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'square', vol = 0.3) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playSequence(notes: [number, number][], type: OscillatorType = 'square', vol = 0.25) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    let t = this.ctx.currentTime;
    for (const [freq, dur] of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + dur);
      t += dur * 0.8;
    }
  }

  // --- Sound Effects ---
  jump() { this.playTone(400, 0.12, 'square', 0.2); setTimeout(() => this.playTone(600, 0.1, 'square', 0.15), 50); }
  doubleJump() { this.playSequence([[500, 0.08], [700, 0.08], [900, 0.12]], 'square', 0.2); }
  coinCollect() { this.playSequence([[988, 0.08], [1319, 0.15]], 'square', 0.25); }
  correctAnswer() { this.playSequence([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.2]], 'square', 0.2); }
  wrongAnswer() { this.playSequence([[200, 0.15], [150, 0.2]], 'sawtooth', 0.3); }
  enemyDamage() { this.playTone(120, 0.2, 'sawtooth', 0.35); }
  enemyStomp() { this.playSequence([[300, 0.05], [500, 0.08]], 'square', 0.2); }
  pipeTransition() { this.playSequence([[400, 0.1], [350, 0.1], [300, 0.1], [250, 0.15]], 'sine', 0.3); }
  levelComplete() { this.playSequence([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.12], [1319, 0.25]], 'square', 0.25); }
  gameOver() { this.playSequence([[400, 0.2], [350, 0.2], [300, 0.25], [200, 0.4]], 'sawtooth', 0.3); }
  bossStart() { this.playSequence([[200, 0.15], [250, 0.15], [200, 0.15], [300, 0.25]], 'sawtooth', 0.35); }

  // --- Background Music (simple looping arpeggio) ---
  startBGM() {
    if (this.bgmPlaying) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    this.bgmPlaying = true;
    this.loopBGM();
  }

  private loopBGM() {
    if (!this.bgmPlaying || !this.ctx || !this.masterGain) return;
    const notes: [number, number][] = [
      [130, 0.25], [165, 0.25], [196, 0.25], [262, 0.25],
      [196, 0.25], [165, 0.25], [130, 0.25], [98, 0.25],
    ];
    let t = this.ctx.currentTime;
    for (const [freq, dur] of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }
    // Schedule next loop
    const loopDuration = notes.reduce((s, [, d]) => s + d, 0) * 1000;
    setTimeout(() => this.loopBGM(), loopDuration - 50);
  }

  stopBGM() {
    this.bgmPlaying = false;
  }

  // --- Settings ---
  setVolume(v: number) {
    this.settings.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.volume;
    saveSettings(this.settings);
  }

  toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    if (this.masterGain) this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.volume;
    saveSettings(this.settings);
    return this.settings.muted;
  }

  getSettings(): AudioSettings { return { ...this.settings }; }
}

// Singleton
export const audioManager = new AudioManager();
