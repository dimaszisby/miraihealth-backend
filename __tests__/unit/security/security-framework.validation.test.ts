import fs from "node:fs";
import path from "node:path";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

const ROOT = process.cwd();
const AUDIT_ROOT = path.join(ROOT, "documents/security/audit");
const TEMPLATE_ROOT = path.join(ROOT, "documents/security/templates/audit-run");
const TMP_ROOT = path.join(ROOT, "tmp/security/framework-tests");
const INIT_SCRIPT = path.join(ROOT, "scripts/security/init-audit-doc-kit.mjs");
const GATE_SCRIPT = path.join(ROOT, "scripts/security/evaluate-gate.mjs");
const GATE_POLICY = path.join(
  ROOT,
  "documents/security/framework/ci-gate-policy.json",
);

const SAMPLE_AUDIT_DATE = "2099-12-31";
const SAMPLE_AUDIT_DIR = path.join(AUDIT_ROOT, `audit-${SAMPLE_AUDIT_DATE}`);

const REQUIRED_AUDIT_FILES = [
  "README.md",
  "audit-plan.md",
  "audit-checklist.md",
  "threat-model.md",
  "control-matrix.md",
  "findings-log.md",
  "remediation-plan.md",
  "decisions.md",
  "incidents.md",
  "metrics-tracker.md",
  "portfolio-summary.md",
];

const FINDINGS_REQUIRED_COLUMNS = [
  "finding_id",
  "title",
  "domain",
  "severity",
  "cvss",
  "likelihood",
  "impact",
  "business_risk",
  "owasp_asvs_ref",
  "owasp_top10_ref",
  "nist_ssdf_ref",
  "cwe_ref",
  "affected_assets",
  "entry_points",
  "evidence_refs",
  "repro_steps",
  "status",
  "owner",
  "sla_due_date",
  "target_fix_version",
  "verified_date",
  "notes",
];

const THREAT_REQUIRED_COLUMNS = [
  "threat_id",
  "stride_category",
  "asset",
  "actor",
  "entry_point",
  "trust_boundary",
  "preconditions",
  "attack_path",
  "impact",
  "existing_controls",
  "proposed_controls",
  "risk_rating",
];

const CONTROL_REQUIRED_COLUMNS = [
  "control_id",
  "control_objective",
  "framework_mapping",
  "implementation_status",
  "verification_method",
  "evidence_refs",
  "gap_level",
  "remediation_link",
];

const runNodeScript = (
  scriptPath: string,
  args: string[],
): SpawnSyncReturns<string> =>
  spawnSync("node", [scriptPath, ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });

