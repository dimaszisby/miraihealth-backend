// Compatibility shim — keeps relative imports in src/worker.ts (locked) resolving
// after metric-log was moved to src/features/public/metric-log/.
export * from "@/features/public/metric-log/application/use-cases/GenerateDummyMetricLogsHandler.js";
