// src/config/zodEnv.ts

import { z } from "zod";
import dotenv from "dotenv";

// Load .env file (place this as early as possible in your app).
dotenv.config();

/**
 * Define the environment schema using Zod.
 * Ensures type safety while allowing transformation.
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toLowerCase() : val),
      z.enum(["development", "test", "production"])
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
  PRODUCTION_DATABASE_URL: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().default("127.0.0.1"),
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

export { env, Env };
