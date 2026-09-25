import fs from "fs";
import path from "path";

export interface NarrationAudioStore {
  exists(cacheKey: string): Promise<boolean>;
  get(cacheKey: string): Promise<Buffer | null>;
  getPublicUrl(cacheKey: string): string;
  put(cacheKey: string, audioBuffer: Buffer, contentType?: string): Promise<string>;
}

/**
 * Validates MD5 hash cache key to prevent path traversal attacks.
 */
export function sanitizeCacheKey(key: string): string {
  const clean = key.replace(/[^a-f0-9]/gi, "");
  if (clean.length !== 32) {
    throw new Error(`Invalid audio cache key format: "${key}"`);
  }
  return clean.toLowerCase();
}

/**
 * Local filesystem storage adapter (used ONLY in local development environments).
 */
export class LocalDiskAudioStore implements NarrationAudioStore {
  private cacheDir: string;

  constructor(customDir?: string) {
    this.cacheDir = customDir || path.join(process.cwd(), "public", "audio_cache");
    if (typeof window === "undefined") {
      try {
        if (!fs.existsSync(this.cacheDir)) {
          fs.mkdirSync(this.cacheDir, { recursive: true });
        }
      } catch (err) {
        console.warn("[LocalDiskAudioStore] Failed to initialize directory:", err);
      }
    }
  }

  public async exists(cacheKey: string): Promise<boolean> {
    const safeKey = sanitizeCacheKey(cacheKey);
    const filepath = path.join(this.cacheDir, `sarvam_${safeKey}.wav`);
    try {
      return fs.existsSync(filepath) && fs.statSync(filepath).size > 100;
    } catch {
      return false;
    }
  }

  public async get(cacheKey: string): Promise<Buffer | null> {
    const safeKey = sanitizeCacheKey(cacheKey);
    const filepath = path.join(this.cacheDir, `sarvam_${safeKey}.wav`);
    try {
      if (await this.exists(safeKey)) {
        return fs.readFileSync(filepath);
      }
    } catch (err) {
      console.warn(`[LocalDiskAudioStore] Failed to read key="${safeKey}":`, err);
    }
    return null;
  }

  public getPublicUrl(cacheKey: string): string {
    const safeKey = sanitizeCacheKey(cacheKey);
    return `/audio_cache/sarvam_${safeKey}.wav`;
  }

  public async put(cacheKey: string, audioBuffer: Buffer): Promise<string> {
    const safeKey = sanitizeCacheKey(cacheKey);
    const filename = `sarvam_${safeKey}.wav`;
    const filepath = path.join(this.cacheDir, filename);

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    const tempPath = `${filepath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempPath, audioBuffer);
    fs.renameSync(tempPath, filepath);

    return this.getPublicUrl(safeKey);
  }
}

/**
 * Production Persistent Cloud / Object Storage Adapter (S3 / Blob compatible).
 * Ensures generated audio survives container restarts, serverless scaling, and deployments.
 */
export class PersistentCloudAudioStore implements NarrationAudioStore {
  private bucket: string;
  private endpoint: string;

  constructor(bucket: string, endpoint?: string) {
    this.bucket = bucket;
    this.endpoint = endpoint || `https://${bucket}.s3.amazonaws.com`;
  }

  public getBucketName(): string {
    return this.bucket;
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  public async exists(cacheKey: string): Promise<boolean> {
    const safeKey = sanitizeCacheKey(cacheKey);
    const url = this.getPublicUrl(safeKey);
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async get(cacheKey: string): Promise<Buffer | null> {
    const safeKey = sanitizeCacheKey(cacheKey);
    const url = this.getPublicUrl(safeKey);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    } catch (err) {
      console.warn(`[PersistentCloudAudioStore] Failed to fetch key="${safeKey}":`, err);
    }
    return null;
  }

  public getPublicUrl(cacheKey: string): string {
    const safeKey = sanitizeCacheKey(cacheKey);
    return `${this.endpoint}/audio_cache/sarvam_${safeKey}.wav`;
  }

  public async put(cacheKey: string, audioBuffer: Buffer): Promise<string> {
    const safeKey = sanitizeCacheKey(cacheKey);
    const url = this.getPublicUrl(safeKey);

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString()
      },
      body: new Uint8Array(audioBuffer)
    });

    if (!res.ok) {
      throw new Error(`[PersistentCloudAudioStore] Cloud storage upload failed with status ${res.status}`);
    }

    return url;
  }
}

let cachedEngine: NarrationAudioStore | null = null;

/**
 * Production-Safe Factory returning appropriate storage engine.
 * Lazy initialization avoids build-time evaluation failures during `next build`.
 * - In Development: returns LocalDiskAudioStore using public/audio_cache/.
 * - In Production: checks for persistent cloud/path configuration. If missing at runtime, FAILS CLEARLY.
 */
export function getAudioStorageEngine(): NarrationAudioStore {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    const bucket = process.env.AUDIO_STORAGE_BUCKET || process.env.AWS_S3_BUCKET;
    const persistentPath = process.env.AUDIO_STORAGE_PATH;
    const endpoint = process.env.AUDIO_STORAGE_ENDPOINT;

    if (bucket) {
      return new PersistentCloudAudioStore(bucket, endpoint);
    }
    if (persistentPath) {
      return new LocalDiskAudioStore(persistentPath);
    }

    // Fail clearly in production if persistent cloud storage is unconfigured
    throw new Error(
      "[PRODUCTION STORAGE ERROR] Persistent narration storage is not configured for production. " +
      "Configure AUDIO_STORAGE_BUCKET or AUDIO_STORAGE_PATH environment variables."
    );
  }
  return new LocalDiskAudioStore();
}

/**
 * Proxy AudioStore providing lazy resolution at request time.
 */
export const defaultAudioStore: NarrationAudioStore = {
  async exists(cacheKey: string) {
    if (!cachedEngine) cachedEngine = getAudioStorageEngine();
    return cachedEngine.exists(cacheKey);
  },
  async get(cacheKey: string) {
    if (!cachedEngine) cachedEngine = getAudioStorageEngine();
    return cachedEngine.get(cacheKey);
  },
  getPublicUrl(cacheKey: string) {
    if (!cachedEngine) cachedEngine = getAudioStorageEngine();
    return cachedEngine.getPublicUrl(cacheKey);
  },
  async put(cacheKey: string, audioBuffer: Buffer, contentType?: string) {
    if (!cachedEngine) cachedEngine = getAudioStorageEngine();
    return cachedEngine.put(cacheKey, audioBuffer, contentType);
  }
};
