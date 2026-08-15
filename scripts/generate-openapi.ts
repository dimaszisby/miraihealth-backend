// scripts/generate-openapi.ts

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import logger from "../src/utils/logger.js";

import { getOpenApiDocumentation } from "../src/lib/openapi/openapi-docs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "../docs/reference/api");
const outputFile = path.join(outputDir, "lakira-backend-openapi.json");

async function generateOpenApiSpec() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const document = getOpenApiDocumentation();

  const payload = `${JSON.stringify(document, null, 2)}\n`;

  fs.writeFileSync(outputFile, payload, {
    encoding: "utf-8",
  });

  logger.info(`[OpenAPI] Specification generated at ${outputFile}`);
}

generateOpenApiSpec().catch((error) => {
  logger.error("[OpenAPI] Failed to generate specification:", error);
  process.exitCode = 1;
});
