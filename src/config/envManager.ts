import { ZodError, type ZodIssue } from "zod";
import type { Env } from "./zodEnv.js";
import { buildEnv } from "./zodEnv.js";

let cachedEnv: Env | null = null;

const SENSITIVE_KEY_PATTERN = /(password|secret|token|key|certificate|url)$/i;
const LOG_SNAPSHOT_KEYS = [
  "NODE_ENV",
  "DB_HOST",
  "DB_PORT",
  "DEVELOPMENT_DATABASE_URL",
  "TEST_DATABASE_URL",
  "STAGING_DATABASE_URL",
  "PRODUCTION_DATABASE_URL",
  "PORT",
  "REQUEST_BODY_LIMIT",
];

export class EnvValidationError extends Error {
  constructor(
    message: string,
    readonly options: { issues?: ZodIssue[]; environment?: string } = {},
  ) {
    super(message);
    this.name = "EnvValidationError";
  }

  get issues(): ZodIssue[] | undefined {
    return this.options.issues;
  }

  get environment(): string | undefined {
    return this.options.environment;
  }
}

function normalizeEnvError(error: unknown): Error {
  if (error instanceof EnvValidationError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new EnvValidationError("Environment validation failed", {
      issues: error.issues,
      environment: process.env.NODE_ENV || "development",
    });
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

function maskedEnvSnapshot(): Record<string, unknown> {
  return LOG_SNAPSHOT_KEYS.reduce<Record<string, unknown>>((acc, key) => {
    const value = process.env[key];
    if (typeof value === "undefined") {
      return acc;
    }

    acc[key] = maskEnvValue(key, value);
    return acc;
  }, {});
}

function logEnvFailure(error: Error): void {
  const payload = {
    event: "env.validation.failed",
    environment: process.env.NODE_ENV || "development",
    message: error.message,
    issues: error instanceof EnvValidationError ? error.issues : undefined,
    envSample: maskedEnvSnapshot(),
  };

  console.error(`[ENV_ERROR] ${JSON.stringify(payload)}`);
}

export function loadEnvOrExit(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    cachedEnv = buildEnv();
    return cachedEnv;
  } catch (rawError) {
    const error = normalizeEnvError(rawError);
    logEnvFailure(error);
    throw error;
  }
}

export function getEnv<K extends keyof Env>(key: K): Env[K] {
  const env = loadEnvOrExit();
  return env[key];
}

export function maskEnvValue(key: string, value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }
  return SENSITIVE_KEY_PATTERN.test(key) ? "***REDACTED***" : value;
}

export function resetEnvCacheForTesting(): void {
  cachedEnv = null;
}

export const env: Env = loadEnvOrExit();
