import fs from "fs";
import path from "path";

const SRC_FEATURES = path.resolve(__dirname, "../../src/features");

function getFeatureDirs(): string[] {
  const dirs: string[] = [];
  const scopes = ["public", "shared"];

  for (const scope of scopes) {
    const scopeDir = path.join(SRC_FEATURES, scope);
    if (!fs.existsSync(scopeDir)) continue;
    const entries = fs.readdirSync(scopeDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        dirs.push(path.join(scopeDir, entry.name));
      }
    }
  }
  return dirs;
}

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Architecture enforcement", () => {
  const featureDirs = getFeatureDirs();

  describe("required subdirectories per feature", () => {
    const REQUIRED_SUBDIRS = ["application", "infrastructure"];
    // analytics has a domain/ dir with types/buckets — it qualifies
    const DOMAIN_REQUIRED = ["domain"];

    for (const featureDir of featureDirs) {
      const featureName = path.basename(featureDir);

      it(`${featureName} has application/ and infrastructure/`, () => {
        for (const sub of REQUIRED_SUBDIRS) {
          const subPath = path.join(featureDir, sub);
          expect(fs.existsSync(subPath)).toBe(true);
        }
      });

      it(`${featureName} has domain/`, () => {
        for (const sub of DOMAIN_REQUIRED) {
          const subPath = path.join(featureDir, sub);
          expect(fs.existsSync(subPath)).toBe(true);
        }
      });
    }
  });

  describe("no sequelize imports in application layer", () => {
    for (const featureDir of featureDirs) {
      const featureName = path.basename(featureDir);
      const appDir = path.join(featureDir, "application");
      const appFiles = getAllTsFiles(appDir);

      for (const file of appFiles) {
        const relPath = path.relative(SRC_FEATURES, file);
        it(`${featureName}: ${path.basename(file)} does not import sequelize`, () => {
          const content = fs.readFileSync(file, "utf-8");
          const hasSequelizeImport = /from\s+['"]sequelize['"]/.test(content);
          expect(hasSequelizeImport).toBe(false);
        });
      }
    }
  });

  describe("all buildXFeature() accept overrides parameter", () => {
    for (const featureDir of featureDirs) {
      const featureName = path.basename(featureDir);
      const featureFile = path.join(featureDir, "feature.ts");

      if (!fs.existsSync(featureFile)) continue;

      it(`${featureName}/feature.ts buildXFeature accepts overrides`, () => {
        const content = fs.readFileSync(featureFile, "utf-8");
        const fnMatch = content.match(
          /export\s+const\s+build\w+Feature\s*=\s*\(([^)]*)\)/,
        );
        expect(fnMatch).not.toBeNull();
        const params = fnMatch![1].trim();
        // Must have at least one parameter (the overrides bag)
        expect(params.length).toBeGreaterThan(0);
        // The parameter should have a default value of {} (optional)
        expect(params).toContain("=");
      });
    }
  });

  describe("legacy mappers directory does not exist", () => {
    it("src/utils/mappers/ does not exist", () => {
      const mappersDir = path.resolve(__dirname, "../../src/utils/mappers");
      expect(fs.existsSync(mappersDir)).toBe(false);
    });
  });

  describe("admin feature directory does not exist", () => {
    it("src/features/admin/ does not exist", () => {
      const adminDir = path.join(SRC_FEATURES, "admin");
      expect(fs.existsSync(adminDir)).toBe(false);
    });
  });
});
