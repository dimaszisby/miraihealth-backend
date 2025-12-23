import { jest } from "@jest/globals";
import { MetricReadRepoSequelize } from "@/features/metric/infrastructure/persistence/repositories/MetricReadRepoSequelize.js";
import { models } from "@/infrastructure/db/models.js";
describe("MetricReadRepoSequelize", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns paginated list results with cursor + total", async () => {
    const baseMetric = {
      categoryId: null,
      originalMetricId: null,
      description: "desc",
      defaultUnit: "steps",
      isPublic: true,
      deletedAt: null,
      MetricSettings: { goalType: "cumulative" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const rows = [
      { ...baseMetric, id: "metric-1", userId: "user-1", name: "Steps" },
      { ...baseMetric, id: "metric-2", userId: "user-1", name: "Sleep" },
      { ...baseMetric, id: "metric-3", userId: "user-1", name: "Water" },
    ];
    const findAll = jest
      .spyOn(models.Metric, "findAll")
      .mockResolvedValue(rows as any);
    const count = jest
      .spyOn(models.Metric, "count")
      .mockResolvedValue(42 as any);

    const repo = new MetricReadRepoSequelize();

    const result = await repo.listMetrics({
      userId: "user-1",
      limit: 2,
      sort: "-createdAt",
      q: "ste",
      filter: { categoryId: "cat-1" },
      includeTotal: true,
    });

    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
        limit: 3,
        include: expect.any(Array),
        order: expect.any(Array),
      }),
    );
    expect(count).toHaveBeenCalledWith({
      where: expect.any(Object),
      paranoid: false,
    });
    expect(result.items).toHaveLength(2);
    expect(result.limit).toBe(2);
    expect(result.nextCursor).toBeDefined();
    expect(result.totalCount).toBe(42);
  });

  it("fetches detailed metric with requested includes", async () => {
    const metricRow = {
      id: "metric-1",
      userId: "user-1",
      categoryId: null,
      originalMetricId: null,
      name: "Steps",
      description: "desc",
      defaultUnit: "steps",
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      MetricCategory: {
        id: "cat-1",
        name: "Fitness",
        icon: "🔥",
        color: "#fff",
      },
      MetricSettings: {
        goalType: "cumulative",
      },
      MetricLogs: [],
    };
    const findOne = jest
      .spyOn(models.Metric, "findOne")
      .mockResolvedValue(metricRow as any);

    const repo = new MetricReadRepoSequelize();

    const result = await repo.findDetailedMetric({
      userId: "user-1",
      metricId: "metric-1",
      includes: ["category", "settings", "logs"],
      logsLimit: 5,
    });

    expect(findOne).toHaveBeenCalledWith({
      where: { id: "metric-1", userId: "user-1" },
      include: expect.arrayContaining([
        expect.objectContaining({ as: "category" }),
        expect.objectContaining({ as: "settings" }),
        expect.objectContaining({ as: "logs", limit: 5 }),
      ]),
    });
    expect(result?.id).toBe("metric-1");
    expect(result?.userId).toBe("user-1");
  });
});
