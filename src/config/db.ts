// src/config/db.ts

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES Modules (NodeNext)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Environment Variables
const envPath =
  process.env.NODE_ENV === "test"
    ? path.resolve(__dirname, "../../.env.test")
    : path.resolve(__dirname, "../../.env");

console.log(`🟢 Loading environment variables from: ${envPath}`);
dotenv.config({ path: envPath });

const dbConfig = {
  development: {
    url: process.env.DEVELOPMENT_DATABASE_URL,
    dialect: "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    logging: console.log,
    dialectOptions: {
      ssl: false,
    },
  },
  test: {
    url: process.env.TEST_DATABASE_URL,
    dialect: "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    logging: false,
    dialectOptions: {
      ssl: false,
    },
  },
  production: {
    url: process.env.PRODUCTION_DATABASE_URL,
    dialect: "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

const env = (process.env.NODE_ENV || "development") as keyof typeof dbConfig;
const config = dbConfig[env];

if (!config.url) {
  throw new Error(`Database URL not found for environment: ${env}`);
}

const sequelize = new Sequelize(config.url, {
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
