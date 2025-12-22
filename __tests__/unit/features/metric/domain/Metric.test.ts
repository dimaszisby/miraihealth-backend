import { Metric } from "@/features/metric/domain/entities/Metric";

const baseProps = {
  id: "metric-1",
  userId: "user-1",
  name: "Steps",
  defaultUnit: "steps",
  isPublic: true,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  categoryId: null,
  originalMetricId: null,
  description: null,
  deletedAt: null,
};

describe("Metric entity", () => {
  it("renames metric with trimming and updates timestamp", () => {
    const metric = Metric.fromProps({ ...baseProps });
    const before = metric.updatedAt.getTime();

    metric.rename("  Daily Steps  ");

    expect(metric.name).toBe("Daily Steps");
    expect(metric.updatedAt.getTime()).toBeGreaterThan(before);
  });

  it("throws when renaming to empty value", () => {
    const metric = Metric.fromProps({ ...baseProps });
    expect(() => metric.rename("   ")).toThrow("Metric name cannot be empty");
  });

  it("enforces description length", () => {
    const metric = Metric.fromProps({ ...baseProps });
    const longDescription = "a".repeat(513);
    expect(() => metric.describe(longDescription)).toThrow(
      "Metric description exceeds length limit",
    );
  });

  it("sets default unit with trimming and validation", () => {
    const metric = Metric.fromProps({ ...baseProps });
    metric.setDefaultUnit("  km  ");
    expect(metric.defaultUnit).toBe("km");

    expect(() => metric.setDefaultUnit("")).toThrow(
      "Default unit cannot be empty",
    );
  });
});
