// jest.setup.e2e.ts
//
// e2e test setup: authenticates the DB once and tears connections down on
// completion. Tests drive the Express app through supertest, which binds its
// own ephemeral port — no app.listen() is required here. Unlike the
// integration setup, e2e tests own their data: there is NO per-test
// table truncation.

import { setImmediate } from "timers";
import sequelize from "./src/config/db.js";
import { disconnectRedis } from "./src/utils/redis-client.js";
import { env } from "./src/config/envManager.js";
import logger from "./src/utils/logger.js";

jest.setTimeout(30_000);

if (!env.NODE_ENV) {
  throw new Error("[ERROR] NODE_ENV not set. Check your .env.test file.");
}

logger.info(`[PROCESS] Jest (e2e) running in environment: ${env.NODE_ENV}`);

global.setImmediate = setImmediate;

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    logger.info("[PROCESS] e2e database connection established.");
  } catch (error) {
    logger.error("[ERROR] during e2e test setup:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    logger.info("[PROCESS] e2e database connection closed.");
    await disconnectRedis();
  } catch (error) {
    logger.error("[ERROR] closing e2e connections:", error);
  }
});
