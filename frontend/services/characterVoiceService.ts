/**
 * Character Voice & Dialogue Service for Bharat Gatha Game.
 *
 * Dedicated to character dialogues (Jolly Bhai & Mughal Guards).
 * Plays pre-rendered offline audio files locally and synthesizes dynamic answers.
 */

import { networkService } from "./networkService";

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
  private currentSessionId: number = 0;
  private abortController: AbortController | null = null;
  private lastPlayKey: string | null = null;
  private lastPlayTime: number = 0;

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

  public cacheAudio(character: string, text: string, b64Audio: string): void {
    const key = `${character.toLowerCase()}:${text.toLowerCase().trim()}`;
    this.audioCache.set(key, b64Audio);
  }

  /**
   * Stop any active character dialogue audio immediately.
   */
  public stopCharacterDialogue(): void {
    this.currentSessionId++;
    this.lastPlayKey = null;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.stopCharacterDialogueInternal(true);
  }

  private stopCharacterDialogueInternal(resetState: boolean): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (this.activeAudio) {
      const audioToStop = this.activeAudio;
      this.activeAudio = null;
      try {
        audioToStop.pause();
        audioToStop.currentTime = 0;
        audioToStop.src = "";
      } catch (e) {}
    }
    if (resetState) {
      this.updateState({
        isPlaying: false,
        isLoading: false,
        activeCharacter: null,
        currentText: null,
      });
    }
  }

  /**
   * Resolve appropriate local or cached audio source for character dialogue.
   */
  private resolveAudioSource(character: string, text: string): string | null {
    const char = (character || "").toLowerCase();
    const lower = text.toLowerCase().trim();

    // 1. Guard Local Canonical Pre-recorded Files
    if (char === "guard" || char.includes("sentry")) {
      if (lower.includes("good to go") || lower.includes("you possess the imperial") || lower.includes("step inside the khas mahal") || lower.includes("good you are good to go") || lower.includes("pass through")) {
        return "/guard_khas_pass.wav";
      }
      if (lower.includes("again you ask") || lower.includes("again u ask") || (lower.includes("punished") && lower.includes("question"))) {
        return "/guard_punish_warn.wav";
      }
      if (lower.includes("halt") || lower.includes("not allowed") || lower.includes("khas mahal") || lower.includes("royal clearance") || lower.includes("state your purpose") || lower.includes("strictly off-limits")) {
        return "/guard_khas_halt.wav";
      }
      if (lower.includes("trader") || lower.includes("bazaar") || lower.includes("confidant") || lower.includes("khas of the badshah") || lower.includes("ask one of the trader")) {
        return "/guard_khas_trader_hint.wav";
      }
      if (lower.includes("accha") || lower.includes("qila-e-mubarak") || lower.includes("peacock throne") || lower.includes("chatta chowk") || lower.includes("welcome to the qila") || lower.includes("eyes will be on you")) {
        return "/guard_court_talent.wav";
      }
      if (lower.includes("halt, intruder") || lower.includes("stop right where you stand") || lower.includes("restricted imperial ground") || lower.includes("amar singh gate")) {
        return "/guard_gate_halt.wav";
      }
    }

    // 2. Jolly Local Canonical Pre-recorded Files
    if (char === "jolly" || char.includes("genie")) {
      // Vijay Stambh Carving & Shilpa Drishti Lines
      if (
        lower.includes("some secrets are hiding in these stones") ||
        lower.includes("shilpa drishti and see what the eyes cannot") ||
        lower.includes("see what the eyes cannot")
      ) {
        return "/jolly_vijay_secrets.wav";
      }
      if (
        lower.includes("ancient carved glyphs are hidden") ||
        lower.includes("find the target glyph with your eyes") ||
        lower.includes("find the target glyph")
      ) {
        return "/jolly_vijay_glyphs_hint.wav";
      }
      if (
        (lower.includes("now we have all nine") || lower.includes("have all nine")) &&
        (lower.includes("assemble the sculptor's testament") || lower.includes("sculptor's testament!"))
      ) {
        return "/jolly_vijay_all_nine.wav";
      }
      if (
        (lower.includes("now we have all nine") || lower.includes("have all nine")) &&
        (lower.includes("order is yours to uncover") || lower.includes("the order is yours"))
      ) {
        return "/jolly_vijay_all_nine_v2.wav";
      }
      if (
        lower.includes("something feels out of place") &&
        (lower.includes("match the bedrock to the sky") || lower.includes("bedrock to the sky"))
      ) {
        return "/jolly_vijay_out_of_place.wav";
      }
      if (
        lower.includes("something feels out of place") &&
        (lower.includes("earlier stones were saying") || lower.includes("earlier stones"))
      ) {
        return "/jolly_vijay_earlier_stones.wav";
      }
      if (
        lower.includes("hidden sculptor's testament shines forth") ||
        lower.includes("sculptor's testament shines forth in pure gold") ||
        lower.includes("secret of chittorgarh's master builders is restored") ||
        lower.includes("chittorgarh's master builders is restored")
      ) {
        return "/jolly_vijay_testament_shines.wav";
      }
      if (
        lower.includes("true testament of sutradhara jaita") ||
        lower.includes("testament of sutradhara jaita has been revealed") ||
        lower.includes("sutradhara jaita")
      ) {
        return "/jolly_vijay_jaita_revealed.wav";
      }
      if (
        lower.includes("keep searching the architecture") ||
        lower.includes("match the exact symbol shown on your target card") ||
        lower.includes("target card")
      ) {
        return "/jolly_vijay_target_card.wav";
      }

      // Badal Mahal 3 Lamps & Terrace Lines
      if (
        lower.includes("royal lamps have gone dark") ||
        lower.includes("light all three and bring badal mahal back to life") ||
        lower.includes("bring badal mahal back to life")
      ) {
        return "/jolly_badal_lamps_dark.wav";
      }
      if (
        lower.includes("way to the cloud terrace is shrouded in shadows") ||
        lower.includes("cloud terrace is shrouded in shadows") ||
        lower.includes("light all three royal lamps in the room to continue")
      ) {
        return "/jolly_badal_cloud_terrace.wav";
      }
      if (
        lower.includes("two lamps glowing") ||
        lower.includes("just one more")
      ) {
        return "/jolly_badal_two_lamps.wav";
      }
      if (
        lower.includes("badal mahal shines again") ||
        lower.includes("wah, mere aaka! badal mahal shines again")
      ) {
        return "/jolly_badal_shines_again.wav";
      }

      // Kuldhara & Rajputana Canonical Lines
      if (lower.includes("kuldhara wasn't alone") || lower.includes("83 nearby villages") || lower.includes("abandoned together") || lower.includes("biggest mystery")) {
        return "/kuldhara_84_villages_genie.wav";
      }
      if (
        lower.includes("severe drought") ||
        lower.includes("salim singh") ||
        lower.includes("why did 84 villages") ||
        lower.includes("departed together in a single night") ||
        lower.includes("something doesn't add up") ||
        lower.includes("popular folklore") ||
        lower.includes("weigh the evidence")
      ) {
        return "/jolly_kuldhara_why_abandoned.wav";
      }
      if (
        lower.includes("search the chief's haveli") ||
        lower.includes("grain merchant") ||
        lower.includes("torn tax ledger") ||
        lower.includes("where should i search") ||
        lower.includes("clue is hidden") ||
        lower.includes("vital historical clue") ||
        lower.includes("look sharp") ||
        lower.includes("vital clue is waiting") ||
        lower.includes("water pots were abandoned") ||
        lower.includes("clue alert")
      ) {
        return "/jolly_kuldhara_clues_hint.wav";
      }
      if (lower.includes("trapped in the dungeon") || lower.includes("stucked in the jail") || lower.includes("in the other chamber") || lower.includes("rescue him") || lower.includes("stuck in the jail")) {
        return "/jolly_companion_jail_clue.wav";
      }
      if (lower.includes("door is locked") || lower.includes("oh god") || lower.includes("personal palace") || lower.includes("royal key") || lower.includes("dungeon door")) {
        return "/jolly_dungeon_door_locked.wav";
      }
      if (lower.includes("bazaar traders") || (lower.includes("traders") && lower.includes("taj gate"))) {
        return "/jolly_taj_gate_traders.wav";
      }
      if (lower.includes("golden domes") || lower.includes("bittersweet truth") || lower.includes("pure, solid gold") || lower.includes("shadow of our lost mughal splendour")) {
        return "/jolly_khas_mahal_gold.wav";
      }
      if (lower.includes("jolly bhai") && (lower.includes("born many centuries") || lower.includes("witnessed great wars") || lower.includes("madman"))) {
        return "/jolly_intro.wav";
      }
      if (
        lower.includes("mighty fort of chittorgarh") ||
        (lower.includes("rajputana") && lower.includes("buzurg chacha")) ||
        lower.includes("what wisdom do you seek") ||
        lower.includes("legendary realm of rajputana")
      ) {
        return "/jolly_rajasthan_intro.wav";
      }
    }

    // Buzurg Chacha (Rajasthan elder mentor)
    if (char.includes("chacha") || char.includes("buzurg")) {
      if (lower.includes("mahabharata") || lower.includes("no ordinary board game") || lower.includes("golden goti") || lower.includes("history of chaupar")) {
        return "/buzurg_chacha_chaupar_lore.wav";
      }
      if (
        (lower.includes("khamma ghani") && lower.includes("buzurg chacha")) ||
        lower.includes("keeper of ancient rajput tales") ||
        (lower.includes("khamma ghani") && lower.includes("royal courtyard of chittorgarh"))
      ) {
        return "/buzurg_chacha_intro.wav";
      }
    }

    // 3. Bazaar Traders Pre-recorded Files
    if (char.includes("trader") || char.includes("marble") || char.includes("toy") || char.includes("jewel")) {
      if (lower.includes("buy this pure mughal gold") || lower.includes("only nobles") || lower.includes("ordinary traveller") || lower.includes("buy gold")) {
        return "/trader_khas_arrogant_offer.wav";
      }
      if (lower.includes("wise purchase") || lower.includes("khas confidant") || lower.includes("badshah shah jahan himself") || lower.includes("no ordinary merchant")) {
        return "/trader_khas_boast.wav";
      }
      if (lower.includes("firman") || lower.includes("written permission") || lower.includes("royal seal") || lower.includes("grant you entry") || lower.includes("royal firman")) {
        return "/trader_khas_permission_grant.wav";
      }
      if (lower.includes("marble art") || lower.includes("finest marble")) {
        return "/trader_marble_art.wav";
      }
      if (lower.includes("symbolizes peace") || lower.includes("toys and paintings") || lower.includes("peace")) {
        return "/trader_toys_peace.wav";
      }
    }

    // 4. Caretaker Archaeologist Pre-recorded Files
    if (char.includes("archaeologist") || char.includes("caretaker")) {
      return "/archaeologist_mehtab_bagh.wav";
    }

    return null;
  }

  /**
   * Play character dialogue with 100% reliability.
   * Guaranteed single playback: debounces rapid duplicate calls, cancels stale in-flight fetches,
   * and prevents voice overlapping.
   */
  public async playCharacterDialogue(
    options: CharacterDialogueOptions
  ): Promise<HTMLAudioElement | null> {
    const { character, text, audioUrl, onStart, onEnd, onError } = options;
    const trimmed = (text || "").trim();
    if (!trimmed) return null;

    const charKey = (character || "").toLowerCase().trim();
    const lookupKey = `${charKey}:${trimmed.toLowerCase()}`;
    const now = Date.now();

    // 1. Deduplication guard:
    // If the exact same character and speech was requested within the last 1800ms,
    // or if the service is currently actively playing or loading this exact sentence,
    // ignore the duplicate call.
    if (
      this.lastPlayKey === lookupKey &&
      (now - this.lastPlayTime < 1800 || this.state.isPlaying || this.state.isLoading)
    ) {
      return this.activeAudio;
    }

    this.lastPlayKey = lookupKey;
    this.lastPlayTime = now;

    // 2. Invalidate any in-flight asynchronous operations
    const sessionId = ++this.currentSessionId;
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const currentSignal = this.abortController.signal;

    // 3. Stop currently playing audio or speech synthesis immediately
    this.stopCharacterDialogueInternal(false);

    this.updateState({
      isLoading: true,
      isPlaying: false,
      activeCharacter: character,
      currentText: trimmed,
      error: null,
    });

    try {
      let audioSrc: string | null = null;

      // Check explicit audioUrl or exact canonical local mappings
      if (audioUrl) {
        audioSrc = audioUrl;
      } else {
        audioSrc = this.resolveAudioSource(character, trimmed);
      }

      // If not a static local track, fetch from backend dynamic TTS
      if (!audioSrc) {
        let cachedB64 = this.audioCache.get(lookupKey);

        if (!cachedB64 && networkService.isOnline()) {
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
              signal: currentSignal,
            });

            if (this.currentSessionId !== sessionId) {
              return null;
            }

            if (response.ok) {
              const data = await response.json();
              const b64Data = data.audio || data.audio_base64;
              if (b64Data) {
                cachedB64 = b64Data;
                this.audioCache.set(lookupKey, cachedB64!);
              }
            }
          } catch (fetchErr: any) {
            if (fetchErr?.name === "AbortError") {
              return null;
            }
            console.warn("Character dynamic TTS fetch error:", fetchErr);
          }
        }

        if (this.currentSessionId !== sessionId) {
          return null;
        }

        if (cachedB64) {
          audioSrc = `data:audio/wav;base64,${cachedB64}`;
        }
      }

      if (this.currentSessionId !== sessionId) {
        return null;
      }

      // If not available as audio file, fallback seamlessly to browser speech synthesis
      if (!audioSrc) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            if (this.currentSessionId !== sessionId) return null;

            const utterance = new SpeechSynthesisUtterance(trimmed);
            const isGuard = character.toLowerCase().includes("guard") || character.toLowerCase().includes("sentry");
            const isElder = character.toLowerCase().includes("chacha") || character.toLowerCase().includes("elder");
            utterance.rate = isGuard ? 1.10 : isElder ? 0.92 : 1.05;
            utterance.pitch = isGuard ? 0.85 : isElder ? 0.90 : 1.05;
            utterance.volume = 0.90;

            const voices = window.speechSynthesis.getVoices();
            const inVoice = voices.find(
              (v) =>
                v.lang === "en-IN" ||
                v.lang === "hi-IN" ||
                v.name.toLowerCase().includes("india") ||
                v.name.toLowerCase().includes("rishi") ||
                v.name.toLowerCase().includes("veena") ||
                v.name.toLowerCase().includes("neerja")
            );
            if (inVoice) utterance.voice = inVoice;

            utterance.onstart = () => {
              if (this.currentSessionId === sessionId) {
                this.updateState({ isPlaying: true, isLoading: false });
                onStart?.();
              }
            };
            utterance.onend = () => {
              if (this.currentSessionId === sessionId) {
                this.updateState({ isPlaying: false, isLoading: false, activeCharacter: null, currentText: null });
                onEnd?.();
              }
            };
            utterance.onerror = (e) => {
              if (this.currentSessionId === sessionId) {
                this.updateState({ isPlaying: false, isLoading: false });
                onError?.(e);
              }
            };
            window.speechSynthesis.speak(utterance);
            return null;
          } catch (speechErr) {
            console.warn("Speech synthesis fallback warning:", speechErr);
          }
        }
        this.updateState({ isLoading: false, isPlaying: false });
        return null;
      }

      if (this.currentSessionId !== sessionId) {
        return null;
      }

      // Create and prepare Audio
      const audio = new Audio(audioSrc);
      audio.volume = 0.85;
      this.activeAudio = audio;

      audio.onplay = () => {
        if (this.activeAudio === audio && this.currentSessionId === sessionId) {
          this.updateState({ isPlaying: true, isLoading: false });
          onStart?.();
        }
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
          onEnd?.();
        }
      };

      audio.onerror = (e) => {
        if (this.activeAudio === audio) {
          this.activeAudio = null;
          this.updateState({
            isPlaying: false,
            isLoading: false,
            error: null,
          });
          onError?.(e);
        }
      };

      try {
        await audio.play();
        if (this.currentSessionId !== sessionId) {
          audio.pause();
          audio.src = "";
          return null;
        }
      } catch (playErr: any) {
        if (this.currentSessionId !== sessionId) {
          return null;
        }

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
            if (this.activeAudio === audio && this.currentSessionId === sessionId) {
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
              if (this.currentSessionId !== sessionId) return null;

              const utterance = new SpeechSynthesisUtterance(trimmed);
              const isGuard = character.toLowerCase().includes("guard") || character.toLowerCase().includes("sentry");
              const isElder = character.toLowerCase().includes("chacha") || character.toLowerCase().includes("elder");
              utterance.rate = isGuard ? 1.10 : isElder ? 0.92 : 1.05;
              utterance.pitch = isGuard ? 0.85 : isElder ? 0.90 : 1.05;
              utterance.volume = 0.90;

              const voices = window.speechSynthesis.getVoices();
              const inVoice = voices.find(
                (v) =>
                  v.lang === "en-IN" ||
                  v.lang === "hi-IN" ||
                  v.name.toLowerCase().includes("india") ||
                  v.name.toLowerCase().includes("rishi") ||
                  v.name.toLowerCase().includes("veena") ||
                  v.name.toLowerCase().includes("neerja")
              );
              if (inVoice) utterance.voice = inVoice;

              utterance.onstart = () => {
                if (this.currentSessionId === sessionId) {
                  this.updateState({ isPlaying: true, isLoading: false });
                  onStart?.();
                }
              };
              utterance.onend = () => {
                if (this.currentSessionId === sessionId) {
                  this.updateState({ isPlaying: false, isLoading: false, activeCharacter: null, currentText: null });
                  onEnd?.();
                }
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
      if (this.currentSessionId !== sessionId) {
        return null;
      }
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

export const getCharacterVoiceState = () =>
  characterVoice.getState();

export const subscribeCharacterVoice = (listener: CharacterVoiceListener) =>
  characterVoice.subscribe(listener);

export const cacheCharacterAudio = (character: string, text: string, b64Audio: string) =>
  characterVoice.cacheAudio(character, text, b64Audio);
