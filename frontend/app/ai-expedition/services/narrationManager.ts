export type NarrationType =
  | "CRITICAL"
  | "SCENE_INTRO"
  | "OBJECTIVE"
  | "DIALOGUE"
  | "PUZZLE"
  | "INSIGHT"
  | "EVIDENCE"
  | "INFO";

export type NarrationLifecycleState =
  | "IDLE"
  | "QUEUED"
  | "GENERATING"
  | "READY"
  | "PLAYING"
  | "CANCELLING"
  | "CANCELLED"
  | "COMPLETED"
  | "ERROR";

export interface NarrationOptions {
  key?: string;
  priority?: number;
  type?: NarrationType;
  forceRepeat?: boolean;
  sceneId?: string;
}

interface QueuedItem {
  key: string;
  text: string;
  priority: number;
  type: NarrationType;
  sceneId?: string;
  generation: number;
}

const PRIORITY_MAP: Record<NarrationType, number> = {
  CRITICAL: 100,
  SCENE_INTRO: 80,
  OBJECTIVE: 60,
  DIALOGUE: 50,
  PUZZLE: 40,
  INSIGHT: 30,
  EVIDENCE: 20,
  INFO: 10
};

export class NarrationManager {
  private static instance: NarrationManager;
  private enabled: boolean = true;
  private currentAudio: HTMLAudioElement | null = null; // Single persistent HTMLAudioElement owned by NarrationManager
  private currentGeneration: number = 0; // Monotonically increasing generation counter
  private activeRequestId: string | null = null;
  private activeSceneId: string = "scene_1";
  private activeAbortController: AbortController | null = null;
  private activeObjectUrl: string | null = null;

  private spokenKeys: Set<string> = new Set();
  private audioCache: Map<string, string> = new Map(); // Session memory cache for Object URLs
  private inFlightRequests: Map<string, Promise<string>> = new Map(); // In-flight request deduplication map
  private queue: QueuedItem[] = [];
  private currentItem: QueuedItem | null = null;
  private currentState: NarrationLifecycleState = "IDLE";
  private listeners: Set<
    (state: NarrationLifecycleState, isSpeaking: boolean, currentKey?: string, text?: string, isUnavailable?: boolean) => void
  > = new Set();
  private isProcessing: boolean = false;
  private isUnavailable: boolean = false;
  private isUnlocked: boolean = false;

  private constructor() {
    if (typeof window !== "undefined") {
      this.currentAudio = new Audio();
      this.currentAudio.preload = "auto";
      this.currentAudio.volume = 1.0;
      this.currentAudio.muted = false;

      const handleUserGesture = () => {
        this.unlockAudio();
      };
      window.addEventListener("click", handleUserGesture, { capture: true, passive: true });
      window.addEventListener("pointerdown", handleUserGesture, { capture: true, passive: true });
      window.addEventListener("keydown", handleUserGesture, { capture: true, passive: true });
      window.addEventListener("touchstart", handleUserGesture, { capture: true, passive: true });
    }
  }

  public static getInstance(): NarrationManager {
    if (!NarrationManager.instance) {
      NarrationManager.instance = new NarrationManager();
    }
    return NarrationManager.instance;
  }

  public setSceneId(sceneId: string): void {
    this.activeSceneId = sceneId;
  }

  public getSceneId(): string {
    return this.activeSceneId;
  }

  public getGeneration(): number {
    return this.currentGeneration;
  }

  public getActiveRequestId(): string | null {
    return this.activeRequestId;
  }

