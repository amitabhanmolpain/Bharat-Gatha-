import assert from "assert";
import {
  LocalDiskAudioStore,
  PersistentCloudAudioStore,
  getAudioStorageEngine,
  sanitizeCacheKey
} from "../services/audioStore";

console.log("[TEST] Running Audio Store Unit Tests...");

// 1. Cache Key Sanitization Tests
{
  const validKey = "6eeee011ee82c05be00d83ab27912f4e";
  assert.strictEqual(sanitizeCacheKey(validKey), validKey);

  assert.throws(() => {
    sanitizeCacheKey("../../etc/passwd");
  }, /Invalid audio cache key format/);

  assert.throws(() => {
    sanitizeCacheKey("invalid_short_key");
  }, /Invalid audio cache key format/);
  console.log("✓ Cache Key Sanitization Passed.");
}

// 2. Persistent Cloud Store Interface Tests
{
  const cloudStore = new PersistentCloudAudioStore("my-test-bucket", "https://storage.example.com");
  const testKey = "11111111222222223333333344444444";
  const expectedUrl = "https://storage.example.com/audio_cache/sarvam_11111111222222223333333344444444.wav";

  assert.strictEqual(cloudStore.getPublicUrl(testKey), expectedUrl);
  assert.strictEqual(cloudStore.getBucketName(), "my-test-bucket");
  assert.strictEqual(cloudStore.getEndpoint(), "https://storage.example.com");
  console.log("✓ Persistent Cloud Audio Store Interface Passed.");
}

// 3. Production Environment Unconfigured Storage Guard Test (Phase 3 & 16)
{
  const originalEnv = process.env.NODE_ENV;
  const originalBucket = process.env.AUDIO_STORAGE_BUCKET;
  const originalPath = process.env.AUDIO_STORAGE_PATH;

  try {
    (process.env as Record<string, string>).NODE_ENV = "production";
    delete process.env.AUDIO_STORAGE_BUCKET;
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AUDIO_STORAGE_PATH;

    assert.throws(() => {
      getAudioStorageEngine();
    }, /Persistent narration storage is not configured for production/);

    console.log("✓ Production Unconfigured Storage Clear Failure Passed.");
  } finally {
    (process.env as Record<string, string>).NODE_ENV = originalEnv;
    if (originalBucket) process.env.AUDIO_STORAGE_BUCKET = originalBucket;
    if (originalPath) process.env.AUDIO_STORAGE_PATH = originalPath;
  }
}

// 4. Development Local Storage Engine Test
{
  const devEngine = getAudioStorageEngine();
  assert.ok(devEngine instanceof LocalDiskAudioStore, "Development engine must be LocalDiskAudioStore");
  console.log("✓ Development Local Storage Engine Selection Passed.");
}

console.log("✅ ALL AUDIO STORE UNIT TESTS PASSED SUCCESSFULLY.");
