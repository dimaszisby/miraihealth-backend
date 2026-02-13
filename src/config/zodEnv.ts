import "./loadEnv.js";
import { z } from "zod";

/**
 * Define the environment schema using Zod.
 * Ensures type safety while allowing transformation.
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toLowerCase() : val),
      z.enum(["development", "test", "staging", "production"]),
    )
    .default("development"),

  // Server
  PORT: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        throw new Error("REDIS_PORT must be a valid number");
      }
      return parsed;
    })
    .default("5000"),

  // Security
  JWT_SECRET: z.string().min(1, { message: "JWT_SECRET is required" }),

  // CORS
  CORS_ORIGIN: z.string().optional(),

  // Database URLs (separate environment variables for dev/test/prod)
  DATABASE_URL: z.string().optional(),
  DEVELOPMENT_DATABASE_URL: z.string().optional(),
  TEST_DATABASE_URL: z.string().optional(),
  STAGING_DATABASE_URL: z.string().optional(),
  PRODUCTION_DATABASE_URL: z.string().optional(),

  // IF you rely on a DB_HOST/DB_PORT approach:
  DB_HOST: z
    .string()
    .default(process.env.NODE_ENV === "test" ? "db" : "127.0.0.1"),
  DB_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("5432"),
  DB_LOGGING: z.string().default("false"), // Allows enabling/disabling logging
  DB_SSL_REJECT_UNAUTHORIZED: z
    .string()
    .transform((val) => val.toLowerCase() !== "false")
    .default(process.env.NODE_ENV === "production" ? "true" : "false"),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z
    .string()
    .default(process.env.NODE_ENV === "test" ? "redis" : "127.0.0.1"),
  REDIS_PORT: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        throw new Error("REDIS_PORT must be a valid number");
      }
      return parsed;
    })
    .default("6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_REQUIRED: z
    .string()
    .transform((val) => val === "true") // Convert string to boolean
    .default(process.env.NODE_ENV === "test" ? "false" : "true"),
  ENABLE_REDIS_INTEGRATION: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  RATE_LIMIT_GLOBAL_MAX: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("RATE_LIMIT_GLOBAL_MAX must be a positive number");
      }
      return parsed;
    })
    .default("100"),
  RATE_LIMIT_USER_MAX: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("RATE_LIMIT_USER_MAX must be a positive number");
      }
      return parsed;
    })
    .default("50"),

  // Jest
  JEST_TIMEOUT: z.string().transform(Number).default("30000"),

  // Database
  DB_USER: z
    .string()
    .min(1, {
      message: "DB_USER is required. Set an explicit value in your .env file.",
    })
    .optional(),
  DB_PASSWORD: z
    .string()
    .min(1, {
      message:
        "DB_PASSWORD is required. Set an explicit value in your .env file.",
    })
    .optional(),
  DB_NAME: z
    .string()
    .min(1, {
      message: "DB_NAME is required. Set an explicit value in your .env file.",
    })
    .optional(),

  ENABLE_DUMMY_ENDPOINTS: z
    .string()
    .transform((val) => val === "true")
    .default(process.env.NODE_ENV === "development" ? "true" : "false"),

  RATE_LIMIT_ANALYTICS_MAX: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("RATE_LIMIT_ANALYTICS_MAX must be a positive number");
      }
      return parsed;
    })
    .default("30"),

  DISABLE_RATE_LIMITING: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  ALLOW_TEST_HTTP_SERVER: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // HTTP
  REQUEST_BODY_LIMIT: z.string().default("1mb"),
  SWAGGER_REQUIRE_AUTH: z
    .string()
    .transform((val) => val !== "false")
    .default("true"),
});

/**
 * Infer the TypeScript type from the validated schema
 */
type RawEnv = z.infer<typeof envSchema>;
type Env = RawEnv &
  Required<Pick<RawEnv, "DB_USER" | "DB_PASSWORD" | "DB_NAME">>;

const DATABASE_URL_KEYS = {
  development: "DEVELOPMENT_DATABASE_URL",
  test: "TEST_DATABASE_URL",
  staging: "STAGING_DATABASE_URL",
  production: "PRODUCTION_DATABASE_URL",
} as const satisfies Record<RawEnv["NODE_ENV"], keyof RawEnv>;

const normalizeDatabaseConfig = (parsedEnv: RawEnv): Env => {
  const envName = parsedEnv.NODE_ENV;
  const envSpecificKey = DATABASE_URL_KEYS[envName];

  const connectionUrl =
    parsedEnv[envSpecificKey] ?? parsedEnv.DATABASE_URL ?? null;

  if (connectionUrl) {
    try {
      const url = new URL(connectionUrl);
      if (url.username) {
        parsedEnv.DB_USER =
          parsedEnv.DB_USER ?? decodeURIComponent(url.username);
      }
      if (url.password) {
        parsedEnv.DB_PASSWORD =
          parsedEnv.DB_PASSWORD ?? decodeURIComponent(url.password);
      }
      if (url.hostname) {
        parsedEnv.DB_HOST = url.hostname;
      }
      if (url.port) {
        const parsedPort = Number(url.port);
        if (!Number.isNaN(parsedPort)) {
          parsedEnv.DB_PORT = parsedPort;
        }
      }
      const dbName = url.pathname.replace(/^\//, "");
      if (dbName) {
        parsedEnv.DB_NAME = parsedEnv.DB_NAME ?? decodeURIComponent(dbName);
      }
      parsedEnv[envSpecificKey] = parsedEnv[envSpecificKey] ?? connectionUrl;
    } catch (error) {
      throw new Error(
        `[ERROR] DATABASE_URL (${connectionUrl}) is invalid: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  if (!parsedEnv.DB_USER || !parsedEnv.DB_PASSWORD || !parsedEnv.DB_NAME) {
    throw new Error(
      "[ERROR] Database configuration is incomplete. Provide DATABASE_URL or DB_USER/DB_PASSWORD/DB_NAME.",
    );
  }

  return parsedEnv as Env;
};

const normalizeRedisConfig = (parsedEnv: RawEnv): RawEnv => {
  if (!parsedEnv.REDIS_URL) {
    return parsedEnv;
  }

  try {
    const url = new URL(parsedEnv.REDIS_URL);
    if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
      throw new Error("REDIS_URL protocol must be redis:// or rediss://");
    }

    if (url.hostname) {
      parsedEnv.REDIS_HOST = url.hostname;
    }

    if (url.port) {
      const parsedPort = Number(url.port);
      if (Number.isNaN(parsedPort)) {
        throw new Error("REDIS_URL port must be a valid number");
      }
      parsedEnv.REDIS_PORT = parsedPort;
    }

    if (url.password) {
      parsedEnv.REDIS_PASSWORD =
        parsedEnv.REDIS_PASSWORD ?? decodeURIComponent(url.password);
    }

    return parsedEnv;
  } catch (error) {
    throw new Error(
      `[ERROR] REDIS_URL (${parsedEnv.REDIS_URL}) is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

const buildEnv = (): Env => {
  const parsedEnv = envSchema.parse(process.env);
  const withDatabaseConfig = normalizeDatabaseConfig(parsedEnv);
  return normalizeRedisConfig(withDatabaseConfig) as Env;
};

/**
 * Parse and export the validated and type-safe environment object.
 * If validation fails, it will throw an error and terminate the process.
 */
const env: Env = buildEnv();

export { env, Env, buildEnv };
