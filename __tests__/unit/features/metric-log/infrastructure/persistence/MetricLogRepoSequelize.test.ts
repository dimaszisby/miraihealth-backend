import { jest } from "@jest/globals";
import { MetricLogRepoSequelize } from "@/features/metric-log/infrastructure/persistence/repositories/MetricLogRepoSequelize";
import { MetricLog } from "@/features/metric-log/domain/entities/MetricLog";
import { models } from "@/infrastructure/db/models";

const makeInstance = () => {
  const row = {
    id: "log-1",
    metricId: "metric-1",
    logValue: 10,
    type: "manual",
    loggedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return {
    ...row,
    reload: jest.fn(),
    update: jest.fn(),
  };
};

describe("MetricLogRepoSequelize", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("checks timestamp existence", async () => {
    const countSpy = jest
      .spyOn(models.MetricLog, "count")
      .mockResolvedValue(1 as any);
    const repo = new MetricLogRepoSequelize();

    const exists = await repo.existsAtTimestamp("metric-1", new Date());

    expect(exists).toBe(true);
    expect(countSpy).toHaveBeenCalled();
  });

  it("creates log and maps domain", async () => {
    const instance = makeInstance();
    const createSpy = jest
      .spyOn(models.MetricLog, "create")
      .mockResolvedValue(instance as any);
    const repo = new MetricLogRepoSequelize();

    const result = await repo.create({
      metricId: "metric-1",
      logValue: 10,
      type: "manual",
      loggedAt: new Date(),
    });

    expect(createSpy).toHaveBeenCalled();
    expect(instance.reload).toHaveBeenCalled();
    expect(result.metricId).toBe("metric-1");
  });

  it("saves updates", async () => {
    const instance = makeInstance();
    jest.spyOn(models.MetricLog, "findByPk").mockResolvedValue(instance as any);
    const repo = new MetricLogRepoSequelize();

    const domain = MetricLog.fromProps({
      id: "log-1",
      metricId: "metric-1",
      logValue: 5,
      type: "manual",
      loggedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await repo.save(domain);
    expect(saved.metricId).toBe("metric-1");
  });
});
