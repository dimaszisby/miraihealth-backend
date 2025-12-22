import { MetricLog } from "@/features/metric-log/domain/entities/MetricLog";

const baseProps = {
  id: "log-1",
  metricId: "metric-1",
  logValue: 10,
  type: "manual" as const,
  loggedAt: new Date("2024-01-01T00:00:00.000Z"),
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("MetricLog entity", () => {
  it("updates value and timestamps", () => {
    const log = MetricLog.fromProps({ ...baseProps });
    const before = log.updatedAt.getTime();
    log.setLogValue(42);
    expect(log.logValue).toBe(42);
    expect(log.updatedAt.getTime()).toBeGreaterThan(before);
  });

  it("throws when setting invalid value", () => {
    const log = MetricLog.fromProps({ ...baseProps });
    expect(() => log.setLogValue(Number.NaN)).toThrow(
      "Metric log value must be a finite number",
    );
  });

  it("normalizes loggedAt values", () => {
    const log = MetricLog.fromProps({ ...baseProps });
    const next = new Date("2024-02-02T00:00:00.000Z");
    log.setLoggedAt(next);
    expect(log.loggedAt.toISOString()).toBe(next.toISOString());
  });
});