  public unlockAudio(): void {
    if (typeof window === "undefined" || !this.currentAudio) return;

    if (!this.isUnlocked) {
      try {
        const silentDataUri = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
        this.currentAudio.preload = "auto";
        this.currentAudio.volume = 1.0;
        this.currentAudio.muted = false;
        this.currentAudio.src = silentDataUri;
        const p = this.currentAudio.play();
        if (p !== undefined) {
          p.then(() => {
            if (this.currentAudio) {
              this.currentAudio.pause();
              this.currentAudio.currentTime = 0;
            }
            this.isUnlocked = true;
            const isSafari = navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome");
            console.log(`[AUDIO UNLOCK] Browser=${isSafari ? "Safari" : "Chromium"} Granted=true`);
          }).catch((err) => {
            console.warn("[AUDIO UNLOCK FAILED]", err);
          });
        }
      } catch (err) {
        console.warn("[AUDIO UNLOCK EXCEPTION]", err);
      }
    } else {
      if (this.currentAudio.paused && this.currentState === "PLAYING") {
        this.currentAudio.play().catch((err) => {
          console.warn("[SARVAM NARRATOR] Audio resume on unlock failed:", err);
        });
      }
    }

    if (!this.currentItem && this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Synchronously stops active audio, invalidates generation counter, clears handlers, and revokes URLs.
   */
  public stopCurrentNarration(reason: string = "explicit-stop"): void {
    if (this.currentItem?.type === "EVIDENCE" || this.currentItem?.key.startsWith("evidence_")) {
      console.log(`[PRIMARY SOURCE AUDIO STOP] id="${this.currentItem.key}" reason="${reason}"`);
    }
    this.currentGeneration += 1;
    const newGen = this.currentGeneration;
    console.log(`[NARRATOR STOP] Reason: "${reason}" | New Generation: ${newGen}`);

    // Abort pending fetch request if active
    if (this.activeAbortController) {
      try {
        this.activeAbortController.abort();
      } catch (err) {
        console.warn("[SARVAM NARRATOR] AbortController error:", err);
      }
      this.activeAbortController = null;
    }

    // Pause and reset single HTMLAudioElement synchronously
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onplay = null;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
      } catch (err) {
        console.warn("[SARVAM NARRATOR] Audio pause error:", err);
      }
    }

    // Revoke transient Object URL if active
    if (this.activeObjectUrl) {
      try {
        URL.revokeObjectURL(this.activeObjectUrl);
      } catch {
        // Ignore revocation error
      }
      this.activeObjectUrl = null;
    }

    this.currentItem = null;
    this.activeRequestId = null;
    this.isProcessing = false;
    this.setState("CANCELLED");
    this.setState("IDLE");
  }

  /**
   * Called at the start of scene transition to immediately cancel old scene audio & clear old scene queue items.
   */
  public cancelForSceneTransition(targetSceneId: string): void {
    console.log(`[NARRATOR SCENE TRANSITION] Target Scene: "${targetSceneId}" | Previous Scene: "${this.activeSceneId}"`);
    this.activeSceneId = targetSceneId;
    this.stopCurrentNarration(`scene-transition-to-${targetSceneId}`);
    // Clear queued items belonging to old scenes
    this.queue = this.queue.filter((item) => !item.sceneId || item.sceneId === targetSceneId);
  }

