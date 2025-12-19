import type { Env } from "./zodEnv.js";
import { buildEnv } from "./zodEnv.js";

let cachedEnv: Env | null = null;

const SENSITIVE_KEY_PATTERN = /(password|secret|token|key)$/i;

export function loadEnvOrExit(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    cachedEnv = buildEnv();
    return cachedEnv;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ENV] Failed to load validated configuration: ${message}`);
    throw error;
  }
}

export function getEnv<K extends keyof Env>(key: K): Env[K] {
  const env = loadEnvOrExit();
  return env[key];
}

export function maskEnvValue(key: string, value: unknown): unknown {
  return SENSITIVE_KEY_PATTERN.test(key) ? "***REDACTED***" : value;
}

export function resetEnvCacheForTesting(): void {
  cachedEnv = null;
}

export const env: Env = loadEnvOrExit();
