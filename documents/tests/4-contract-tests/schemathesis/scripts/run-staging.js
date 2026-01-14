#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import logger from "../../../../../scripts/logger.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../../..");
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

const CLI = process.env.SCHEMATHESIS_CLI ?? "schemathesis";
const DEFAULT_TAGS =
  process.env.SCHEMATHESIS_STAGING_ENDPOINT_TAGS ??
  "analytics,metrics,metric-logs,metric-settings,auth";

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
  const baseUrl = process.env.SCHEMATHESIS_STAGING_BASE_URL;
  const token = process.env.SCHEMATHESIS_STAGING_TOKEN;
  if (!baseUrl || !token) {
    logger.error(
      "[schemathesis:staging] Missing SCHEMATHESIS_STAGING_BASE_URL or SCHEMATHESIS_STAGING_TOKEN environment variables.",
    );
    process.exitCode = 1;
    return;
  }

  try {
    await fs.access(specPath);
  } catch {
    logger.error(
      `[schemathesis:staging] OpenAPI spec not found at ${specPath}. Run "npm run docs:openapi:generate" before executing Schemathesis.`,
    );
    process.exitCode = 1;
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = path.join(schemathesisDir, "reports", "staging", timestamp);
  await fs.mkdir(reportDir, { recursive: true });

  const junitPath = path.join(reportDir, "schemathesis-staging.xml");
  const jsonPath = path.join(reportDir, "schemathesis-staging.json");

  const args = [
    "run",
    specPath,
    "--base-url",
    baseUrl,
    "--checks",
    "all",
    "--stateful=links",
    "--workers",
    process.env.SCHEMATHESIS_STAGING_WORKERS ?? "auto",
    "--hypothesis-max-examples",
    process.env.SCHEMATHESIS_STAGING_MAX_EXAMPLES ?? "50",
    "--junit-xml",
    junitPath,
    "--report-file",
    jsonPath,
    "--headers",
    `Authorization: Bearer ${token}`,
  ];

  const tags = buildTags(DEFAULT_TAGS);
  tags.forEach((tag) => {
    args.push("--endpoint-tag", tag);
  });

  if (process.env.SCHEMATHESIS_STAGING_ENDPOINTS) {
    process.env.SCHEMATHESIS_STAGING_ENDPOINTS.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((endpoint) => {
        args.push("--endpoint", endpoint);
      });
  }

  logger.info("[schemathesis:staging] Running Schemathesis with args:", args);

  try {
    await runCommand(CLI, args, { cwd: repoRoot });
    logger.info(
      `[schemathesis:staging] Completed. Reports stored under ${reportDir}`,
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      logger.error(
        `[schemathesis:staging] Unable to find "${CLI}". Install Schemathesis via "pip install -r documents/tests/4-contract-tests/schemathesis/requirements.txt" or point SCHEMATHESIS_CLI to the binary.`,
      );
    } else {
      logger.error("[schemathesis:staging] Schemathesis run failed", error);
    }
    process.exitCode = 1;
  }
}

main();
