import { describe, expect, it, beforeEach } from "@jest/globals";
import {
  env as cachedEnv,
  loadEnvOrExit,
  maskEnvValue,
  resetEnvCacheForTesting,
} from "../../src/config/envManager.js";

describe("envManager", () => {
  beforeEach(() => {
    resetEnvCacheForTesting();
  });

  it("returns the same cached instance on subsequent calls", () => {
    const first = loadEnvOrExit();
    process.env.PORT = "9999";
    const second = loadEnvOrExit();

    expect(second).toBe(first);
    expect(second.PORT).not.toBe(9999);
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
