//jest.setup.ts

import { jest } from "@jest/globals";
import type { Server } from "http";
import { QueryTypes } from "sequelize";
import { setImmediate } from "timers";
import app from "./src/server.js";
import sequelize from "./src/config/db.js";
import { disconnectRedis } from "./src/utils/redis-client.js";
import request from "supertest";
import { env } from "./src/config/envManager.js";

const skipDbLifecycle = process.env.SKIP_DB_LIFECYCLE === "true";
jest.setTimeout(40000);

if (skipDbLifecycle) {
  console.log(
    "[PROCESS] SKIP_DB_LIFECYCLE enabled — skipping server/DB bootstrap.",
  );
}

// Ensure Jest uses the correct test environment
if (!env.NODE_ENV) {
  throw new Error("[ERROR] NODE_ENV not set. Check your .env.test file.");
}

console.log(`🛠 Jest running in environment: ${env.NODE_ENV}`);
console.log(`🔗 Connected to test DB: ${env.TEST_DATABASE_URL}`);
console.log(`DB_HOST: ${env.DB_HOST}`);
console.log(`DB_PORT: ${env.DB_PORT}`);

// Ensure immediate functions are available in Jest
global.setImmediate = setImmediate;

let server: Server;
const workerId = Number(process.env.JEST_WORKER_ID ?? "0");
const TEST_SERVER_PORT = 4000 + workerId;

/**
 * Initialize Database & Start Test Server Before Running Tests
 */
if (!skipDbLifecycle) {
  beforeAll(async () => {
    try {
      server = app.listen(TEST_SERVER_PORT, () => {
        console.log(
          `[PROCESS] Test server running on port ${TEST_SERVER_PORT}`,
        );
      });

      await sequelize.authenticate();
      console.log("[PROCESS] Database connection established.");
    } catch (error) {
      console.error("[ERROR] during test setup:", error);
      throw error;
    }
  });
} else {
  beforeAll(async () => {
    await disconnectRedis();
  });
}

/**
 * Clean Up Database After Each Test (Truncate Tables)
 */
if (!skipDbLifecycle) {
  beforeEach(async () => {
    try {
      console.log("🛑 Starting raw SQL table truncation...");

      const result = (await sequelize.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`,
        { type: QueryTypes.SELECT },
      )) as { tablename: string }[] | unknown;
      const tables = Array.isArray(result)
        ? (result as { tablename: string }[])
        : [];

      for (const table of tables) {
        const tableName = table.tablename;
        if (["SequelizeMeta", "SequelizeData"].includes(tableName)) {
          continue;
        }
        await sequelize.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
        );
      }

      console.log("[PROCESS] Completed raw SQL table truncation.");
    } catch (error) {
      console.error("[ERROR] during table truncation:", error);
      throw error;
    }
  });
}

/**
 * Gracefully Shut Down Server & DB Connection After Tests
 */
afterAll(async () => {
  if (skipDbLifecycle) {
    return;
  }

  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      console.log("[PROCESS] Test server closed.");
    }

    await sequelize.close();
    console.log("[PROCESS] Database connection closed.");

    await disconnectRedis();
  } catch (error) {
    console.error("[ERROR] closing connections:", error);
  }
});

// Export test request helper
export const testRequest = request(app);
