/**
 * Visual Cache System — Bharat Gatha AI Historical Expedition
 *
 * Persists visual scene backgrounds via In-Memory Map & IndexedDB.
 * Completely eliminates LocalStorage QuotaExceededError by keeping
 * multi-megabyte base64/blob image strings outside LocalStorage.
 */

import { storeImagePayload, getImagePayload, getImagePayloadSync } from "./imageStorage";

export function generateSceneHash(
  historicalPeriod: string,
  region: string,
  archetype: string,
  architectureStyle: string
): string {
  const raw = `${historicalPeriod}:${region}:${archetype}:${architectureStyle}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `vcache-${Math.abs(hash).toString(36)}`;
}

export function getCachedVisualUrl(hashKey: string): string | null {
  return getImagePayloadSync(hashKey);
}

export async function getCachedVisualUrlAsync(hashKey: string): Promise<string | null> {
  return await getImagePayload(hashKey);
}

export function setCachedVisualUrl(hashKey: string, imageUrl: string): void {
  if (!hashKey || !imageUrl) return;
  // Store asynchronously in IndexedDB and memory cache without blocking
  storeImagePayload(hashKey, imageUrl).catch((err) => {
    console.warn("Failed to persist cached visual image payload:", err);
  });
}
