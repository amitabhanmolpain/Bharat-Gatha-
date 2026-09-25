"use client";

/**
 * Bharat Gatha - Game Sound Effects Engine
 * Pure Web Audio API synthesized SFX designed for tactile RPG/game feedback.
 * Operates on an isolated audio channel that NEVER interferes with TTS or background music.
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastClickTime: number = 0;
  private lastHoverTime: number = 0;
  private unlockAudio: HTMLAudioElement | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => { });
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Authentic Mechanical Keyboard Sound (Switch snap + bottom-out thock)
   * Plays on clicking action buttons (Restart, Music, Sound, Leave world, Options).
   * Tuned with enhanced gain for punchy, tactile mechanical clarity.
   */
  public playKeyboardClick(pitch: number = 1.0) {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastClickTime < 50) return;
    this.lastClickTime = nowMs;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. High-frequency tactile switch click (actuation snap)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = "sine";
      snapOsc.frequency.setValueAtTime(2400 * pitch, now);
      snapOsc.frequency.exponentialRampToValueAtTime(800 * pitch, now + 0.015);
      snapGain.gain.setValueAtTime(0.22, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.025);

      // 2. Solid mechanical bottom-out "thock"
      const thockOsc = ctx.createOscillator();
      const thockGain = ctx.createGain();
      thockOsc.type = "triangle";
      thockOsc.frequency.setValueAtTime(320 * pitch, now);
      thockOsc.frequency.exponentialRampToValueAtTime(120 * pitch, now + 0.035);
      thockGain.gain.setValueAtTime(0.26, now);
      thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      thockOsc.connect(thockGain);
      thockGain.connect(ctx.destination);
      thockOsc.start(now);
      thockOsc.stop(now + 0.06);

      // 3. Crisp mechanical texture transient
      const bufferSize = Math.floor(ctx.sampleRate * 0.018);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2800 * pitch;
      filter.Q.value = 1.8;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
    } catch (e) { }
  }

  /**
   * Crisp UI Button Click (Tactile Mechanical Keyboard Click)
   */
  public playButtonClick(pitch: number = 1.0) {
    this.playKeyboardClick(pitch);
  }

  /**
   * Soft Tactile Hover Sound (Tick / subtle blip)
   * Plays on hovering over top buttons and interactive UI controls.
   */
  public playButtonHover() {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastHoverTime < 40) return;
    this.lastHoverTime = nowMs;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.02);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) { }
  }

  /**
   * Selection / Option Tap (warm wooden/plink note)
   */
  public playSelect() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } catch (e) { }
  }

  /**
   * Modal Open / Clue Discovery Chime
   */
  public playClueChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const freqs = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.06;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.07, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch (e) { }
  }

  /**
   * Rewarding Clue Found Fanfare (Sparkling 5-note ascending arpeggio with high shimmer glissando)
   */
  public playClueFound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      // Ascending celebratory major chord: C5, E5, G5, C6, E6
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.07;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.08, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });

      // High sparkling shimmer overtone
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      const sparkleTime = ctx.currentTime + 0.35;
      sparkleOsc.type = "triangle";
      sparkleOsc.frequency.setValueAtTime(2093.0, sparkleTime); // C7
      sparkleOsc.frequency.exponentialRampToValueAtTime(2637.02, sparkleTime + 0.15); // E7
      sparkleGain.gain.setValueAtTime(0.001, sparkleTime);
      sparkleGain.gain.exponentialRampToValueAtTime(0.05, sparkleTime + 0.02);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.45);
      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      sparkleOsc.start(sparkleTime);
      sparkleOsc.stop(sparkleTime + 0.5);
    } catch (e) { }
  }

  /**
   * Close / Back / Dismiss Sound
   */
  public playClose() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) { }
  }

  /**
   * Puzzle Tile Swap / Movement Sound
   */
  public playTileSwap() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) { }
  }

  /**
   * Authentic Cowrie Shells Clatter Sound
   * Synthesizes the tactile, rapid cascading clatter of multiple porcelain/calcified
   * cowrie shells bouncing, clicking, and settling on a stone or wooden board.
   */
  public playCowrieShellsSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const baseTime = ctx.currentTime;
      // 6 staggered impacts representing four tumbling, bouncing cowrie shells
      const bounces = [
        { delay: 0.00, pitch: 1.15, vol: 0.28 },
        { delay: 0.04, pitch: 0.95, vol: 0.24 },
        { delay: 0.085, pitch: 1.30, vol: 0.22 },
        { delay: 0.135, pitch: 0.88, vol: 0.18 },
        { delay: 0.185, pitch: 1.05, vol: 0.14 },
        { delay: 0.235, pitch: 1.25, vol: 0.10 },
      ];

      bounces.forEach(({ delay, pitch, vol }) => {
        const t = baseTime + delay;

        // 1. Calcified porcelain click (resonant sine decay)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(2600 * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(1400 * pitch, t + 0.025);
        gain.gain.setValueAtTime(vol * 0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.035);

        // 2. High-frequency shell edge click (filtered noise burst)
        const bufferSize = Math.floor(ctx.sampleRate * 0.012);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channel[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(3800 * pitch, t);
        filter.Q.value = 3.5;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(vol * 0.9, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);
        noise.stop(t + 0.02);

        // 3. Subtle hollow board tap
        const tapOsc = ctx.createOscillator();
        const tapGain = ctx.createGain();
        tapOsc.type = "triangle";
        tapOsc.frequency.setValueAtTime(420 * pitch, t);
        tapOsc.frequency.exponentialRampToValueAtTime(180, t + 0.02);
        tapGain.gain.setValueAtTime(vol * 0.35, t);
        tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
        tapOsc.connect(tapGain);
        tapGain.connect(ctx.destination);
        tapOsc.start(t);
        tapOsc.stop(t + 0.03);
      });
    } catch (e) { }
  }

  /**
   * Physically Modeled Vittala Temple Stone Pillar Sound
   * Since licensed original recordings are unavailable, this uses additive synthesis
   * to replicate the inharmonic partials, transient strike, and granite damping 
   * characteristics of the actual Hampi musical pillars based on acoustic references.
   */
  public playStonePillar(baseFreq: number) {
    if (this.isMuted) return;

    const play = async () => {
      try {
        console.log(`[VITTALA AUDIO] Clicked pillar: frequency ${baseFreq}Hz`);
        const ctx = this.getContext();
        if (!ctx) {
          console.error("[VITTALA AUDIO ERROR] Web Audio API not supported or context missing");
          return;
        }

        if (ctx.state === "suspended") {
          console.log("[VITTALA AUDIO] AudioContext suspended, attempting to resume...");
          await ctx.resume();
        }

        console.log(`[VITTALA AUDIO] AudioContext state: ${ctx.state}`);
        const now = ctx.currentTime;
        console.log(`[VITTALA AUDIO] Playback starting at currentTime: ${now}`);

        // The transient "strike" (stone on stone/wood on stone)
        const noiseBufferSize = Math.floor(ctx.sampleRate * 0.05);
        if (noiseBufferSize > 0) {
          const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = noiseBuffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = "bandpass";
          noiseFilter.frequency.value = 4000;
          noiseFilter.Q.value = 1.0;
          const noiseGain = ctx.createGain();

          noiseGain.gain.setValueAtTime(0, now);
          noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.005);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          noiseSource.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          noiseSource.start(now);
        }

        // Inharmonic partial ratios for a stiff vibrating bar (granite column approximation)
        const partials = [
          { ratio: 1.000, gain: 1.0, decay: 2.5 },
          { ratio: 2.756, gain: 0.6, decay: 1.8 },
          { ratio: 5.404, gain: 0.4, decay: 1.2 },
          { ratio: 8.933, gain: 0.2, decay: 0.8 },
          { ratio: 13.34, gain: 0.1, decay: 0.4 }
        ];

        partials.forEach((partial, index) => {
          const osc = ctx.createOscillator();
          const pGain = ctx.createGain();

          // Slight detune for that imperfect acoustic feel
          const detune = (Math.random() - 0.5) * 4; // +/- 2 cents
          osc.type = "sine";
          osc.frequency.value = baseFreq * partial.ratio;
          osc.detune.value = detune;

          // Strike attack is immediate, then decays based on the partial's decay constant
          pGain.gain.setValueAtTime(0, now);
          pGain.gain.linearRampToValueAtTime(partial.gain * 0.4, now + 0.01);
          pGain.gain.setTargetAtTime(0, now + 0.01, partial.decay / 3);

          osc.connect(pGain);
          pGain.connect(ctx.destination);

          osc.start(now);
          // Stop oscillator after it has decayed
          osc.stop(now + partial.decay * 2);
        });

        console.log(`[VITTALA AUDIO] Nodes scheduled successfully for freq ${baseFreq}Hz`);
      } catch (e) {
        console.error("[VITTALA AUDIO ERROR] Playback failed:", e);
      }
    };

    play();
  }

  public playItemUnlock() {
    if (this.isMuted) return;
    try {
      if (typeof window !== "undefined") {
        if (!this.unlockAudio) {
          this.unlockAudio = new window.Audio("/audio/item-unlock.mp3");
          this.unlockAudio.volume = 0.5;
        }
        
        // Reset playback position if it's already playing
        this.unlockAudio.currentTime = 0;
        
        this.unlockAudio.play().catch(e => console.error("[SoundService] Item unlock audio failed:", e));
      }
    } catch (e) {
      console.error("[SoundService] Error playing item unlock:", e);
    }
  }

  public playDialogueOpen() {
    this.playClueChime();
  }
}

export const soundFx = new SoundEffectsService();
