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
  public stopNarration(triggerOnEnd: boolean = false): void {
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
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const endCallback = this.currentOptions?.onEnd;
    this.currentOptions = undefined;
    this.updateState({ isPlaying: false, isLoading: false, currentText: null });
    if (triggerOnEnd && endCallback) {
      endCallback();
    }
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
      // 2. Resolve audio source: check static or dynamic Sarvam TTS
      let audioSrc: string | null = options?.audioUrl || null;
      const lowerText = trimmed.toLowerCase();

      if (!audioSrc) {
        if (lowerText.includes("you have entered the year 1653") || lowerText.includes("heart of the mughal empire")) {
          audioSrc = "/mughal_intro_narration.wav";
        } else if (lowerText.includes("starlight reflections in the sheesh mahal") || lowerText.includes("royal passage to khas mahal")) {
          audioSrc = "/sheesh_mahal_solved_narration.wav";
        } else if (lowerText.includes("pietra dura marble art") && lowerText.includes("sheesh mahal")) {
          audioSrc = "/pietra_dura_solved_narration.wav";
        } else if (lowerText.includes("golden pavilion") && (lowerText.includes("twilight years") || lowerText.includes("yamuna river") || lowerText.includes("taj mahal"))) {
          audioSrc = "/khas_mahal_narration.wav";
        } else if (lowerText.includes("cenotaphs") && (lowerText.includes("public viewing") || lowerText.includes("crypt") || lowerText.includes("actual historic graves"))) {
          audioSrc = "/taj_mausoleum_narration.wav";
        }
      }

      // Check cache or fetch from Sarvam AI TTS backend
      if (!audioSrc) {
        if (this.audioCache.has(trimmed)) {
          audioSrc = this.audioCache.get(trimmed)!;
        } else {
          try {
            const res = await fetch(`${this.getBackendUrl()}/api/tts/narrate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: trimmed,
                speaker: options?.speaker || "ratan",
                pace: options?.pace || 0.88,
                language_code: options?.language_code || "en-IN",
                model: options?.model || "bulbul:v3"
              })
            });

            if (res.ok) {
              const data = await res.json();
              const base64Data = data?.audio || data?.audio_base64;
              if (typeof base64Data === "string" && base64Data) {
                const b64Src = `data:audio/wav;base64,${base64Data}`;
                audioSrc = b64Src;
                this.audioCache.set(trimmed, b64Src);
              } else if (typeof data?.audio_url === "string" && data.audio_url) {
                const urlSrc: string = data.audio_url;
                audioSrc = urlSrc;
                this.audioCache.set(trimmed, urlSrc);
              }
            }
          } catch (fetchErr) {
            console.warn("Sarvam AI TTS backend fetch failed, using browser speech fallback:", fetchErr);
          }
        }
      }

      // If still no audioSrc, use browser SpeechSynthesis as robust fallback
      if (!audioSrc) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(trimmed);
          utterance.rate = 0.88;
          utterance.pitch = 0.95;
          utterance.onstart = () => {
            this.updateState({ isPlaying: true, isLoading: false });
            options?.onStart?.();
          };
          utterance.onend = () => {
            this.updateState({ isPlaying: false, isLoading: false, currentText: null });
            options?.onEnd?.();
          };
          utterance.onerror = (e) => {
            this.updateState({ isPlaying: false, isLoading: false });
            options?.onError?.(e);
          };
          window.speechSynthesis.speak(utterance);
          return null;
        }
        audioSrc = "/sheesh_mahal_solved_narration.wav";
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

        if (
          playErr?.name === "NotSupportedError" ||
          playErr?.message?.includes("NotSupportedError") ||
          playErr?.message?.includes("supported source")
        ) {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(trimmed);
              utterance.rate = 0.88;
              utterance.pitch = 0.95;
              utterance.onstart = () => {
                this.updateState({ isPlaying: true, isLoading: false });
                options?.onStart?.();
              };
              utterance.onend = () => {
                this.updateState({ isPlaying: false, isLoading: false, currentText: null });
                options?.onEnd?.();
              };
              window.speechSynthesis.speak(utterance);
            } catch (speechErr) {}
          }
          return null;
        }

        throw playErr;
      }

      return audio;
    } catch (err: any) {
      if (
        err?.name !== "NotAllowedError" &&
        err?.name !== "AbortError" &&
        err?.name !== "NotSupportedError" &&
        !err?.message?.includes("supported source") &&
        !err?.message?.includes("interrupted")
      ) {
        console.warn("Narration playback warning:", err);
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

export const stopNarration = (triggerOnEnd: boolean = false) => narrator.stopNarration(triggerOnEnd);