  /**
   * Phase A: Prepare (Preload) Narration Audio.
   * Checks session memory cache first. If missing, sends single deduplicated HTTP request.
   * Resolves when Object URL is READY for instant playback.
   */
  public async prepareNarration(
    arg1: string,
    arg2?: string | (NarrationOptions & { key?: string }),
    arg3: NarrationOptions = {}
  ): Promise<{ prepared: boolean; key: string; url?: string }> {
    if (!this.enabled || !arg1 || this.isUnavailable) {
      return { prepared: false, key: "" };
    }

    let key: string;
    let text: string;
    let options: NarrationOptions = {};

    if (typeof arg2 === "string") {
      key = arg1;
      text = arg2;
      options = arg3;
    } else {
      text = arg1;
      options = arg2 || {};
      key = options.key || `speech_${text.slice(0, 30)}`;
    }

    const cleanedText = this.sanitizeText(text);
    if (!cleanedText) return { prepared: false, key };

    const t0 = performance.now();

    // 1. Memory Cache Hit check
    let objectUrl = this.audioCache.get(key);
    if (objectUrl) {
      const tReady = (performance.now() - t0).toFixed(1);
      console.log(`[NARRATION TIMING] event="${options.type || 'INFO'}" scene="${options.sceneId || this.activeSceneId}" cacheHit=true requestMs=0.0ms decodeMs=0.0ms readyMs=${tReady}ms visualToAudioMs=0.0ms`);
      return { prepared: true, key, url: objectUrl };
    }

    // 2. In-flight request deduplication check
    if (this.inFlightRequests.has(key)) {
      try {
        objectUrl = await this.inFlightRequests.get(key)!;
        return { prepared: Boolean(objectUrl), key, url: objectUrl };
      } catch {
        return { prepared: false, key };
      }
    }

    // 3. Perform Sarvam fetch request with timing instrumentation
    const fetchPromise = (async () => {
      const tFetchStart = performance.now();
      const res = await fetch("/api/ai-expedition/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText })
      });

      const tFetchEnd = performance.now();
      if (!res.ok) {
        throw new Error(`Sarvam TTS Server API error ${res.status}`);
      }

      const blob = await res.blob();
      const tDecodeEnd = performance.now();

      const url = URL.createObjectURL(blob);
      this.audioCache.set(key, url);

      const requestMs = (tFetchEnd - tFetchStart).toFixed(1);
      const decodeMs = (tDecodeEnd - tFetchEnd).toFixed(1);
      const readyMs = (tDecodeEnd - t0).toFixed(1);

      console.log(`[NARRATION TIMING] event="${options.type || 'INFO'}" scene="${options.sceneId || this.activeSceneId}" cacheHit=false requestMs=${requestMs}ms decodeMs=${decodeMs}ms readyMs=${readyMs}ms visualToAudioMs=0.0ms`);

      return url;
    })();

    this.inFlightRequests.set(key, fetchPromise);

