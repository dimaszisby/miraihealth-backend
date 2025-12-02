// scripts/generate-openapi.ts

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { getOpenApiDocumentation } from "../src/lib/openapi/openapi-docs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "../documents/openapi");
const outputFile = path.join(outputDir, "lakira-backend-openapi.json");

async function generateOpenApiSpec() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const document = getOpenApiDocumentation();

  fs.writeFileSync(outputFile, JSON.stringify(document, null, 2), {
    encoding: "utf-8",
  });

  console.log(`[OpenAPI] Specification generated at ${outputFile}`);
}

generateOpenApiSpec().catch((error) => {
  console.error("[OpenAPI] Failed to generate specification:", error);
  process.exitCode = 1;
});

