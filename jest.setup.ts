import type { Server } from 'http';
import { QueryTypes } from "sequelize";
import { setImmediate } from "timers";
import app from "./src/server.js";
import sequelize from "./src/config/db.js";
import request from "supertest";

// Set global.setImmediate
global.setImmediate = setImmediate;

let server: Server;

// Jest configuration should be in jest.config.mjs
const timeout = process.env.JEST_TIMEOUT ? parseInt(process.env.JEST_TIMEOUT) : 30000;
if (typeof jest !== 'undefined') {
  jest.setTimeout(timeout);
}

beforeAll(async () => {
  try {
    server = app.listen(4000, () => {
      console.log("✅ Test server running on port 4000");
    });

    await sequelize.authenticate();
    console.log("✅ Database connection established.");
  } catch (error) {
    console.error("❌ Error during test setup:", error);
    throw error;
  }
});

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
        continue;
      }
      await sequelize.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
    }

    console.log("✅ Completed raw SQL table truncation.");
  } catch (error) {
    console.error("❌ Error during table truncation:", error);
    throw error;
  }
});

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

export const testRequest = request(app);
