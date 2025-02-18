// src/config/config.cjs

const dotenv = require("dotenv");
const path = require("path");

const envPath =
  process.env.NODE_ENV === "test"
    ? path.resolve(process.cwd(), ".env.test")
    : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

module.exports = {
  development: {
    url: process.env.DEVELOPMENT_DATABASE_URL,
    database: "miraihealth",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: console.log,
    dialectOptions: {
      options: "-c search_path=public",
      ssl: false,
    },
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
  test: {
    url: process.env.TEST_DATABASE_URL,
    database: "miraihealth_test",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
  production: {
    url: process.env.PRODUCTION_DATABASE_URL,
    dialect: "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    logging: false,
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
};
