import { describe, expect, it, beforeEach } from "@jest/globals";
import {
  env as cachedEnv,
  loadEnvOrExit,
  maskEnvValue,
  resetEnvCacheForTesting,
} from "@/config/envManager.js";
import { withTestEnv } from "@/tests/env-test-utils.js";

describe("envManager", () => {
  beforeEach(() => {
    resetEnvCacheForTesting();
  });

  it("returns the same cached instance on subsequent calls", async () => {
    await withTestEnv(() => {
      const first = loadEnvOrExit();
      const second = loadEnvOrExit();

      expect(second).toBe(first);
    });
  });

  it("exposes an eagerly loaded env export", () => {
    expect(cachedEnv).toBeDefined();
    expect(cachedEnv.NODE_ENV).toBeDefined();
  });

  it.each([
    ["DB_PASSWORD", "super-secret"],
    ["API_KEY", "abcdef"],
    ["SOME_TOKEN", "token"],
    ["DATABASE_URL", "postgres://user:pass@host/db"],
  ])("masks sensitive %s values", (key, value) => {
    expect(maskEnvValue(key, value)).toBe("***REDACTED***");
  });

  it("leaves non-sensitive keys untouched", () => {
    expect(maskEnvValue("PORT", "8080")).toBe("8080");
  });
});
