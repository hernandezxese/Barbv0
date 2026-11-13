/**
 * Retro Chiptune & Synthesizer Audio Engine for Bárbara: Crónicas Elementales del Sur
 * Inspired by GameBoy Advance Pokémon FireRed and SNES Final Fantasy III soundfonts
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.4;
  private currentTrack: string | null = null;
  private bgmInterval: any = null;
  private initialized: boolean = false;
  private unlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlockMobileAudio();
      };
      window.addEventListener('touchstart', unlockHandler, { passive: true });
      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('click', unlockHandler, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      });
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted')) {
      this.ctx.resume().catch(() => {});
    }
  }

  public unlockMobileAudio() {
    this.initContext();
    if (!this.ctx || this.unlocked) return;
    try {
      // Play a 1-sample silent buffer inside a direct touch/click gesture to unlock iOS Safari & Android Chrome audio
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.unlocked = true;
      this.initialized = true;
    } catch {
      // Safe fallback
    }
  }

  public init() {
    this.unlockMobileAudio();
    this.initialized = true;
  }

  public toggleMute(): boolean {
    this.unlockMobileAudio();
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    } else if (!this.isMuted && this.currentTrack) {
      this.playBgm(this.currentTrack, true);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  // Play a single procedural retro tone
  private playTone(freq: number, type: OscillatorType, duration: number, delay = 0, gainLevel = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

      const startTime = this.ctx.currentTime + delay;
      const peakGain = Math.max(0.001, this.volume * gainLevel * 0.16);
      gain.gain.setValueAtTime(peakGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // Audio safety fallback
    }
  }

  // Noise generator for hits, rustling, and volcanic sounds
  private playNoise(duration: number, delay = 0, filterFreq = 1000) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime + delay);

      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + delay;
      gain.gain.setValueAtTime(Math.max(0.001, this.volume * 0.2), startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(startTime);
    } catch {
      // Audio safety fallback
    }
  }

  // --- Sound Effects (SFX) ---

  public playSelect() {
    this.playTone(523.25, 'triangle', 0.06); // C5
    this.playTone(659.25, 'triangle', 0.08, 0.05); // E5
  }

  public playConfirm() {
    this.playTone(440, 'square', 0.08); // A4
    this.playTone(880, 'square', 0.12, 0.06); // A5
  }

  public playCancel() {
    this.playTone(400, 'sawtooth', 0.08);
    this.playTone(280, 'sawtooth', 0.1, 0.06);
  }

  public playStep() {
    this.playTone(120, 'triangle', 0.04, 0, 0.3);
  }

  public playEncounter() {
    // Classic Pokémon battle encounter sting
    for (let i = 0; i < 5; i++) {
      this.playTone(300 + i * 150, 'sawtooth', 0.06, i * 0.05, 0.9);
      this.playTone(600 - i * 80, 'square', 0.06, i * 0.05, 0.7);
    }
  }

  public playAttackSlash() {
    this.playNoise(0.12, 0, 3000);
    this.playTone(800, 'sawtooth', 0.08, 0, 0.6);
    this.playTone(400, 'sawtooth', 0.08, 0.04, 0.4);
  }

  public playFireSpell() {
    this.playNoise(0.25, 0, 900);
    this.playTone(240, 'sawtooth', 0.2, 0.02, 0.8);
    this.playTone(320, 'sawtooth', 0.25, 0.08, 0.9);
  }

  public playWaterSpell() {
    this.playTone(350, 'sine', 0.12, 0, 0.7);
    this.playTone(520, 'sine', 0.14, 0.06, 0.8);
    this.playTone(700, 'sine', 0.18, 0.12, 0.9);
  }

  public playEarthSpell() {
    this.playNoise(0.3, 0, 450);
    this.playTone(90, 'triangle', 0.25, 0, 1.2);
    this.playTone(130, 'triangle', 0.2, 0.08, 1.0);
  }

  public playWindSpell() {
    this.playNoise(0.2, 0, 2400);
    this.playTone(600, 'sine', 0.15, 0, 0.6);
    this.playTone(950, 'sine', 0.2, 0.06, 0.7);
  }

  public playHeal() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((f, idx) => {
      this.playTone(f, 'sine', 0.2, idx * 0.08, 0.8);
    });
  }

  public playHit() {
    this.playNoise(0.1, 0, 800);
    this.playTone(180, 'square', 0.08, 0, 0.9);
  }

  public playCriticalHit() {
    this.playNoise(0.18, 0, 1800);
    this.playTone(260, 'sawtooth', 0.12, 0, 1.2);
    this.playTone(130, 'square', 0.18, 0.06, 1.2);
  }

  public playCaptureSuccess() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      this.playTone(f, 'triangle', 0.25, idx * 0.12, 1);
    });
  }

  public playLevelUp() {
    const fanfare = [
      { f: 523.25, d: 0.1 },
      { f: 659.25, d: 0.1 },
      { f: 783.99, d: 0.1 },
      { f: 1046.5, d: 0.3 }
    ];
    fanfare.forEach((n, idx) => {
      this.playTone(n.f, 'square', n.d, idx * 0.12, 0.9);
    });
  }

  public playEvolutionSequence() {
    // Ethereal rising chime arpeggio
    const arp = [392, 493.88, 587.33, 739.99, 880, 987.77, 1174.66, 1479.98];
    arp.forEach((f, idx) => {
      this.playTone(f, 'triangle', 0.2, idx * 0.07, 0.9);
      this.playTone(f * 1.5, 'sine', 0.25, idx * 0.07 + 0.02, 0.5);
    });
  }

  public playChestOpen() {
    this.playTone(392, 'square', 0.1, 0, 0.7);
    this.playTone(523.25, 'square', 0.1, 0.09, 0.8);
    this.playTone(659.25, 'triangle', 0.2, 0.18, 0.9);
  }

  // --- Animal & Wildlife Sound Effects ---

  public playDogBark() {
    // Playful double-bark
    this.playTone(380, 'sawtooth', 0.08, 0, 0.9);
    this.playTone(280, 'sawtooth', 0.12, 0.04, 0.7);
    this.playTone(420, 'sawtooth', 0.08, 0.16, 0.9);
    this.playTone(300, 'sawtooth', 0.14, 0.20, 0.7);
  }

  public playBirdChirp() {
    // High-pitched sweet chirping trill (Chucao / Picaflor / Loica)
    this.playTone(1480, 'sine', 0.06, 0, 0.8);
    this.playTone(1850, 'sine', 0.08, 0.05, 0.9);
    this.playTone(2200, 'sine', 0.06, 0.11, 0.7);
    this.playTone(1760, 'sine', 0.12, 0.18, 0.8);
  }

  public playDuckQuack() {
    // Playful nasal quack
    this.playTone(290, 'sawtooth', 0.14, 0, 0.9);
    this.playNoise(0.08, 0.02, 600);
    this.playTone(240, 'sawtooth', 0.18, 0.08, 0.8);
  }

  public playFrogCroak() {
    // Deep resonant frog ribbit
    this.playTone(110, 'triangle', 0.12, 0, 1.2);
    this.playTone(140, 'sawtooth', 0.14, 0.04, 0.9);
    this.playTone(95, 'triangle', 0.18, 0.12, 1.1);
  }

  public playSalamanderHiss() {
    // Fiery volcanic ember sizzle
    this.playNoise(0.2, 0, 1800);
    this.playTone(440, 'sine', 0.15, 0.02, 0.4);
  }

  public playOtterSqueak() {
    // High playful river otter (huillín) chirp
    this.playTone(980, 'sine', 0.07, 0, 0.8);
    this.playTone(1320, 'sine', 0.09, 0.05, 0.9);
    this.playTone(1100, 'triangle', 0.1, 0.12, 0.6);
  }

  public playPenguinHonk() {
    // Patagonian penguin honk
    this.playTone(260, 'sawtooth', 0.16, 0, 1.0);
    this.playTone(340, 'square', 0.12, 0.06, 0.8);
    this.playTone(210, 'sawtooth', 0.15, 0.14, 0.9);
  }

  public playDinosaurRoar() {
    this.playNoise(0.28, 0, 520);
    this.playTone(110, 'sawtooth', 0.22, 0, 1.2);
    this.playTone(82, 'sawtooth', 0.3, 0.1, 1.1);
  }

  public playAnimalSound(spriteOrName: string) {
    const s = spriteOrName.toLowerCase();
    if (s.includes('trex') || s.includes('cuellilargo') || s.includes('dino') || s.includes('tirano')) {
      this.playDinosaurRoar();
    } else if (s.includes('quiltro') || s.includes('perro') || s.includes('dog')) {
      this.playDogBark();
    } else if (s.includes('pato') || s.includes('duck')) {
      this.playDuckQuack();
    } else if (s.includes('ranita') || s.includes('rana') || s.includes('frog')) {
      this.playFrogCroak();
    } else if (s.includes('salamandra') || s.includes('igneo')) {
      this.playSalamanderHiss();
    } else if (s.includes('huillin') || s.includes('nutria') || s.includes('otter')) {
      this.playOtterSqueak();
    } else if (s.includes('pinguino') || s.includes('penguin')) {
      this.playPenguinHonk();
    } else {
      // Default bird / nature sound
      this.playBirdChirp();
    }
  }

  // --- Background Music System (Procedural Retro Tracks) ---

  public playBgm(trackName: string, force = false) {
    if (!force && this.currentTrack === trackName && this.bgmInterval) {
      return;
    }

    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    this.currentTrack = trackName;
    if (this.isMuted) return;

    // Define regional musical motives
    let step = 0;

    if (trackName === 'title') {
      // Epic adventure theme (Santiago to Patagonia journey)
      const chordRoots = [261.63, 329.63, 392.0, 440.0]; // C - E - G - A
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        const root = chordRoots[Math.floor(step / 4) % chordRoots.length];
        const arpFreq = root * (1 + (step % 4) * 0.25);
        this.playTone(arpFreq, 'triangle', 0.25, 0, 0.4);
        if (step % 2 === 0) {
          this.playTone(root / 2, 'sine', 0.4, 0, 0.5);
        }
        step++;
      }, 260);

    } else if (trackName === 'casa') {
      // Cozy home chime melody (Stage 0)
      const melody = [392.0, 440.0, 523.25, 440.0, 392.0, 329.63, 293.66, 329.63];
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        const note = melody[step % melody.length];
        this.playTone(note, 'sine', 0.32, 0, 0.28);
        if (step % 4 === 0) {
          this.playTone(note / 2, 'triangle', 0.45, 0, 0.25);
        }
        step++;
      }, 360);

    } else if (trackName === 'santiago') {
      // Lively Chilean urban-mountain starter theme
      const melody = [261.63, 293.66, 329.63, 392.0, 329.63, 293.66, 349.23, 329.63];
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        const note = melody[step % melody.length];
        this.playTone(note, 'triangle', 0.22, 0, 0.35);
        if (step % 4 === 0) {
          this.playTone(note / 2, 'sine', 0.4, 0, 0.4);
        }
        step++;
      }, 300);

    } else if (trackName === 'biobio') {
      // Autumnal flowing river & ancient Araucaria canopy theme
      const melody = [293.66, 349.23, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66];
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        const note = melody[step % melody.length];
        this.playTone(note, 'triangle', 0.28, 0, 0.35);
        if (step % 2 === 0) {
          this.playTone(note * 0.5, 'sine', 0.36, 0.04, 0.3);
        }
        step++;
      }, 330);

    } else if (trackName === 'araucania' || trackName === 'pucon' || trackName === 'villarrica') {
      // Intense volcanic & lakeside Araucanía motif
      const bassNotes = [110, 116.54, 123.47, 110, 98, 110, 130.81, 123.47];
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        const note = bassNotes[step % bassNotes.length];
        this.playTone(note, 'sawtooth', 0.18, 0, 0.42);
        if (step % 2 === 1) {
          this.playTone(note * 3, 'square', 0.12, 0, 0.22);
        }
        step++;
      }, 250);

    } else if (trackName === 'losrios') {
      // Calming rainy Valdivian jungle flute-like chimes
      const melody = [329.63, 392.0, 440.0, 523.25, 493.88, 392.0, 329.63, 261.63];
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        const note = melody[step % melody.length];
        this.playTone(note, 'sine', 0.35, 0, 0.4);
        this.playTone(note * 0.75, 'triangle', 0.3, 0.05, 0.25);
        step++;
      }, 360);

    } else if (trackName === 'loslagos' || trackName === 'hornopiren') {
      // Primeval Alerce forest & Austral glacial sanctuary
      const etherChords = [440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 587.33];
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        const note = etherChords[step % etherChords.length];
        this.playTone(note, 'sine', 0.5, 0, 0.35);
        this.playTone(note / 2, 'triangle', 0.6, 0.1, 0.3);
        step++;
      }, 420);

    } else if (trackName === 'battle') {
      // High-octane Pokémon / Final Fantasy turn-based battle theme
      const battleBass = [130.81, 130.81, 155.56, 174.61, 164.81, 146.83, 130.81, 196.0];
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        const note = battleBass[step % battleBass.length];
        this.playTone(note, 'sawtooth', 0.14, 0, 0.4);
        this.playTone(note * 2, 'square', 0.1, 0.05, 0.3);
        if (step % 4 === 0) {
          this.playNoise(0.06, 0, 2000);
        }
        step++;
      }, 190);

    } else if (trackName === 'victory') {
      // Iconic Final Fantasy style fanfare
      const fanfare = [
        { f: 523.25, d: 0.15 }, { f: 523.25, d: 0.15 }, { f: 523.25, d: 0.15 },
        { f: 523.25, d: 0.4 }, { f: 415.3, d: 0.4 }, { f: 466.16, d: 0.4 },
        { f: 523.25, d: 0.3 }, { f: 466.16, d: 0.15 }, { f: 523.25, d: 0.7 }
      ];
      this.bgmInterval = setInterval(() => {
        if (this.isMuted) return;
        if (step < fanfare.length) {
          const item = fanfare[step];
          this.playTone(item.f, 'square', item.d, 0, 0.5);
          this.playTone(item.f * 1.5, 'triangle', item.d, 0, 0.35);
          step++;
        }
      }, 240);
    }
  }

  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentTrack = null;
  }
}

export const sound = new SoundEngine();
