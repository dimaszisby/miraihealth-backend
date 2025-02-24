// src/config/config.cjs

const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

/**
 * * Define the configuration for the app.
 * Mainly used for Database/sequelize configuration.
 * Ensures type safety while allowing transformation.
 *
 * * Environment Usage
 * Uses the process.env.NODE_ENV to determine the environment instead of the env from zodEnv.js
 * Ensures Sequelize configuration is based on the environment.
 * note: Might be unified with zondEnv later
 */

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(envFile) });

// ✅ Define Zod schema for validation
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  PORT: z.preprocess((val) => Number(val) || 5000, z.number()),
  JWT_SECRET: z.string().min(1, { message: "JWT_SECRET is required" }),
  CORS_ORIGIN: z.string().optional(),
  DEVELOPMENT_DATABASE_URL: z.string().optional(),
  TEST_DATABASE_URL: z.string().optional(),
  STAGING_DATABASE_URL: z.string().optional(),
  PRODUCTION_DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.preprocess((val) => Number(val) || 5432, z.number()),
  DB_LOGGING: z.string().default("false"),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.preprocess((val) => Number(val) || 6379, z.number()),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_REQUIRED: z
    .preprocess((val) => val === "true", z.boolean())
    .default(false),
});

// ✅ Validate environment variables
const env = envSchema.parse(process.env);

const config = {
  development: {
    url: env.DEVELOPMENT_DATABASE_URL,
    dialect: "postgres",
    logging: console.log,
    dialectOptions: { ssl: false },
  },
  test: {
    url: env.TEST_DATABASE_URL,
    dialect: "postgres",
    logging: false,
  },
  staging: {
    url: env.STAGING_DATABASE_URL,
    dialect: "postgres",
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
  production: {
    url: env.PRODUCTION_DATABASE_URL,
    dialect: "postgres",
    logging: env.DB_LOGGING === "true" ? console.log : false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
};

// ✅ Ensure the environment exists
const activeEnv = env.NODE_ENV;
if (!config[activeEnv]) {
  throw new Error(
    `❌ ERROR: No configuration found for environment: ${activeEnv}`
  );
}

module.exports = config;
