/**
 * Character Voice & Dialogue Service for Bharat Gatha Game.
 *
 * Dedicated to character dialogues (Jolly Bhai & Mughal Guards).
 * Plays pre-rendered offline audio files locally and synthesizes dynamic answers.
 */

export interface CharacterDialogueOptions {
  character: "jolly" | "guard" | string;
  text: string;
  audioUrl?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface CharacterVoiceState {
  isPlaying: boolean;
  isLoading: boolean;
  activeCharacter: string | null;
  currentText: string | null;
  error: string | null;
}

type CharacterVoiceListener = (state: CharacterVoiceState) => void;

class CharacterVoiceManager {
  private activeAudio: HTMLAudioElement | null = null;
  private audioCache: Map<string, string> = new Map();
  private listeners: Set<CharacterVoiceListener> = new Set();

  private state: CharacterVoiceState = {
    isPlaying: false,
    isLoading: false,
    activeCharacter: null,
    currentText: null,
    error: null,
  };

  private getBackendUrl(): string {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
    }
    return "http://localhost:5001";
  }

  private updateState(partial: Partial<CharacterVoiceState>) {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  public subscribe(listener: CharacterVoiceListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): CharacterVoiceState {
    return this.state;
  }

  public isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * Stop any active character dialogue audio immediately.
   */
  public stopCharacterDialogue(): void {
    if (this.activeAudio) {
      const audioToStop = this.activeAudio;
      this.activeAudio = null;
      try {
        audioToStop.pause();
        audioToStop.currentTime = 0;
      } catch (e) {}
    }
    this.updateState({
      isPlaying: false,
      isLoading: false,
      activeCharacter: null,
      currentText: null,
    });
  }

  /**
   * Resolve appropriate local or cached audio source for character dialogue.
   */
  private resolveAudioSource(character: string, text: string): string | null {
    const char = (character || "").toLowerCase();
    const lower = text.toLowerCase().trim();

    // 1. Guard Local Canonical Pre-recorded Files
    if (char === "guard" || char.includes("sentry")) {
      if (lower.includes("again you ask") || lower.includes("again u ask") || (lower.includes("punished") && lower.includes("question"))) {
        return "/guard_punish_warn.wav";
      }
      if (lower.includes("accha") && (lower.includes("diwan-i-khas") || lower.includes("eyes will be on you"))) {
        return "/guard_court_talent.wav";
      }
      if (lower.includes("halt, intruder") || lower.includes("stop right where you stand") || lower.includes("restricted imperial ground")) {
        return "/guard_gate_halt.wav";
      }
    }

    // 2. Jolly Local Canonical Pre-recorded Files
    if (char === "jolly" || char.includes("genie")) {
      if (lower.includes("golden domes") || lower.includes("bittersweet truth") || lower.includes("pure, solid gold") || lower.includes("shadow of our lost mughal splendour")) {
        return "/jolly_khas_mahal_gold.wav";
      }
      if (lower.includes("jolly bhai") && lower.includes("born many centuries") && lower.includes("dancing like a madman")) {
        return "/jolly_intro.wav";
      }
    }

    return null;
  }

  /**
   * Play character dialogue with 100% reliability.
   */
  public async playCharacterDialogue(
    options: CharacterDialogueOptions
  ): Promise<HTMLAudioElement | null> {
    const { character, text, audioUrl, onStart, onEnd, onError } = options;
    const trimmed = text.trim();
    if (!trimmed) return null;

    // 1. Stop previous character audio safely
    this.stopCharacterDialogue();

    this.updateState({
      isLoading: true,
      isPlaying: false,
      activeCharacter: character,
      currentText: trimmed,
      error: null,
    });

    try {
      let audioSrc: string | null = null;
      const lookupKey = `${character.toLowerCase()}:${trimmed.toLowerCase()}`;

      // Check explicit audioUrl or exact canonical local mappings
      if (audioUrl) {
        audioSrc = audioUrl;
      } else {
        audioSrc = this.resolveAudioSource(character, trimmed);
      }

      // If not a static local track, fetch from backend dynamic TTS
      if (!audioSrc) {
        let cachedB64 = this.audioCache.get(lookupKey);

        if (!cachedB64) {
          try {
            const backendUrl = this.getBackendUrl();
            const response = await fetch(`${backendUrl}/api/tts/character`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                character,
                text: trimmed,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const b64Data = data.audio || data.audio_base64;
              if (b64Data) {
                cachedB64 = b64Data;
                this.audioCache.set(lookupKey, cachedB64!);
              }
            }
          } catch (fetchErr) {
            console.warn("Character dynamic TTS fetch error:", fetchErr);
          }
        }

        if (cachedB64) {
          audioSrc = `data:audio/wav;base64,${cachedB64}`;
        }
      }

      // If still not available from backend, use browser speech synthesis with character tone
      if (!audioSrc) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(trimmed);
          utterance.rate = character.toLowerCase() === "guard" ? 1.05 : 0.95;
          utterance.pitch = character.toLowerCase() === "guard" ? 0.8 : 1.1;
          
          const voices = window.speechSynthesis.getVoices();
          const inVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("hi-IN"));
          if (inVoice) utterance.voice = inVoice;

          utterance.onstart = () => {
            this.updateState({ isPlaying: true, isLoading: false });
            onStart?.();
          };
          utterance.onend = () => {
            this.updateState({ isPlaying: false, isLoading: false, activeCharacter: null, currentText: null });
            onEnd?.();
          };
          utterance.onerror = (e) => {
            this.updateState({ isPlaying: false, isLoading: false, error: "Speech synthesis failed" });
            onError?.(e);
          };

          window.speechSynthesis.speak(utterance);
          return null;
        }

        this.updateState({ isLoading: false, isPlaying: false });
        return null;
      }

