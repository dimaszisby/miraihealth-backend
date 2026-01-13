#!/usr/bin/env node
/**
 * Helper script for `npm run db:migrate:test`.
 * Loads `.env.test` (if present) and runs Sequelize migrations against the test DB.
 */
import { spawn } from "child_process";
import path from "path";
import dotenv from "dotenv";
import logger from "./logger.js";

const cwd = process.cwd();
const envPath = path.resolve(cwd, ".env.test");
dotenv.config({ path: envPath, override: false });

const run = () =>
  new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["sequelize-cli", "db:migrate", "--config", "src/config/config.cjs"],
      {
        cwd,
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "test" },
      },
    );

    child.on("error", (error) => reject(error));
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`sequelize-cli exited with code ${code}`));
      }
    });
  });

run().catch((error) => {
  logger.error("[db-migrate-test] Migration failed", error);
  process.exitCode = 1;
});
