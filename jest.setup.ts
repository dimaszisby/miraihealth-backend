/* eslint-disable @typescript-eslint/no-explicit-any */
//jest.setup.ts

import type { Server } from "http";
import { QueryTypes } from "sequelize";
import { setImmediate } from "timers";
import app from "./src/server.js";
import sequelize from "./src/config/db.js";
import request from "supertest";
import { env } from "./src/config/zodEnv.js";
import initializeDB from "./src/models/index.js";

// // Jest configuration should be in jest.config.mjs
// const timeout = env.JEST_TIMEOUT;
// if (typeof jest !== "undefined") {
//   const timeout = env.JEST_TIMEOUT || 30000;
//   jest.setTimeout(timeout);
// }

// ✅ Ensure Jest uses the correct test environment
if (!process.env.NODE_ENV) {
  throw new Error("❌ NODE_ENV not set. Check your .env.test file.");
}

console.log(`🛠 Jest running in environment: ${process.env.NODE_ENV}`);
console.log(`🔗 Connected to test DB: ${process.env.TEST_DATABASE_URL}`);

// ✅ Ensure immediate functions are available in Jest
global.setImmediate = setImmediate;

let server: Server;

/**
 * ✅ Initialize Database & Start Test Server Before Running Tests
 */
beforeAll(async () => {
  try {
    // ✅ Ensure database is initialized
    console.log("🔍 Initializing database...");
    await initializeDB();

    // ✅ Run database migrations
    console.log("🔄 Running database migrations...");
    await sequelize.sync({ force: true });
    console.log("✅ Database reset completed.");

    // ✅ Start test server
    server = app.listen(4000, () => {
      console.log("✅ Test server running on port 4000");
    });

    // ✅ Verify database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established.");
  } catch (error) {
    console.error("❌ Error during test setup:", error);
    throw error;
  }
});

/**
 * ✅ Clean Up Database After Each Test (Truncate Tables)
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
      if (["SequelizeMeta", "SequelizeData", "users"].includes(tableName)) {
        continue; // Skip meta & user table
      }
      await sequelize.query(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`
      );
    }

    console.log("✅ Completed raw SQL table truncation.");
  } catch (error) {
    console.error("❌ Error during table truncation:", error);
    throw error;
  }
});

/**
 * ✅ Gracefully Shut Down Server & DB Connection After Tests
 */
afterAll(async () => {
  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      console.log("✅ Test server closed.");
    }

    await sequelize.close();
    console.log("✅ Database connection closed.");
  } catch (error) {
    console.error("❌ Error closing connections:", error);
  }
});

// ✅ Export test request helper
export const testRequest = request(app);
