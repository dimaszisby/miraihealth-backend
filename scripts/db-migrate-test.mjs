#!/usr/bin/env node
/**
 * Helper script for `npm run db:migrate:test`.
 * Loads `.env.test` (if present) and runs Sequelize migrations against the test DB.
 */
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import logger from "./logger.js";

const cwd = process.cwd();
const envPath = path.resolve(cwd, ".env.test");
const envManagerPath = path.resolve(
  cwd,
  "dist",
  "config",
  "envManager.js",
);

dotenv.config({ path: envPath, override: false });

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const runCommand = (command, args, envOverrides = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, ...envOverrides },
    });

    child.on("error", (error) => reject(error));
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });

const ensureBuildArtifacts = async () => {
  if (fs.existsSync(envManagerPath)) {
    return;
  }

  logger.info(
    "[db-migrate-test] dist/config/envManager.js missing; running npm run build before migrations.",
  );
  await runCommand(npmCmd, ["run", "build"]);

  if (!fs.existsSync(envManagerPath)) {
    throw new Error(
      `dist/config/envManager.js still missing after build. Check tsconfig.build.json include paths.`,
    );
  }
};

const run = async () => {
  await ensureBuildArtifacts();
  await runCommand(
    npxCmd,
    ["sequelize-cli", "db:migrate", "--config", "src/config/config.cjs"],
    { NODE_ENV: "test" },
  );
};

run().catch((error) => {
  logger.error("[db-migrate-test] Migration failed", error);
  process.exitCode = 1;
});
