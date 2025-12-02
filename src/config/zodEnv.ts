// src/config/zodEnv.ts

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
  DEVELOPMENT_DATABASE_URL: z.string().optional(),
  TEST_DATABASE_URL: z.string().optional(),
  STAGING_DATABASE_URL: z.string().optional(),
  PRODUCTION_DATABASE_URL: z.string().optional(),

  // IF you rely on a DB_HOST/DB_PORT approach:
  DB_HOST: z.string().default(process.env.NODE_ENV === "test" ? "db" : "127.0.0.1"),
  DB_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("5432"),
  DB_LOGGING: z.string().default("false"), // Allows enabling/disabling logging
  DB_SSL_REJECT_UNAUTHORIZED: z
    .string()
    .transform((val) => val !== "false")
    .default("true"),

  // Redis
  REDIS_HOST: z.string().default(process.env.NODE_ENV === "test" ? "redis" : "127.0.0.1"),
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
    .min(1, { message: "DB_USER is required. Set an explicit value in your .env file." }),
  DB_PASSWORD: z
    .string()
    .min(1, { message: "DB_PASSWORD is required. Set an explicit value in your .env file." }),
  DB_NAME: z
    .string()
    .min(1, { message: "DB_NAME is required. Set an explicit value in your .env file." }),

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
type Env = z.infer<typeof envSchema>;

/**
 * Parse and export the validated and type-safe environment object.
 * If validation fails, it will throw an error and terminate the process.
 */
const env: Env = envSchema.parse(process.env);

if (!env.TEST_DATABASE_URL && env.NODE_ENV === "test") {
  throw new Error("[ERROR] TEST_DATABASE_URL is missing in .env.test!");
}

export { env, Env };
