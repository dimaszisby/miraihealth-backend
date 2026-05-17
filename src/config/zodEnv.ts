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
  ACCESS_TOKEN_TTL_SEC: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("ACCESS_TOKEN_TTL_SEC must be a positive number");
      }
      return parsed;
    })
    .default("900"),
  REFRESH_TOKEN_TTL_DAYS: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("REFRESH_TOKEN_TTL_DAYS must be a positive number");
      }
      return parsed;
    })
    .default("30"),

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
    .default(
      ["development", "test"].includes(process.env.NODE_ENV ?? "")
        ? "true"
        : "false",
    ),

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

  RATE_LIMIT_SWITCH_ORG_MAX: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("RATE_LIMIT_SWITCH_ORG_MAX must be a positive number");
      }
      return parsed;
    })
    .default("10"),

  DISABLE_RATE_LIMITING: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  ALLOW_TEST_HTTP_SERVER: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // RabbitMQ
  RABBITMQ_URL: z.string().optional(),
  RABBITMQ_ENABLED: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  RABBITMQ_HOST: z.string().default("127.0.0.1"),
  RABBITMQ_PORT: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        throw new Error("RABBITMQ_PORT must be a valid number");
      }
      return parsed;
    })
    .default("5672"),
  RABBITMQ_USER: z.string().default("guest"),
  RABBITMQ_PASSWORD: z.string().default("guest"),
  RABBITMQ_VHOST: z.string().default("/"),
  RABBITMQ_PREFETCH: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("RABBITMQ_PREFETCH must be a positive number");
      }
      return parsed;
    })
    .default("10"),
  RABBITMQ_MAX_RETRIES: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error("RABBITMQ_MAX_RETRIES must be a non-negative number");
      }
      return parsed;
    })
    .default("5"),

  // Observability
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z
    .string()
    .transform((val) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    })
    .default("0"),

  // HTTP
  REQUEST_BODY_LIMIT: z.string().default("1mb"),
  SWAGGER_REQUIRE_AUTH: z
    .string()
    .transform((val) => val !== "false")
    .default("true"),

  // Email / Password Reset
  EMAIL_PROVIDER: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toLowerCase() : val),
      z.enum(["console", "resend"]),
    )
    .default(
      ["development", "test"].includes(process.env.NODE_ENV ?? "")
        ? "console"
        : "resend",
    ),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
  FRONTEND_RESET_URL: z
    .string()
    .url()
    .default("http://localhost:3000/reset-password"),
  FRONTEND_VERIFY_URL: z
    .string()
    .url()
    .default("http://localhost:3000/verify-email"),
  FRONTEND_INVITE_URL: z
    .string()
    .url()
    .default("http://localhost:3000/invites/accept"),
  INVITE_TOKEN_TTL_DAYS: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("INVITE_TOKEN_TTL_DAYS must be a positive number");
      }
      return parsed;
    })
    .default("7"),
  EMAIL_VERIFICATION_TTL_SEC: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error("EMAIL_VERIFICATION_TTL_SEC must be a positive number");
      }
      return parsed;
    })
    .default("86400"),
  RATE_LIMIT_EMAIL_VERIFICATION_EMAIL_MAX: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error(
          "RATE_LIMIT_EMAIL_VERIFICATION_EMAIL_MAX must be a positive number",
        );
      }
      return parsed;
    })
    .default("3"),
  RATE_LIMIT_EMAIL_VERIFICATION_IP_MAX: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error(
          "RATE_LIMIT_EMAIL_VERIFICATION_IP_MAX must be a positive number",
        );
      }
      return parsed;
    })
    .default("10"),
  RATE_LIMIT_PASSWORD_RESET_EMAIL_MAX: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error(
          "RATE_LIMIT_PASSWORD_RESET_EMAIL_MAX must be a positive number",
        );
      }
      return parsed;
    })
    .default("3"),
  RATE_LIMIT_PASSWORD_RESET_IP_MAX: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error(
          "RATE_LIMIT_PASSWORD_RESET_IP_MAX must be a positive number",
        );
      }
      return parsed;
    })
    .default("10"),
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

const normalizeRabbitMQConfig = (parsedEnv: RawEnv): RawEnv => {
  if (!parsedEnv.RABBITMQ_URL) {
    return parsedEnv;
  }

  try {
    const url = new URL(parsedEnv.RABBITMQ_URL);
    if (url.protocol !== "amqp:" && url.protocol !== "amqps:") {
      throw new Error("RABBITMQ_URL protocol must be amqp:// or amqps://");
    }

    if (url.hostname) parsedEnv.RABBITMQ_HOST = url.hostname;
    if (url.port) {
      const parsedPort = Number(url.port);
      if (!Number.isNaN(parsedPort)) parsedEnv.RABBITMQ_PORT = parsedPort;
    }
    if (url.username)
      parsedEnv.RABBITMQ_USER = decodeURIComponent(url.username);
    if (url.password)
      parsedEnv.RABBITMQ_PASSWORD =
        parsedEnv.RABBITMQ_PASSWORD ?? decodeURIComponent(url.password);
    const vhost = url.pathname.replace(/^\//, "");
    if (vhost) parsedEnv.RABBITMQ_VHOST = decodeURIComponent(vhost);

    return parsedEnv;
  } catch (error) {
    throw new Error(
      `[ERROR] RABBITMQ_URL (${parsedEnv.RABBITMQ_URL}) is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

const buildEnv = (): Env => {
  const parsedEnv = envSchema.parse(process.env);
  const withDatabaseConfig = normalizeDatabaseConfig(parsedEnv);
  const withRedisConfig = normalizeRedisConfig(withDatabaseConfig) as RawEnv;
  return normalizeRabbitMQConfig(withRedisConfig) as Env;
};

/**
 * Parse and export the validated and type-safe environment object.
 * If validation fails, it will throw an error and terminate the process.
 */
const env: Env = buildEnv();

export { env, Env, buildEnv };
