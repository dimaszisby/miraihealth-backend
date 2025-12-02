import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

/**
 * Load environment variables for the current NODE_ENV before Zod validation.
 * Mirrors the ordering most teams expect:
 *   1. .env.<env>.local
 *   2. .env.<env>
 *   3. .env.local
 *   4. .env
 */
const activeEnv = process.env.NODE_ENV || "development";

const candidateFiles = [
  `.env.${activeEnv}.local`,
  `.env.${activeEnv}`,
  ".env.local",
  ".env",
];

for (const file of candidateFiles) {
  const envPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(envPath)) {
    continue;
  }

  dotenv.config({
    path: envPath,
    override: false, // preserve explicitly provided env vars (e.g., CI secrets)
  });
}
