//jest.setup.ts

import type { Server } from "http";
import { QueryTypes } from "sequelize";
import { setImmediate } from "timers";
import app from "./src/server.js";
import db from "./src/infrastructure/db/sequelize.js";
import { disconnectRedis } from "./src/utils/redis-client.js";
import request from "supertest";
import { env } from "./src/config/zodEnv.js";

const { sequelize } = db;

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

/**
 * Initialize Database & Start Test Server Before Running Tests
 */
beforeAll(async () => {
  try {
    // Start test server
    server = app.listen(4000, () => {
      console.log("[PROCESS] Test server running on port 4000");
    });

    // Verify database connection
    await sequelize.authenticate();
    console.log("[PROCESS] Database connection established.");
  } catch (error) {
    console.error("[ERROR] during test setup:", error);
    throw error;
  }
});

/**
 * Clean Up Database After Each Test (Truncate Tables)
 */
beforeEach(async () => {
  try {
    console.log("🛑 Starting raw SQL table truncation...");

    const tables: { tablename: string }[] = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`,
      { type: QueryTypes.SELECT }
    );

    for (const table of tables) {
      const tableName = table.tablename;
      if (["SequelizeMeta", "SequelizeData"].includes(tableName)) {
        continue; // Skip meta & user table
      }
      // await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      await sequelize.query(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`
      );
      // await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    console.log("[PROCESS] Completed raw SQL table truncation.");
  } catch (error) {
    console.error("[ERROR] during table truncation:", error);
    throw error;
  }
});

/**
 * Gracefully Shut Down Server & DB Connection After Tests
 */
afterAll(async () => {
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