    try {
      objectUrl = await fetchPromise;
      this.inFlightRequests.delete(key);
      return { prepared: Boolean(objectUrl), key, url: objectUrl };
    } catch (err) {
      this.inFlightRequests.delete(key);
      console.warn(`[NARRATOR PREPARE EXCEPTION] Key: "${key}"`, err);
      return { prepared: false, key };
    }
  }

  /**
   * Background preload for next likely narration (fire and forget).
   */
  public preloadNext(
    arg1: string,
    arg2?: string | (NarrationOptions & { key?: string }),
    arg3: NarrationOptions = {}
  ): void {
    this.prepareNarration(arg1, arg2, arg3).catch(() => {});
  }

  /**
   * Preload-First lifecycle helper for Primary Source / Evidence / Codex modals.
   * Synchronously unlocks audio engine, prepares audio, logs timing diagnostics,
   * then commits visual modal and plays narration simultaneously.
   */
  public async openEvidenceWithAudio<T extends { id: string; title: string; description: string; historicalFact?: string }>(
    evidenceItem: T,
    onReadyToCommit: (ev: T) => void
  ): Promise<void> {
    const evId = evidenceItem.id;
    console.log(`[PRIMARY SOURCE OPEN] id="${evId}"`);
    console.log(`[PRIMARY SOURCE AUDIO PREPARE] id="${evId}"`);

    // Synchronously unlock audio engine & stop any stale narration
    this.unlockAudio();
    this.stopCurrentNarration(`open-evidence-${evId}`);

    const evKey = `evidence_${evId}`;
    const evText = `Primary Source Evidence. ${evidenceItem.title}. ${evidenceItem.description}. ${evidenceItem.historicalFact || ""}`;

    const t0 = performance.now();
    const cacheHit = this.audioCache.has(evKey);
    console.log(`[PRIMARY SOURCE OPEN] id="${evId}" cacheHit=${cacheHit}`);

    let prepared = false;
    try {
      const timeoutPromise = new Promise<{ prepared: boolean; key: string }>((resolve) => {
        setTimeout(() => resolve({ prepared: false, key: evKey }), 2500);
      });
      const prepRes = await Promise.race([
        this.prepareNarration(evKey, evText, { type: "EVIDENCE", priority: 20 }),
        timeoutPromise
      ]);
      prepared = prepRes.prepared;
    } catch (err) {
      console.warn(`[PRIMARY SOURCE AUDIO PREPARE ERROR] id="${evId}"`, err);
    }

    const latencyMs = (performance.now() - t0).toFixed(1);
    console.log(`[PRIMARY SOURCE AUDIO READY] id="${evId}" latencyMs=${latencyMs}ms prepared=${prepared}`);

    // Commit visual modal & start narration playback simultaneously
    onReadyToCommit(evidenceItem);
    console.log(`[PRIMARY SOURCE AUDIO PLAY] id="${evId}"`);
    this.narrate(evKey, evText, { type: "EVIDENCE", priority: 20 });
  }

  public sanitizeText(text: string): string {
    if (!text) return "";
    let clean = text;

    clean = clean.replace(/\bE\.?I\.?C\.?\b/gi, "East India Company");
    clean = clean.replace(/\bB\.?C\.?E\.?\b/gi, "Before Common Era");
    clean = clean.replace(/\bC\.?E\.?\b/gi, "Common Era");
    clean = clean.replace(/\bvs\.?\b/gi, "versus");
    clean = clean.replace(/\bNo\.?\b/gi, "number");
    clean = clean.replace(/1757/g, "seventeen fifty-seven");

    clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
    clean = clean.replace(/\*([^*]+)\*/g, "$1");
    clean = clean.replace(/_([^_]+)_/g, "$1");
    clean = clean.replace(/`([^`]+)`/g, "$1");

    clean = clean.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "");
    clean = clean.replace(/[📜🔎✨✋💡🎯⚔️👑⚖️📜]/g, "");

    clean = clean.replace(/\s+/g, " ").trim();

    return clean;
  }

  public narrate(
    arg1: string,
    arg2?: string | (NarrationOptions & { key?: string }),
    arg3: NarrationOptions = {}
  ): boolean {
    if (!this.enabled || !arg1 || this.isUnavailable) return false;

    let key: string;
    let text: string;
    let options: NarrationOptions = {};

    if (typeof arg2 === "string") {
      key = arg1;
      text = arg2;
      options = arg3;
    } else {
      text = arg1;
      options = arg2 || {};
      key = options.key || `speech_${text.slice(0, 30)}`;
    }

    if (!options.forceRepeat && this.spokenKeys.has(key)) {
      return false; // Deduplicated
    }

    const cleanedText = this.sanitizeText(text);
    if (!cleanedText) return false;

    const type = options.type || "INFO";
    const priority = options.priority !== undefined ? options.priority : PRIORITY_MAP[type];
    const itemSceneId = options.sceneId || this.activeSceneId;

    const newItem: QueuedItem = {
      key,
      text: cleanedText,
      priority,
      type,
      sceneId: itemSceneId,
      generation: this.currentGeneration
    };

    this.spokenKeys.add(key);

    // If higher priority item comes in while speaking lower priority, interrupt immediately
    if (this.currentItem && newItem.priority > this.currentItem.priority) {
      this.stopCurrentNarration(`priority-interrupt-${newItem.priority}`);
      this.queue.unshift(newItem);
      this.processQueue();
      return true;
    }

    // Insert into priority queue in descending order
    this.queue.push(newItem);
    this.queue.sort((a, b) => b.priority - a.priority);

    this.processQueue();
    return true;
  }

  private async processQueue(): Promise<void> {
    if (!this.enabled || this.currentItem || this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const item = this.queue.shift();
    if (!item) {
      this.isProcessing = false;
      return;
    }

    // Filter out stale generation or stale scene items
    if (item.generation !== this.currentGeneration || (item.sceneId && item.sceneId !== this.activeSceneId)) {
      console.log(`[NARRATOR DISCARD STALE QUEUE ITEM] Key: "${item.key}" | Item Gen: ${item.generation} vs Current Gen: ${this.currentGeneration} | Item Scene: "${item.sceneId}" vs Active Scene: "${this.activeSceneId}"`);
      this.isProcessing = false;
      this.processQueue();
      return;
    }

    const requestGen = this.currentGeneration;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.activeRequestId = requestId;
    this.currentItem = item;
    this.setState("GENERATING");

    const controller = new AbortController();
    this.activeAbortController = controller;

    try {
      let objectUrl = this.audioCache.get(item.key);

      if (!objectUrl) {
        // Request Sarvam AI TTS binary audio via server API route
        const res = await fetch("/api/ai-expedition/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: item.text }),
          signal: controller.signal
        });

        // VERIFY GENERATION & REQUEST ID AFTER FETCH
        if (requestGen !== this.currentGeneration || this.activeRequestId !== requestId) {
          if (item.type === "EVIDENCE" || item.key.startsWith("evidence_")) {
            console.log(`[STALE PRIMARY SOURCE AUDIO DISCARDED] id="${item.key}"`);
          }
          console.log(`[NARRATOR DISCARD STALE FETCH RESPONSE] RequestId: "${requestId}" | Key: "${item.key}"`);
          this.isProcessing = false;
          return;
        }

        if (!res.ok) {
          throw new Error(`Sarvam TTS Server API error ${res.status}`);
        }

        const blob = await res.blob();

        // VERIFY GENERATION & REQUEST ID AFTER BLOB DECODE
        if (requestGen !== this.currentGeneration || this.activeRequestId !== requestId) {
          if (item.type === "EVIDENCE" || item.key.startsWith("evidence_")) {
            console.log(`[STALE PRIMARY SOURCE AUDIO DISCARDED] id="${item.key}"`);
          }
          console.log(`[NARRATOR DISCARD STALE BLOB DECODE] RequestId: "${requestId}" | Key: "${item.key}"`);
          this.isProcessing = false;
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        this.audioCache.set(item.key, objectUrl);
      }

      // VERIFY GENERATION BEFORE PLAYBACK
      if (requestGen !== this.currentGeneration || this.activeRequestId !== requestId) {
        if (item.type === "EVIDENCE" || item.key.startsWith("evidence_")) {
          console.log(`[STALE PRIMARY SOURCE AUDIO DISCARDED] id="${item.key}"`);
        }
        console.log(`[NARRATOR DISCARD STALE PLAYBACK] RequestId: "${requestId}" | Key: "${item.key}"`);
        this.isProcessing = false;
        return;
      }

      this.activeObjectUrl = objectUrl;
      this.setState("READY");

      if (!this.currentAudio) {
        this.currentAudio = new Audio();
      }

      const audio = this.currentAudio;
      audio.preload = "auto";
      audio.volume = 1.0;
      audio.muted = false;
      audio.src = objectUrl;
      audio.playbackRate = 0.95;
      audio.load();

      // Audio Readiness Check before play()
      if (audio.readyState < 2) {
        await new Promise<void>((resolve) => {
          let resolved = false;
          const onCanPlay = () => {
            if (!resolved) {
              resolved = true;
              audio.removeEventListener("canplay", onCanPlay);
              audio.removeEventListener("canplaythrough", onCanPlay);
              resolve();
            }
          };
          audio.addEventListener("canplay", onCanPlay, { once: true });
          audio.addEventListener("canplaythrough", onCanPlay, { once: true });
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              audio.removeEventListener("canplay", onCanPlay);
              audio.removeEventListener("canplaythrough", onCanPlay);
              resolve();
            }
          }, 400);
        });
      }

      audio.onplay = () => {
        if (requestGen !== this.currentGeneration || this.activeRequestId !== requestId) {
          try {
            audio.pause();
          } catch {
            // Ignore
          }
          return;
        }
        this.isProcessing = false;
        this.setState("PLAYING");
        console.log(`[NARRATOR START] RequestId: "${requestId}" | Scene: "${item.sceneId || this.activeSceneId}" | Gen: ${requestGen} | Key: "${item.key}"`);
      };

      audio.onended = () => {
        if (requestGen !== this.currentGeneration || this.activeRequestId !== requestId) {
          console.log(`[NARRATOR DISCARD STALE ONENDED] RequestId: "${requestId}"`);
          return;
        }
        console.log(`[NARRATOR COMPLETE] RequestId: "${requestId}" | Key: "${item.key}"`);
        this.currentItem = null;
        this.activeRequestId = null;
        this.activeAbortController = null;
        this.isProcessing = false;
        this.setState("COMPLETED");
        this.setState("IDLE");
        this.processQueue();
      };

      audio.onerror = (e) => {
        if (requestGen !== this.currentGeneration || this.activeRequestId !== requestId) {
          return;
        }
        console.warn(`[NARRATOR ERROR] RequestId: "${requestId}" | Error:`, e);
        this.currentItem = null;
        this.activeRequestId = null;
        this.activeAbortController = null;
        this.isProcessing = false;
        this.setState("ERROR");
        this.setState("IDLE");
        setTimeout(() => this.processQueue(), 50);
      };

      await audio.play();

    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort || requestGen !== this.currentGeneration || this.activeRequestId !== requestId) {
        console.log(`[NARRATOR ABORTED / STALE DISCARD] Key: "${item.key}"`);
        this.isProcessing = false;
        return;
      }

      const isNotAllowed = err instanceof Error && (err.name === "NotAllowedError" || err.message.includes("not allowed"));
      if (isNotAllowed) {
        console.warn("[AUDIO PLAYBACK BLOCKED BY BROWSER POLICY] Tap HEAR to enable narration", err);
        this.isUnavailable = true;
        this.currentItem = null;
        this.activeRequestId = null;
        this.activeAbortController = null;
        this.isProcessing = false;
        this.setState("ERROR");
        this.setState("IDLE");
        return;
      }

      console.warn("[SARVAM NARRATOR EXCEPTION]", err);
      this.currentItem = null;
      this.activeRequestId = null;
      this.activeAbortController = null;
      this.isProcessing = false;
      this.setState("ERROR");
      this.setState("IDLE");
      setTimeout(() => this.processQueue(), 50);
    }
  }

  public stop(): void {
    this.queue = [];
    this.stopCurrentNarration("user-stop");
  }

  public pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  public resume(): void {
    if (this.currentAudio && this.currentAudio.paused && this.currentState === "PLAYING") {
      this.currentAudio.play().catch(console.warn);
    }
  }

  public clearQueue(): void {
    this.queue = [];
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public isSpeaking(): boolean {
    return this.currentState === "PLAYING" || Boolean(this.currentAudio && !this.currentAudio.paused);
  }

  public getCurrentState(): NarrationLifecycleState {
    return this.currentState;
  }

  public getCurrentKey(): string | undefined {
    return this.currentItem?.key;
  }

  public getCurrentText(): string | undefined {
    return this.currentItem?.text;
  }

  public resetSpokenKeys(): void {
    this.spokenKeys.clear();
  }

  public onStateChange(
    listener: (state: NarrationLifecycleState, isSpeaking: boolean, currentKey?: string, text?: string, isUnavailable?: boolean) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(state: NarrationLifecycleState): void {
    this.currentState = state;
    const isSpeaking = state === "PLAYING" || Boolean(this.currentAudio && !this.currentAudio.paused);
    this.notifyListeners(state, isSpeaking, this.currentItem?.key, this.currentItem?.text, this.isUnavailable);
  }

  private notifyListeners(
    state: NarrationLifecycleState,
    isSpeaking: boolean,
    currentKey?: string,
    text?: string,
    isUnavailable: boolean = false
  ): void {
    this.listeners.forEach((fn) => {
      try {
        fn(state, isSpeaking, currentKey, text, isUnavailable);
      } catch (e) {
        console.warn("[SARVAM NARRATOR] Listener error:", e);
      }
    });
  }
}

export const narrationManager = NarrationManager.getInstance();
