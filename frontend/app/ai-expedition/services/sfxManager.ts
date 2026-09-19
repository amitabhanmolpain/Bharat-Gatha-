/**
 * SFX Manager — Web Audio API procedural sound effects
 * Zero network latency; all sounds are synthesized in-browser.
 * 
 * Sounds:
 *   footstep        — soft 80Hz tick with exponential decay (~60ms)
 *   interact        — bright 440Hz click ping (~80ms)
 *   discover        — ascending chime sweep 440→880Hz (~300ms)
 *   transition      — low whoosh sweep descending 200→80Hz (~400ms)
 *   dialogue_open   — gentle 520Hz soft chime (~200ms)
 */

class SFXManager {
  private static instance: SFXManager;
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private footstepPhase: number = 0;
  private lastFootstepTime: number = 0;

  private constructor() {}

  public static getInstance(): SFXManager {
    if (!SFXManager.instance) {
      SFXManager.instance = new SFXManager();
    }
    return SFXManager.instance;
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx || this.ctx.state === "closed") {
      try {
        this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Soft footstep tick — alternates between slightly different pitches for left/right foot feel.
   * Rate-limited to max ~4 per second to avoid audio clutter during fast movement.
   */
  public playFootstep(): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.lastFootstepTime < 250) return; // 4 steps/s max
    this.lastFootstepTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      gain.connect(ctx.destination);

      // White noise burst for soft footstep texture
      const bufferSize = Math.floor(ctx.sampleRate * 0.06);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Low-pass filter to make it sound like footstep not static
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      this.footstepPhase = 1 - this.footstepPhase;
      filter.frequency.setValueAtTime(this.footstepPhase === 0 ? 400 : 300, t);

      source.connect(filter);
      filter.connect(gain);
      source.start(t);
      source.stop(t + 0.07);
    } catch {
      // Ignore
    }
  }

  /**
   * Bright interaction ping — played when the player presses E to interact.
   */
  public playInteract(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.04);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch {
      // Ignore
    }
  }

  /**
   * Discovery chime — ascending sweep played when evidence is found.
   */
  public playDiscover(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Two oscillators layered for richer sound
      [440, 554].forEach((baseFreq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = i * 0.06;

        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, t + delay);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, t + delay + 0.25);

        gain.gain.setValueAtTime(0.0, t + delay);
        gain.gain.linearRampToValueAtTime(0.12, t + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.45);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Scene transition whoosh — low descending sweep.
   */
  public playTransition(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.45);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      // Low-pass to make it muffled / atmospheric
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    } catch {
      // Ignore
    }
  }

  /**
   * Dialogue open chime — soft short ping when NPC dialogue panel opens.
   */
  public playDialogueOpen(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.linearRampToValueAtTime(540, t + 0.1);

      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch {
      // Ignore
    }
  }
}

export const sfxManager = SFXManager.getInstance();
