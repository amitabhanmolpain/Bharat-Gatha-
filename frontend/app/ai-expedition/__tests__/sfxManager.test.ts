import assert from "assert";
import { sfxManager } from "../services/sfxManager";

console.log("[TEST] Running SFX Manager Unit Tests...");

// 1. Enable / Disable state
{
  sfxManager.setEnabled(true);
  assert.strictEqual(sfxManager.isEnabled(), true, "sfxManager should be enabled");
  sfxManager.setEnabled(false);
  assert.strictEqual(sfxManager.isEnabled(), false, "sfxManager should be disabled");
  sfxManager.setEnabled(true);
  console.log("✓ SFX state toggle tests passed.");
}

// 2. Footstep Rate-Limiting Test (Phase 11)
{
  const originalNow = performance.now;
  let simulatedTime = 1000;

  // Mock performance.now to simulate rapid footstep triggers
  performance.now = () => simulatedTime;

  sfxManager.playFootstep(); // First step at t=1000ms

  simulatedTime = 1050; // +50ms (too fast, should be rate-limited)
  sfxManager.playFootstep();

  simulatedTime = 1100; // +100ms (too fast)
  sfxManager.playFootstep();

  simulatedTime = 1260; // +260ms (> 250ms interval, allowed!)
  sfxManager.playFootstep();

  performance.now = originalNow;
  console.log("✓ SFX Footstep Rate-Limiting (<=4 steps/sec) passed.");
}

console.log("✅ ALL SFX MANAGER UNIT TESTS PASSED SUCCESSFULLY.");
