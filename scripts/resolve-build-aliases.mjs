#!/usr/bin/env node

/**
 * Rewrite compiled imports in `dist/**` so bare "@/foo/bar" aliases become
 * relative paths that Node can resolve at runtime.
 */

import path from "path";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import logger from "./logger";

const DIST_ROOT = path.resolve(process.cwd(), "dist");
const JS_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
const ALIAS_PREFIX = "@/";

const patterns = [
  {
    regex: /((?:import|export)[\s\S]*?\sfrom\s+)(['"])(@\/[^'"]+)(['"])/g,
    replacer: ([prefix, open, spec, close], filePath) =>
      `${prefix}${open}${resolveAlias(spec, filePath)}${close}`,
  },
  {
    regex: /(\bimport\s+)(['"])(@\/[^'"]+)(['"])/g,
    replacer: ([keyword, open, spec, close], filePath) =>
      `${keyword}${open}${resolveAlias(spec, filePath)}${close}`,
  },
  {
    regex: /(require\(\s*)(['"])(@\/[^'"]+)(['"])(\s*\))/g,
    replacer: ([prefix, open, spec, close, suffix], filePath) =>
      `${prefix}${open}${resolveAlias(spec, filePath)}${close}${suffix}`,
  },
  {
    regex: /(import\(\s*)(['"])(@\/[^'"]+)(['"])(\s*\))/g,
    replacer: ([prefix, open, spec, close, suffix], filePath) =>
      `${prefix}${open}${resolveAlias(spec, filePath)}${close}${suffix}`,
  },
];

async function main() {
  const files = await collectJsFiles(DIST_ROOT);
  await Promise.all(
    files.map(async (filePath) => {
      const original = await fs.readFile(filePath, "utf8");
      const updated = applyPatterns(original, filePath);
      if (updated !== original) {
        await fs.writeFile(filePath, updated, "utf8");
      }
    }),
  );
}

function applyPatterns(source, filePath) {
  return patterns.reduce((code, pattern) => {
    return code.replace(pattern.regex, function (...args) {
      const groups = args.slice(1, -2);
      return pattern.replacer(groups, filePath);
    });
  }, source);
}

async function collectJsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectJsFiles(fullPath);
      }
      return JS_EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : [];
    }),
  );
  return files.flat();
}

function resolveAlias(specifier, fromFile) {
  if (!specifier.startsWith(ALIAS_PREFIX)) {
    return specifier;
  }

  const relPath = specifier.slice(ALIAS_PREFIX.length);
  const candidates = [
    path.resolve(DIST_ROOT, relPath),
    path.resolve(DIST_ROOT, `${relPath}.js`),
    path.resolve(DIST_ROOT, relPath, "index.js"),
  ];

  const targetPath = candidates.find((candidate) => existsSync(candidate));

  if (!targetPath) {
    throw new Error(
      `[alias-resolver] Unable to resolve "${specifier}" from ${fromFile}`,
    );
  }

  const relative = path.relative(path.dirname(fromFile), targetPath);
  const normalized = relative.startsWith(".") ? relative : `./${relative}`;

  return normalized.replace(/\\/g, "/");
}

main().catch((error) => {
  logger.error("[alias-resolver] Failed to rewrite build aliases:", error);
  process.exitCode = 1;
});
