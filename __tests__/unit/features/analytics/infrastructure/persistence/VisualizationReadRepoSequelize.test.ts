import { jest } from "@jest/globals";
import { VisualizationReadRepoSequelize } from "@/features/analytics/infrastructure/persistence/VisualizationReadRepoSequelize";
import { models, sequelize } from "@/infrastructure/db/models";
import AppError from "@/utils/AppError";

const bucketSpec = {
  unit: "day",
  iso: "P1D",
  interval: "1 day",
  trunc: "day",
  approxMs: 86_400_000,
} as const;

const makeCache = () => ({
  getSingleVisualization: jest.fn(),
  setSingleVisualization: jest.fn(),
  getDashboardVisualization: jest.fn(),
  setDashboardVisualization: jest.fn(),
});

describe("VisualizationReadRepoSequelize", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns cached single visualization without hitting SQL", async () => {
    const cache = makeCache() as any;
    const cached = {
      metricId: "metric-1",
      series: [],
      stats: { average: null, min: null, max: null, count: 0 },
      meta: {
        metricId: "metric-1",
        unit: "steps",
        bucket: "1d",
        tz: "UTC",
        range: { startISO: "a", endISO: "b" },
        fill: "none",
      },
    };
    cache.getSingleVisualization.mockResolvedValue(cached);
    jest
      .spyOn(models.Metric, "findOne")
      .mockResolvedValue({ id: "metric-1" } as any);
    const querySpy = jest
      .spyOn(sequelize, "query")
      .mockResolvedValue([] as any);

    const repo = new VisualizationReadRepoSequelize(cache as any);
    const result = await repo.fetchVisualization({
      userId: "user-1",
      metricId: "metric-1",
      startISO: "2024-01-01T00:00:00.000Z",
      endISO: "2024-01-02T00:00:00.000Z",
      bucket: "1d",
      bucketSpec,
      tz: "UTC",
      fill: "none",
    });

    expect(result).toBe(cached);
    expect(cache.setSingleVisualization).not.toHaveBeenCalled();
    expect(querySpy).not.toHaveBeenCalled();
  });

  it("throws when metric ownership check fails", async () => {
    const cache = makeCache() as any;
    cache.getSingleVisualization.mockResolvedValue(null);
    jest.spyOn(models.Metric, "findOne").mockResolvedValue(null);

    const repo = new VisualizationReadRepoSequelize(cache as any);

    await expect(
      repo.fetchVisualization({
        userId: "user-1",
        metricId: "metric-9",
        startISO: "2024-01-01T00:00:00.000Z",
        endISO: "2024-01-02T00:00:00.000Z",
        bucket: "1d",
        bucketSpec,
        tz: "UTC",
        fill: "none",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("hydrates dashboard visualization and caches results when empty cache", async () => {
    const cache = makeCache() as any;
    cache.getDashboardVisualization.mockResolvedValue(null);
    const querySpy = jest.spyOn(sequelize, "query");
    querySpy
      .mockResolvedValueOnce([
        {
          metric_id: "metric-1",
          name: "Steps",
          unit: "steps",
          category_name: "cat",
          category_color: "#fff",
          category_icon: "🔥",
          priority: 1,
          total_count: 1,
          metric_updated_at: "2024-01-01T00:00:00.000Z",
          metric_settings_updated_at: "2024-01-01T00:00:00.000Z",
          category_updated_at: "2024-01-01T00:00:00.000Z",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          metric_id: "metric-1",
          bucket_start: "2024-01-01T00:00:00.000Z",
          avg_value: 2,
          min_value: 1,
          max_value: 3,
          cnt: 1,
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          metric_id: "metric-1",
          first_log_at: "2023-12-31T00:00:00.000Z",
          last_log_at: "2024-01-02T00:00:00.000Z",
          total_logs: 2,
          latest_value: 5,
          latest_bucket_start: "2024-01-02T00:00:00.000Z",
        },
      ] as any);

    const repo = new VisualizationReadRepoSequelize(cache as any);

    const response = await repo.fetchDashboardVisualization({
      userId: "user-1",
      startISO: "2024-01-01T00:00:00.000Z",
      endISO: "2024-01-05T00:00:00.000Z",
      bucket: "1d",
      bucketSpec,
      tz: "UTC",
      fill: "none",
      limit: 5,
    });

    expect(response.items).toHaveLength(1);
    expect(response.items[0].metricId).toBe("metric-1");
    expect(cache.setDashboardVisualization).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        metricIds: ["metric-1"],
      }),
      response,
    );
    expect(querySpy).toHaveBeenCalledTimes(3);
  });
});
