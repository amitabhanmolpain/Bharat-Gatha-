import assert from "assert";
import { getVoiceForNPC } from "../services/narrationManager";
import { sanitizeCacheKey, PersistentCloudAudioStore } from "../services/audioStore";

console.log("[TEST] Running AI Expedition Audio & Narration Unit Tests...");

// 1. Safe NPC Voice Lookup Tests (Phase 5)
{
  assert.strictEqual(getVoiceForNPC("char_clive"), "aditya", "Robert Clive must map to aditya");
  assert.strictEqual(getVoiceForNPC("char_siraj"), "kabir", "Siraj-ud-Daulah must map to kabir");
  assert.strictEqual(getVoiceForNPC("char_bengal_merchant"), "shreya", "Bengal Merchant must map to shreya");
  assert.strictEqual(getVoiceForNPC("unknown_npc"), "ratan", "Unknown NPC must fall back to ratan");

  // Prototype pollution safety tests
  assert.strictEqual(getVoiceForNPC("__proto__"), "ratan", "__proto__ input must return fallback speaker");
  assert.strictEqual(getVoiceForNPC("constructor"), "ratan", "constructor input must return fallback speaker");
  assert.strictEqual(getVoiceForNPC("toString"), "ratan", "toString input must return fallback speaker");
  console.log("✓ Phase 5: Safe NPC Voice Lookup Tests Passed.");
}

// 2. Cache Key Sanitization Tests (Phase 15)
{
  const validKey = "6eeee011ee82c05be00d83ab27912f4e";
  assert.strictEqual(sanitizeCacheKey(validKey), validKey, "Valid 32-char hex key must pass unchanged");

  assert.throws(() => {
    sanitizeCacheKey("../../../etc/passwd");
  }, /Invalid audio cache key format/, "Path traversal attack string must be rejected");

  assert.throws(() => {
    sanitizeCacheKey("short_key");
  }, /Invalid audio cache key format/, "Non-32 char key must be rejected");
  console.log("✓ Phase 15: Cache Key Sanitization Tests Passed.");
}

// 3. Persistent Audio Store Tests (Phase 2 & Phase 18)
{
  const store = new PersistentCloudAudioStore("test-bucket", "https://storage.test.com");
  const testKey = "11111111222222223333333344444444";
  const url = store.getPublicUrl(testKey);

  assert.strictEqual(url, "https://storage.test.com/audio_cache/sarvam_11111111222222223333333344444444.wav");
  console.log("✓ Phase 2 & 18: Persistent Cloud Audio Store Tests Passed.");
}

// 4. Voice Cache Collision & Speaker Isolation Tests (Phase 3)
{
  const text = "Halt! State your business.";
  const keyAditya = `aditya:${text}`;
  const keyKabir = `kabir:${text}`;

  assert.notStrictEqual(keyAditya, keyKabir, "Same text with different speakers must produce distinct cache keys");
  console.log("✓ Phase 3: Absolute Voice-Cache Isolation Tests Passed.");
}

console.log("✅ ALL AI EXPEDITION UNIT TESTS PASSED SUCCESSFULLY.");
