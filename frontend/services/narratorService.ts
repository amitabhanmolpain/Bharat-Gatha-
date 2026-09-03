/**
 * Narrator Service for Bharat Gatha Game.
 *
 * Provides a cinematic, immersive historical storyteller voice (Ratan, en-IN, pace 0.88-0.90)
 * Plays from local offline audio files (`/mughal_intro_narration.wav`), with 0 remote latency.
 */

export interface NarrationOptions {
  audioUrl?: string;
  speaker?: string;
  pace?: number;
  language_code?: string;
  model?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface NarratorState {
  isPlaying: boolean;
  isLoading: boolean;
  currentText: string | null;
  error: string | null;
}

type Listener = (state: NarratorState) => void;

class NarratorManager {
  private activeAudio: HTMLAudioElement | null = null;
  private currentAudioSrc: string | null = null;
  private currentOptions: NarrationOptions | undefined = undefined;
  private audioCache: Map<string, string> = new Map();
  private listeners: Set<Listener> = new Set();

  private state: NarratorState = {
    isPlaying: false,
    isLoading: false,
    currentText: null,
    error: null,
  };

  private getBackendUrl(): string {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
    }
    return "http://localhost:5001";
  }

  private updateState(partial: Partial<NarratorState>) {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): NarratorState {
    return this.state;
  }

  public isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * Stop any ongoing narrator audio playback immediately.
   */
  public stopNarration(): void {
    if (this.activeAudio) {
      const audioToStop = this.activeAudio;
      this.activeAudio = null;
      try {
        audioToStop.pause();
        audioToStop.currentTime = 0;
      } catch (e) {
        // Safe to ignore interruption
      }
    }
    this.updateState({ isPlaying: false, isLoading: false, currentText: null });
  }

  /**
   * Resume / Trigger active narrator audio playback directly upon user click.
   */
  public async playActiveAudio(): Promise<void> {
    if (this.activeAudio) {
      try {
        await this.activeAudio.play();
        this.updateState({ isPlaying: true, isLoading: false });
      } catch (e) {
        // Retry with local fallback
        if (this.currentAudioSrc) {
          const freshAudio = new Audio(this.currentAudioSrc);
          this.activeAudio = freshAudio;
          freshAudio.play().catch(() => {});
          this.updateState({ isPlaying: true, isLoading: false });
        }
      }
    } else if (this.state.currentText) {
      this.playNarration(this.state.currentText, this.currentOptions);
    }
  }

  /**
   * Play narration locally with cinematic historical pacing.
   * Prioritizes local `/mughal_intro_narration.wav` for instant offline playback.
   */
  public async playNarration(
    text: string,
    options?: NarrationOptions
  ): Promise<HTMLAudioElement | null> {
    const trimmed = text.trim();
    if (!trimmed) return null;

    this.currentOptions = options;

    // 1. Stop any previous narrator audio immediately
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (e) {}
      this.activeAudio = null;
    }

    this.updateState({
      isLoading: true,
      isPlaying: false,
      currentText: trimmed,
      error: null,
    });

    try {
      // 2. Prioritize local file playback
      let audioSrc: string = options?.audioUrl || "/mughal_intro_narration.wav";
      const lowerText = trimmed.toLowerCase();

      if (lowerText.includes("you have entered the year 1653") || lowerText.includes("heart of the mughal empire")) {
        audioSrc = "/mughal_intro_narration.wav";
      }

      this.currentAudioSrc = audioSrc;

      // 3. Create and prepare audio element
      const audio = new Audio(audioSrc);
      audio.volume = 1.0;
      this.activeAudio = audio;

      audio.onplay = () => {
        if (this.activeAudio === audio) {
          this.updateState({ isPlaying: true, isLoading: false });
        }
        options?.onStart?.();
      };

      audio.onended = () => {
        if (this.activeAudio === audio) {
          this.activeAudio = null;
          this.updateState({ isPlaying: false, isLoading: false, currentText: null });
        }
        options?.onEnd?.();
      };

      audio.onerror = (e) => {
        if (this.activeAudio === audio) {
          this.updateState({
            isPlaying: false,
            isLoading: false,
            error: null,
          });
        }
        options?.onError?.(e);
      };

      try {
        await audio.play();
      } catch (playErr: any) {
        if (
          playErr?.name === "AbortError" ||
          playErr?.message?.includes("interrupted") ||
          playErr?.message?.includes("pause")
        ) {
          return null;
        }

        // Browser autoplay blocked until user gesture
        if (
          playErr?.name === "NotAllowedError" ||
          playErr?.message?.includes("interact")
        ) {
          this.updateState({ isLoading: false, isPlaying: false });

          const unlockAndPlay = () => {
            if (this.activeAudio === audio) {
              audio.play().catch(() => {});
            }
            window.removeEventListener("click", unlockAndPlay);
            window.removeEventListener("keydown", unlockAndPlay);
            window.removeEventListener("touchstart", unlockAndPlay);
          };
          window.addEventListener("click", unlockAndPlay, { once: true });
          window.addEventListener("keydown", unlockAndPlay, { once: true });
          window.addEventListener("touchstart", unlockAndPlay, { once: true });
          return audio;
        }

        throw playErr;
      }

      return audio;
    } catch (err: any) {
      if (
        err?.name !== "NotAllowedError" &&
        err?.name !== "AbortError" &&
        !err?.message?.includes("interrupted")
      ) {
        console.error("Narration playback error:", err);
      }
      this.updateState({
        isPlaying: false,
        isLoading: false,
        error: null,
      });
      options?.onError?.(err);
      return null;
    }
  }
}

// Export singleton instance
export const narrator = new NarratorManager();

// Export convenience helper functions
export const playNarration = (text: string, options?: NarrationOptions) =>
  narrator.playNarration(text, options);

export const stopNarration = () => narrator.stopNarration();