      // Create and prepare Audio
      const audio = new Audio(audioSrc);
      audio.volume = 1.0;
      this.activeAudio = audio;

      audio.onplay = () => {
        if (this.activeAudio === audio) {
          this.updateState({ isPlaying: true, isLoading: false });
        }
        onStart?.();
      };

      audio.onended = () => {
        if (this.activeAudio === audio) {
          this.activeAudio = null;
          this.updateState({
            isPlaying: false,
            isLoading: false,
            activeCharacter: null,
            currentText: null,
          });
        }
        onEnd?.();
      };

      audio.onerror = (e) => {
        if (this.activeAudio === audio) {
          this.activeAudio = null;
          this.updateState({
            isPlaying: false,
            isLoading: false,
            error: null,
          });
        }
        // Fallback to SpeechSynthesis if audio element cannot load the source
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(trimmed);
            utterance.rate = character.toLowerCase() === "guard" ? 1.05 : 0.95;
            utterance.pitch = character.toLowerCase() === "guard" ? 0.8 : 1.1;
            utterance.onstart = () => {
              this.updateState({ isPlaying: true, isLoading: false });
              onStart?.();
            };
            utterance.onend = () => {
              this.updateState({ isPlaying: false, isLoading: false, activeCharacter: null, currentText: null });
              onEnd?.();
            };
            window.speechSynthesis.speak(utterance);
            return;
          } catch (speechErr) {}
        }
        onError?.(e);
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
              utterance.rate = character.toLowerCase() === "guard" ? 1.05 : 0.95;
              utterance.pitch = character.toLowerCase() === "guard" ? 0.8 : 1.1;
              utterance.onstart = () => {
                this.updateState({ isPlaying: true, isLoading: false });
                onStart?.();
              };
              utterance.onend = () => {
                this.updateState({ isPlaying: false, isLoading: false, activeCharacter: null, currentText: null });
                onEnd?.();
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
        console.warn("Character dialogue playback warning:", err);
      }
      this.updateState({
        isPlaying: false,
        isLoading: false,
        error: null,
      });
      onError?.(err);
      return null;
    }
  }
}

export const characterVoice = new CharacterVoiceManager();

export const playCharacterDialogue = (options: CharacterDialogueOptions) =>
  characterVoice.playCharacterDialogue(options);

export const stopCharacterDialogue = () =>
  characterVoice.stopCharacterDialogue();
