#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import logger from "../../../../../scripts/logger.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../../../..");
const schemathesisDir = path.join(
  repoRoot,
  "documents",
  "tests",
  "4-contract-tests",
  "schemathesis",
);
const specPath = path.join(
  repoRoot,
  "documents",
  "openapi",
  "lakira-backend-openapi.json",
);
const seedPath = path.join(repoRoot, "tmp", "contract-seed.json");
const DEFAULT_HOOK_MODULE =
  process.env.SCHEMATHESIS_HOOKS ?? "documents.tests.contract_hooks.seeded_ids";
const hookFilePath = path.join(
  repoRoot,
  "documents",
  "tests",
  "contract_hooks",
  "seeded_ids.py",
);

const CLI = process.env.SCHEMATHESIS_CLI ?? "schemathesis";
const DEFAULT_TAGS =
  process.env.SCHEMATHESIS_LOCAL_ENDPOINT_TAGS ??
  "Auth,Analytics,Metrics,Metric Logs,Metric Settings,Metric Categories,Trends";
const HEALTH_TIMEOUT_MS = Number(
  process.env.SCHEMATHESIS_HEALTH_TIMEOUT_MS ?? 10000,
);

function buildTags(tagString) {
  return tagString
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(
        new Error(
          `Command "${[command, ...args].join(" ")}" exited with code ${code}`,
        ),
      );
    });
  });
}

async function main() {
  const baseUrl =
    process.env.SCHEMATHESIS_LOCAL_BASE_URL ?? "http://localhost:4000/api/v1";
  let seedData = null;
  try {
    const raw = await fs.readFile(seedPath, "utf8");
    seedData = JSON.parse(raw);
  } catch {
    // Seed file is optional; hooks will no-op if absent.
  }

  const token =
    process.env.SCHEMATHESIS_LOCAL_TOKEN ?? seedData?.primaryUser?.token;
  if (!token) {
    logger.error(
      "[schemathesis:local] Missing SCHEMATHESIS_LOCAL_TOKEN. Export a contract-test JWT (see tmp/contract-seed.json).",
    );
    process.exitCode = 1;
    return;
  }

  try {
    await fs.access(specPath);
  } catch {
    logger.error(
      `[schemathesis:local] OpenAPI spec not found at ${specPath}. Run "npm run docs:openapi:generate" first.`,
    );
    process.exitCode = 1;
    return;
  }

  const healthUrl = `${baseUrl.replace(/\/$/, "")}/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(healthUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `[schemathesis:local] Healthcheck at ${healthUrl} returned ${response.status}.`,
      );
    }
  } catch (error) {
    logger.error(
      `[schemathesis:local] Backend not reachable at ${healthUrl}. Start the server via "npm run contract:local:full" or ensure "npm run start:test" is running with DISABLE_RATE_LIMITING=true.`,
    );
    logger.error(error.message);
    process.exitCode = 1;
    return;
  } finally {
    clearTimeout(timer);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportBaseDir = path.join(schemathesisDir, "reports", "local");
  await fs.mkdir(reportBaseDir, { recursive: true });
  const reportDir = path.join(reportBaseDir, timestamp);
  await fs.mkdir(reportDir, { recursive: true });

  const junitPath = path.join(reportDir, "schemathesis-local.xml");
  const harPath = path.join(reportDir, "schemathesis-local.har");

  const args = [
    "run",
    specPath,
    "--url",
    baseUrl,
    "--checks",
    "all",
    "--phases",
    process.env.SCHEMATHESIS_LOCAL_PHASES ??
      "examples,coverage,fuzzing,stateful",
    "--workers",
    process.env.SCHEMATHESIS_LOCAL_WORKERS ?? "auto",
    "--max-examples",
    process.env.SCHEMATHESIS_LOCAL_MAX_EXAMPLES ?? "50",
    "--report",
    "junit,har",
    "--report-junit-path",
    junitPath,
    "--report-har-path",
    harPath,
    "--header",
    `Authorization: Bearer ${token}`,
  ];
  try {
    await fs.access(hookFilePath);
  } catch {
    logger.warn(
      `[schemathesis:local] Hooks file missing at ${hookFilePath}. Seeded ID overrides will be skipped.`,
    );
  }

  const tags = buildTags(DEFAULT_TAGS);
  tags.forEach((tag) => {
    args.push("--include-tag", tag);
  });

  if (process.env.SCHEMATHESIS_LOCAL_ENDPOINTS) {
    process.env.SCHEMATHESIS_LOCAL_ENDPOINTS.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((endpoint) => {
        args.push("--include-operation-id", endpoint);
      });
  }

  logger.info("[schemathesis:local] Running Schemathesis with args:", args);

  try {
    const env = {
      ...process.env,
      SCHEMATHESIS_SEED_FILE: process.env.SCHEMATHESIS_SEED_FILE ?? seedPath,
      SCHEMATHESIS_HOOKS: process.env.SCHEMATHESIS_HOOKS ?? DEFAULT_HOOK_MODULE,
      PYTHONPATH: [repoRoot, process.env.PYTHONPATH]
        .filter(Boolean)
        .join(path.delimiter),
    };
    await runCommand(CLI, args, { cwd: repoRoot, env });
    logger.info(
      `[schemathesis:local] Completed. Reports stored under ${reportDir}`,
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      logger.error(
        `[schemathesis:local] Unable to find "${CLI}". Install Schemathesis via "pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt" or point SCHEMATHESIS_CLI to the binary.`,
      );
    } else {
      logger.error("[schemathesis:local] Schemathesis run failed", error);
    }
    process.exitCode = 1;
  }
}

main();