const assertExitCode = (
  result: SpawnSyncReturns<string>,
  expected: number,
): void => {
  if (result.status !== expected) {
    throw new Error(
      `Expected exit code ${expected}, got ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
};

const parseFirstTableHeader = (markdown: string): string[] => {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());

  for (let i = 0; i < lines.length - 1; i += 1) {
    const header = lines[i];
    const separator = lines[i + 1];
    if (!header.startsWith("|") || !separator.startsWith("|")) continue;
    if (!separator.includes("---")) continue;

    return header
      .split("|")
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  }

  throw new Error("Markdown table header not found");
};

const expectColumnsPresent = (
  markdownPath: string,
  requiredColumns: string[],
): void => {
  const content = fs.readFileSync(markdownPath, "utf8");
  const headerColumns = parseFirstTableHeader(content);
  expect(headerColumns).toEqual(expect.arrayContaining(requiredColumns));
};

const writeJson = (filePath: string, payload: unknown): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
};

const buildDeltaReport = (findings: unknown[]) => ({
  schemaVersion: "1.0.0",
  generatedAtUtc: "2026-02-18T00:00:00.000Z",
  findings,
});

beforeAll(() => {
  fs.rmSync(SAMPLE_AUDIT_DIR, { recursive: true, force: true });
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  fs.mkdirSync(TMP_ROOT, { recursive: true });
});

afterAll(() => {
  fs.rmSync(SAMPLE_AUDIT_DIR, { recursive: true, force: true });
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});

describe("security framework validation suite", () => {
  it("template completeness: init script creates every required audit artifact", () => {
    const initResult = runNodeScript(INIT_SCRIPT, [
      "--date",
      SAMPLE_AUDIT_DATE,
      "--force",
    ]);
    assertExitCode(initResult, 0);

    for (const fileName of REQUIRED_AUDIT_FILES) {
      const artifactPath = path.join(SAMPLE_AUDIT_DIR, fileName);
      expect(fs.existsSync(artifactPath)).toBe(true);
    }
  });

  it("schema conformance: templates and current run include required table columns/sections", () => {
    const templateFiles = [
      "run-README.md",
      "audit-plan.md",
      "audit-checklist.md",
      "threat-model.md",
      "control-matrix.md",
      "findings-log.md",
      "remediation-plan.md",
      "decisions.md",
      "incidents.md",
      "metrics-tracker.md",
      "portfolio-summary.md",
    ];

    for (const templateName of templateFiles) {
      const templatePath = path.join(TEMPLATE_ROOT, templateName);
      expect(fs.existsSync(templatePath)).toBe(true);
      const content = fs.readFileSync(templatePath, "utf8");
      expect(content).toContain("## Definition of Done");
    }

    const currentAuditDir = path.join(AUDIT_ROOT, "audit-2026-02-18");
    expectColumnsPresent(
      path.join(TEMPLATE_ROOT, "findings-log.md"),
      FINDINGS_REQUIRED_COLUMNS,
    );
    expectColumnsPresent(
      path.join(currentAuditDir, "findings-log.md"),
      FINDINGS_REQUIRED_COLUMNS,
    );
    expectColumnsPresent(
      path.join(TEMPLATE_ROOT, "threat-model.md"),
      THREAT_REQUIRED_COLUMNS,
    );
    expectColumnsPresent(
      path.join(currentAuditDir, "threat-model.md"),
      THREAT_REQUIRED_COLUMNS,
    );
    expectColumnsPresent(
      path.join(TEMPLATE_ROOT, "control-matrix.md"),
      CONTROL_REQUIRED_COLUMNS,
    );
    expectColumnsPresent(
      path.join(currentAuditDir, "control-matrix.md"),
      CONTROL_REQUIRED_COLUMNS,
    );
  });

  it("gate policy: open critical finding fails", () => {
    const inputPath = path.join(TMP_ROOT, "critical-open-input.json");
    const outputPath = path.join(TMP_ROOT, "critical-open-output.json");
    writeJson(
      inputPath,
      buildDeltaReport([
        {
          id: "SIM-CRIT-001",
          severity: "critical",
          status: "open",
          targetFixVersion: "next-patch",
          slaDueDate: "2026-02-19T00:00:00.000Z",
        },
      ]),
    );

    const result = runNodeScript(GATE_SCRIPT, [
      "--input",
      inputPath,
      "--policy",
      GATE_POLICY,
      "--output",
      outputPath,
    ]);
    assertExitCode(result, 1);

    const gateResult = JSON.parse(fs.readFileSync(outputPath, "utf8")) as {
      passed: boolean;
      totals: { blocking: number };
    };
    expect(gateResult.passed).toBe(false);
    expect(gateResult.totals.blocking).toBe(1);
  });

  it("gate policy: accepted high with valid exception passes", () => {
    const inputPath = path.join(TMP_ROOT, "high-accepted-input.json");
    const outputPath = path.join(TMP_ROOT, "high-accepted-output.json");
    const futureDate = new Date();
    futureDate.setUTCDate(futureDate.getUTCDate() + 14);

    writeJson(
      inputPath,
      buildDeltaReport([
        {
          id: "SIM-HIGH-001",
          severity: "high",
          status: "accepted",
          exception: {
            expiresAtUtc: futureDate.toISOString(),
          },
          targetFixVersion: "next-patch",
          slaDueDate: "2026-02-25T00:00:00.000Z",
        },
      ]),
    );

    const result = runNodeScript(GATE_SCRIPT, [
      "--input",
      inputPath,
      "--policy",
      GATE_POLICY,
      "--output",
      outputPath,
    ]);
    assertExitCode(result, 0);

    const gateResult = JSON.parse(fs.readFileSync(outputPath, "utf8")) as {
      passed: boolean;
      totals: { blocking: number };
    };
    expect(gateResult.passed).toBe(true);
    expect(gateResult.totals.blocking).toBe(0);
  });

  it("gate policy: open medium remains non-blocking and logs backlog warning when tracking fields are missing", () => {
    const inputPath = path.join(TMP_ROOT, "medium-open-input.json");
    const outputPath = path.join(TMP_ROOT, "medium-open-output.json");
    writeJson(
      inputPath,
      buildDeltaReport([
        {
          id: "SIM-MED-001",
          severity: "medium",
          status: "open",
        },
      ]),
    );

    const result = runNodeScript(GATE_SCRIPT, [
      "--input",
      inputPath,
      "--policy",
      GATE_POLICY,
      "--output",
      outputPath,
    ]);
    assertExitCode(result, 0);

    const gateResult = JSON.parse(fs.readFileSync(outputPath, "utf8")) as {
      passed: boolean;
      totals: { blocking: number; backlogWarnings: number };
    };
    expect(gateResult.passed).toBe(true);
    expect(gateResult.totals.blocking).toBe(0);
    expect(gateResult.totals.backlogWarnings).toBe(1);
  });
});
