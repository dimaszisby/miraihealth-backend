#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import newman from "newman";
import logger from "../../../../../scripts/logger.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const postmanDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(postmanDir, "..", "..", "..", "..");

const collections = [
  {
    id: "analytics",
    name: "Analytics",
    file: "lakira-analytics-contract.postman_collection.json",
  },
  {
    id: "metrics",
    name: "Metrics",
    file: "lakira-metrics-contract.postman_collection.json",
  },
  {
    id: "metric-logs",
    name: "Metric Logs",
    file: "lakira-metric-logs-contract.postman_collection.json",
  },
  {
    id: "metric-settings",
    name: "Metric Settings",
    file: "lakira-metric-settings-contract.postman_collection.json",
  },
  {
    id: "auth",
    name: "Auth",
    file: "lakira-auth-contract.postman_collection.json",
  },
];

const envPath = path.join(
  postmanDir,
  "environments",
  "lakira-local.postman_environment.json",
);
const reportsRoot = path.join(postmanDir, "reports", "local");
const seedOutputPath = path.join(repoRoot, "tmp", "contract-seed.json");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else
        reject(
          new Error(
            `Command "${[command, ...args].join(" ")}" exited with code ${code}`,
          ),
        );
    });
  });
}

async function ensureSeeds() {
  if (process.env.SKIP_CONTRACT_SEED === "true") {
    logger.info(
      "[contract-local] SKIP_CONTRACT_SEED=true, skipping seed script.",
    );
    return;
  }
  logger.info("[contract-local] Running npm run seed:contract-tests …");
  await runCommand(npmCmd, ["run", "seed:contract-tests"], { cwd: repoRoot });
}

async function loadEnvironmentTemplate() {
  const raw = await fs.readFile(envPath, "utf8");
  return JSON.parse(raw);
}

async function resolveContractToken() {
  if (process.env.CONTRACT_AUTH_TOKEN) {
    return process.env.CONTRACT_AUTH_TOKEN;
  }
  try {
    const seedRaw = await fs.readFile(seedOutputPath, "utf8");
    const parsed = JSON.parse(seedRaw);
    return parsed?.primaryUser?.token;
  } catch (error) {
    logger.warn(
      `[contract-local] Unable to read seed file at ${seedOutputPath}: ${error.message}`,
    );
    return null;
  }
}

async function buildEnvironment() {
  const environment = await loadEnvironmentTemplate();
  const token = await resolveContractToken();
  if (!token) {
    throw new Error(
      "[contract-local] contractAuthToken missing. Ensure tmp/contract-seed.json exists or set CONTRACT_AUTH_TOKEN env.",
    );
  }
  environment.values = environment.values.map((entry) =>
    entry.key === "contractAuthToken" ? { ...entry, value: token } : entry,
  );
  return environment;
}

function runNewman(options) {
  return new Promise((resolve, reject) => {
    newman.run(options, (err, summary) => {
      if (err) return reject(err);
      if (summary?.error || summary?.run?.failures?.length) {
        return reject(
          summary.error ??
            new Error(
              `Newman reported ${summary.run.failures.length} failure(s) for ${options.collection}`,
            ),
        );
      }
      resolve(summary);
    });
  });
}

async function main() {
  logger.info("[contract-local] Starting Postman/Newman contract suite…");
  await ensureSeeds();
  const baseEnvironment = await buildEnvironment();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = path.join(reportsRoot, timestamp);
  await fs.mkdir(reportDir, { recursive: true });

  for (const collection of collections) {
    const collectionPath = path.join(
      postmanDir,
      "collections",
      collection.file,
    );
    logger.info(`[contract-local] Running ${collection.name} collection…`);
    await runNewman({
      collection: collectionPath,
      environment: JSON.parse(JSON.stringify(baseEnvironment)),
      reporters: ["cli", "junit", "htmlextra"],
      reporter: {
        junit: { export: path.join(reportDir, `${collection.id}.xml`) },
        htmlextra: { export: path.join(reportDir, `${collection.id}.html`) },
      },
    });
  }

  logger.info(
    `[contract-local] All collections completed. Reports: ${reportDir}`,
  );
}

main().catch((error) => {
  logger.error("[contract-local] Contract test run failed", error);
  process.exitCode = 1;
});
