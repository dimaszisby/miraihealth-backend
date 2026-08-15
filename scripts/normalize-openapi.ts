import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import prettier from "prettier";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.join(
  __dirname,
  "../docs/openapi/lakira-backend-openapi.json",
);

async function normalizeOpenApiSpec() {
  const raw = fs.readFileSync(outputFile, "utf-8");
  const prettierConfig = (await prettier.resolveConfig(outputFile)) ?? {};

  const formatted = await prettier.format(raw, {
    ...prettierConfig,
    filepath: outputFile,
    parser: "json",
  });

  fs.writeFileSync(outputFile, formatted, { encoding: "utf-8" });
}

normalizeOpenApiSpec().catch((error) => {
  logger.error("[OpenAPI] Failed to normalize specification:", error);
  process.exitCode = 1;
});
