// // src/config/db.ts

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./zodEnv.js"; // Use validated env variables

// ✅ Ensure database URL is set correctly
// const databaseUrl =
//   env.NODE_ENV === "test" ? env.TEST_DATABASE_URL : env.DEVELOPMENT_DATABASE_URL;

// if (!databaseUrl) {
//   throw new Error(`❌ Database URL is missing for environment: ${env.NODE_ENV}`);
// }

const dbConfig = {
  development: {
    dialect: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    logging: env.DB_LOGGING === "true" ? console.log : false,
    dialectOptions: {
      ssl: false,
    },
  },
  test: {
    dialect: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    logging: false,
    dialectOptions: {
      ssl: false,
    },
  },
  staging: {
    dialect: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  production: {
    dialect: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    logging: env.DB_LOGGING === "true" ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

// Ensure valid environment
const envMode = (env.NODE_ENV || "development") as keyof typeof dbConfig;
const config = dbConfig[envMode];

// if (!config.url) {
//   throw new Error(`❌ Database URL is missing for environment: ${envMode}`);
// }

// Initialize Sequelize
const sequelize = new Sequelize(config.database, config.username, config.password, {
  dialect: "postgres",
  host: config.host,
  port: config.port,
  logging: config.logging,
  dialectOptions: config.dialectOptions,
  define: {
    freezeTableName: false,
    underscored: true,
    timestamps: true,
  },
});

export default sequelize;
