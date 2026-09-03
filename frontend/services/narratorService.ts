/**
 * Narrator Service for Bharat Gatha Game.
 *
 * Provides a cinematic, immersive historical storyteller voice (Ratan, en-IN, pace 0.88-0.90)
 * either via pre-uploaded high-speed Cloudinary CDN audio or dynamically synthesized via backend Sarvam AI TTS.
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
      return (
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:5001"
      );
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
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (e) {
        console.warn("Error stopping narration audio:", e);
      }
      this.activeAudio = null;
    }
    this.updateState({ isPlaying: false, isLoading: false, currentText: null });
  }

  /**
   * Play narration with cinematic historical pacing.
   * If `audioUrl` is provided (e.g. Cloudinary CDN link), plays directly with 0 API calls.
   * Automatically terminates any currently playing narration first.
   */
  public async playNarration(
    text: string,
    options?: NarrationOptions
  ): Promise<HTMLAudioElement | null> {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // 1. Stop any previous narrator audio immediately
    this.stopNarration();

    this.updateState({
      isLoading: true,
      isPlaying: false,
      currentText: trimmed,
      error: null,
    });

    try {
      let audioSrc: string;

      // 2. If a pre-uploaded Cloudinary or local audio URL is provided, use it directly!
      if (options?.audioUrl) {
        audioSrc = options.audioUrl;
      } else {
        // Check in-memory cache
        let audioBase64 = this.audioCache.get(trimmed);

        if (!audioBase64) {
          const backendUrl = this.getBackendUrl();
          const response = await fetch(`${backendUrl}/api/tts/narrate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: trimmed,
              speaker: options?.speaker || "ratan",
              pace: options?.pace ?? 0.88,
              language_code: options?.language_code || "en-IN",
              model: options?.model || "bulbul:v3",
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(
              errData.message || `TTS request failed with status ${response.status}`
            );
          }

          const data = await response.json();
          if (data.status !== "success" || !data.audio_base64) {
            throw new Error(data.message || "No audio returned from backend.");
          }

          audioBase64 = data.audio_base64;
          this.audioCache.set(trimmed, audioBase64!);
        }

        audioSrc = `data:audio/wav;base64,${audioBase64}`;
      }

      // 3. Create and play the audio element
      const audio = new Audio(audioSrc);
      audio.volume = 1.0;
      this.activeAudio = audio;

      audio.onplay = () => {
        this.updateState({ isPlaying: true, isLoading: false });
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
        console.error("Narration playback error:", e);
        if (this.activeAudio === audio) {
          this.activeAudio = null;
          this.updateState({
            isPlaying: false,
            isLoading: false,
            error: "Playback failed.",
          });
        }
        options?.onError?.(e);
      };

      await audio.play();
      return audio;
    } catch (err: any) {
      console.error("Failed to generate or play narration:", err);
      this.updateState({
        isPlaying: false,
        isLoading: false,
        error: err.message || "Narration failed.",
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
