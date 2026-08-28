import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";

/**
 * Structural validation of the generated OpenAPI document.
 *
 * `docs:openapi:check` only diffs the generated spec against the committed one, so a
 * spec that is *self-consistently* wrong passes it: both sides contain the same defect
 * and match perfectly. That is how a dangling
 * `#/components/responses/TooManyRequestsError` reached `dev` — it broke
 * lakira-frontend's `api:types:generate`, because this spec is a contract another repo
 * compiles against, while every gate here stayed green.
 *
 * This checks the document is *valid*, not merely *unchanged*.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const specFile = path.join(
  __dirname,
  "../docs/reference/api/lakira-backend-openapi.json",
);

type Json = unknown;

/** Every `$ref` string in the document, with a path to where it was found. */
const collectRefs = (node: Json, at: string, out: [string, string][]): void => {
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectRefs(item, `${at}[${i}]`, out));
    return;
  }
  if (node === null || typeof node !== "object") return;

  for (const [key, value] of Object.entries(node as Record<string, Json>)) {
    if (key === "$ref" && typeof value === "string") {
      out.push([value, at]);
      continue;
    }
    collectRefs(value, `${at}/${key}`, out);
  }
};

/** Walks a `#/a/b/c` pointer through the document. Returns undefined if absent. */
const resolvePointer = (doc: Json, ref: string): Json | undefined => {
  const segments = ref
    .slice(2)
    .split("/")
    .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));

  let cursor: Json = doc;
  for (const segment of segments) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, Json>)[segment];
    if (cursor === undefined) return undefined;
  }
  return cursor;
};

const validate = (): string[] => {
  const doc = JSON.parse(fs.readFileSync(specFile, "utf-8")) as Record<
    string,
    Json
  >;
  const problems: string[] = [];

  // 1. Every $ref resolves, and none point outside this single-file document.
  const refs: [string, string][] = [];
  collectRefs(doc, "", refs);

  for (const [ref, at] of refs) {
    if (!ref.startsWith("#/")) {
      problems.push(
        `external $ref "${ref}" at ${at} — the spec must be self-contained`,
      );
      continue;
    }
    if (resolvePointer(doc, ref) === undefined) {
      problems.push(`dangling $ref "${ref}" at ${at}`);
    }
  }

  // 2. Operation ids must be unique — downstream type generators key on them.
  const paths = (doc.paths ?? {}) as Record<string, Record<string, Json>>;
  const seen = new Map<string, string>();
  let operationCount = 0;

  for (const [route, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (operation === null || typeof operation !== "object") continue;
      operationCount += 1;

      const op = operation as Record<string, Json>;

      // 3. An operation with no responses generates unusable client types.
      const responses = op.responses as Record<string, Json> | undefined;
      if (!responses || Object.keys(responses).length === 0) {
        problems.push(`${method.toUpperCase()} ${route} declares no responses`);
      }

      const id = op.operationId;
      if (typeof id !== "string") continue;
      const previous = seen.get(id);
      if (previous) {
        problems.push(
          `duplicate operationId "${id}" on ${method.toUpperCase()} ${route} and ${previous}`,
        );
      } else {
        seen.set(id, `${method.toUpperCase()} ${route}`);
      }
    }
  }

  logger.info(
    `[OpenAPI] Validated ${operationCount} operations and ${refs.length} $refs.`,
  );
  return problems;
};

try {
  const problems = validate();

  if (problems.length > 0) {
    logger.error(
      `[OpenAPI] Specification is invalid — ${problems.length} problem(s):`,
    );
    problems.forEach((p) => logger.error(`  - ${p}`));
    process.exit(1);
  }

  logger.info("[OpenAPI] Specification is structurally valid.");
} catch (error) {
  logger.error("[OpenAPI] Failed to validate specification:", error);
  process.exit(1);
}
