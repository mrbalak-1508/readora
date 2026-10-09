"use client";

export type SoundProfile = "parchment" | "crisp" | "vintage" | "digital" | "soft" | "custom";

export interface SoundProfileMeta {
  id: SoundProfile;
  name: string;
  description: string;
  badge: string;
}

export const SOUND_PROFILES: SoundProfileMeta[] = [
  {
    id: "parchment",
    name: "Classic Parchment",
    description: "Tactile paper sweep with natural leaf flutter and gentle friction thump",
    badge: "Organic",
  },
  {
    id: "crisp",
    name: "Crisp Modern",
    description: "Lightweight, brisk page flick with higher frequency paper rustle",
    badge: "Modern",
  },
  {
    id: "vintage",
    name: "Vintage Hardcover",
    description: "Deep, antique, heavy leaf turn with rich resonant spine resonance",
    badge: "Warm",
  },
  {
    id: "digital",
    name: "Digital Glide",
    description: "Minimalist soft acoustic chime with subtle frequency glide",
    badge: "Tech",
  },
  {
    id: "soft",
    name: "Whisper Soft",
    description: "Ultra-quiet, gentle breath of air for late-night undisturbed reading",
    badge: "Gentle",
  },
  {
    id: "custom",
    name: "Custom Audio SFX",
    description: "Custom audio file configured by platform administrator",
    badge: "Custom",
  },
];

// Web Audio API Synthesizer with multiple authentic page turn profiles
class SoundService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false; // Default OFF
  private volume: number = 0.8; // 0.0 - 1.0
  private soundProfile: SoundProfile = "parchment";
  private customAudioUrl: string = "";
  private customAudioEl: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("readora_sound_effects");
      if (saved !== null) {
        this.enabled = saved === "true";
      } else {
        this.enabled = false;
        localStorage.setItem("readora_sound_effects", "false");
      }

      const savedVol = localStorage.getItem("readora_sound_volume");
      if (savedVol !== null) {
        this.volume = Math.max(0, Math.min(1, parseFloat(savedVol) || 0.8));
      }

      const savedProfile = localStorage.getItem("readora_sound_profile") as SoundProfile;
      if (savedProfile && SOUND_PROFILES.some((p) => p.id === savedProfile)) {
        this.soundProfile = savedProfile;
      }

      const savedUrl = localStorage.getItem("readora_sound_url");
      if (savedUrl) {
        this.customAudioUrl = savedUrl;
      }

      // Automatically sync admin configured defaults from server
      this.syncFromServer();

      // Automatically unlock audio context on first user click/touch
      const unlockAudio = () => {
        this.initCtx();
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
      };
      window.addEventListener("click", unlockAudio, { once: true });
      window.addEventListener("touchstart", unlockAudio, { once: true });
    }
  }

  public async syncFromServer() {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data?.settings) {
          const profile = data.settings.reader_sound_profile;
          if (profile && SOUND_PROFILES.some((p) => p.id === profile)) {
            // Only update if user hasn't explicitly customized locally
            if (!localStorage.getItem("readora_sound_profile_customized")) {
              this.soundProfile = profile;
            }
          }
          if (data.settings.reader_sound_url) {
            this.customAudioUrl = data.settings.reader_sound_url;
          }
        }
      }
    } catch {
      // silent fallback to local storage
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("readora_sound_effects", enabled ? "true" : "false");
    }
    if (enabled) {
      this.playClick();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("readora_sound_volume", this.volume.toString());
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setSoundProfile(profile: SoundProfile, markCustomized = true) {
    this.soundProfile = profile;
    if (typeof window !== "undefined") {
      localStorage.setItem("readora_sound_profile", profile);
      if (markCustomized) {
        localStorage.setItem("readora_sound_profile_customized", "true");
      }
    }
  }

  public getSoundProfile(): SoundProfile {
    return this.soundProfile;
  }

  public setCustomAudioUrl(url: string) {
    this.customAudioUrl = url;
    if (typeof window !== "undefined") {
      localStorage.setItem("readora_sound_url", url);
    }
    this.customAudioEl = null;
  }

  public getCustomAudioUrl(): string {
    return this.customAudioUrl;
  }

  private initCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // Master page turn play method supporting all sound profiles
  public playPageTurn(overrideProfile?: SoundProfile) {
    if (!this.enabled || this.volume <= 0) return;
    const profile = overrideProfile || this.soundProfile;

    try {
      if (profile === "custom" && this.customAudioUrl) {
        this.playCustomSound();
        return;
      }

      switch (profile) {
        case "crisp":
          this.playCrispTurn();
          break;
        case "vintage":
          this.playVintageTurn();
          break;
        case "digital":
          this.playDigitalTurn();
          break;
        case "soft":
          this.playSoftTurn();
          break;
        case "parchment":
        default:
          this.playParchmentTurn();
          break;
      }
    } catch {
      // Safe catch
    }
  }

  // 1. Parchment: Classic organic flutter + gentle friction sweep
  private playParchmentTurn() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.13);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555;
      b1 = 0.99332 * b1 + white * 0.075;
      b2 = 0.969 * b2 + white * 0.153;
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (b0 + b1 + b2) * 0.16 * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.13);
    filter.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Subtle low friction thump
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);

    oscGain.gain.setValueAtTime(0.2 * this.volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 2. Crisp Modern: Snappy magazine / high-quality book page flick
  private playCrispTurn() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.09);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const env = Math.pow(1 - i / bufferSize, 1.8);
      data[i] = white * 0.22 * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.09);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // High snap chirp
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

    oscGain.gain.setValueAtTime(0.25 * this.volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 3. Vintage Hardcover: Deep, antique leather-bound weighty page turn
  private playVintageTurn() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = white * 0.25 * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Warm deep thud
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);

    oscGain.gain.setValueAtTime(0.35 * this.volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // 4. Digital Glide: Modern clean UI page transition
  private playDigitalTurn() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.11);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  // 5. Whisper Soft: Ultra-gentle whisper
  private playSoftTurn() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.1);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = white * 0.12 * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(0.9, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  // 6. Custom Audio: Play external audio file
  private playCustomSound() {
    if (!this.customAudioUrl) return;
    try {
      if (!this.customAudioEl || !this.customAudioEl.src.includes(this.customAudioUrl)) {
        this.customAudioEl = new Audio(this.customAudioUrl);
      }
      this.customAudioEl.volume = this.volume;
      this.customAudioEl.currentTime = 0;
      this.customAudioEl.play().catch(() => {});
    } catch {
      // safe fallback
      this.playParchmentTurn();
    }
  }

  // Soft bookmark latch sound
  public playBookmark() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.09); // A5

      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  // Book opening resonance
  public playBookOpen() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      [329.63, 493.88, 659.25].forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.18 * this.volume, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.35);
      });
    } catch {}
  }

  // Subtle clean button click
  public playClick() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);

      gain.gain.setValueAtTime(0.15 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }

  // Completion fanfare: warm acoustic harmonic chime
  public playComplete() {
    this.playCompletion();
  }

  public playCompletion() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.25 * this.volume, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.55);
      });
    } catch {}
  }
}

export const soundManager = new SoundService();
