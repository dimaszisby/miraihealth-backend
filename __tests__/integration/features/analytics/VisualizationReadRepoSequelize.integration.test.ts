import { VisualizationReadRepoSequelize } from "@/features/analytics/infrastructure/persistence/VisualizationReadRepoSequelize.js";
import { resolveBucket } from "@/features/analytics/domain/buckets.js";
import type {
  VisualizationCachePort,
  DashboardVizCacheKey,
  SingleVizCacheKey,
} from "@/features/analytics/application/ports/VisualizationCachePort.js";
import type {
  VizResponse,
  DashboardVizResponse,
  DashboardVizItem,
} from "@/features/analytics/domain/types.js";
import {
  createMetricLogRow,
  createMetricRow,
  createMetricSettingsRow,
  createUserRow,
  truncateAllTables,
} from "../../helpers/db-fixtures.js";

class InMemoryVizCache implements VisualizationCachePort {
  singleStore = new Map<string, VizResponse>();
  dashboardStore = new Map<string, DashboardVizResponse>();
  singleHitsFromCache = 0;
  dashboardHitsFromCache = 0;

  private keySingle(key: SingleVizCacheKey) {
    return JSON.stringify(key);
  }

  private keyDashboard(key: DashboardVizCacheKey) {
    return JSON.stringify(key);
  }

  async getSingleVisualization(
    key: SingleVizCacheKey,
  ): Promise<VizResponse | null> {
    const stored = this.singleStore.get(this.keySingle(key)) ?? null;
    if (stored) this.singleHitsFromCache += 1;
    return stored;
  }

  async setSingleVisualization(
    key: SingleVizCacheKey,
    payload: VizResponse,
  ): Promise<void> {
    this.singleStore.set(this.keySingle(key), payload);
  }

  async getDashboardVisualization(
    key: DashboardVizCacheKey,
  ): Promise<DashboardVizResponse | null> {
    const stored = this.dashboardStore.get(this.keyDashboard(key)) ?? null;
    if (stored) this.dashboardHitsFromCache += 1;
    return stored;
  }

  async setDashboardVisualization(
    key: DashboardVizCacheKey,
    payload: DashboardVizResponse,
  ): Promise<void> {
    this.dashboardStore.set(this.keyDashboard(key), payload);
  }
}

describe("VisualizationReadRepoSequelize (integration)", () => {
  const bucketSpec = resolveBucket("1d");
  let cache: InMemoryVizCache;
  let repo: VisualizationReadRepoSequelize;

  beforeEach(async () => {
    await truncateAllTables();
    cache = new InMemoryVizCache();
    repo = new VisualizationReadRepoSequelize(cache);
  });

  // Developer note: happy-path single-metric visualization fetch covering SQL + cache hydration.
  it("fetches single metric visualization with averages and caches subsequent calls", async () => {
    const user = await createUserRow();
    const metric = await createMetricRow({
      userId: user.id,
      defaultUnit: "km",
    });

    await createMetricLogRow({
      metricId: metric.id,
      logValue: 5,
      loggedAt: new Date("2025-03-01T00:00:00Z"),
    });
    await createMetricLogRow({
      metricId: metric.id,
      logValue: 10,
      loggedAt: new Date("2025-03-02T00:00:00Z"),
    });
    await createMetricLogRow({
      metricId: metric.id,
      logValue: 15,
      loggedAt: new Date("2025-03-03T00:00:00Z"),
    });

    const startISO = "2025-03-01T00:00:00Z";
    const endISO = "2025-03-05T00:00:00Z";
    const first = await repo.fetchVisualization({
      userId: user.id,
      metricId: metric.id,
      startISO,
      endISO,
      bucket: "1d",
      bucketSpec,
      tz: "UTC",
      fill: "zero",
    });

    expect(first.series).toHaveLength(4);
    const seriesValues = first.series.map(
      (point: VizResponse["series"][number]) => point.value,
    );
    expect(seriesValues).toEqual([5, 10, 15, 0]);
    expect(first.stats.count).toBe(3);
    expect(first.meta.unit).toBe("km");

    const second = await repo.fetchVisualization({
      userId: user.id,
      metricId: metric.id,
      startISO,
      endISO,
      bucket: "1d",
      bucketSpec,
      tz: "UTC",
      fill: "zero",
    });
    expect(second).toBe(first);
    expect(cache.singleHitsFromCache).toBe(1);
  });

  it("builds dashboard visualization lists for display-ready metrics and caches them", async () => {
    const user = await createUserRow();
    const metricA = await createMetricRow({ userId: user.id, name: "Run" });
    const metricB = await createMetricRow({ userId: user.id, name: "Lift" });
    await createMetricSettingsRow({
      metricId: metricA.id,
      displayOptions: {
        showOnDashboard: true,
        priority: 1,
        chartType: "line",
        color: "#111111",
      },
    });
    await createMetricSettingsRow({
      metricId: metricB.id,
      displayOptions: {
        showOnDashboard: true,
        priority: 2,
        chartType: "bar",
        color: "#222222",
      },
    });

    await createMetricLogRow({
      metricId: metricA.id,
      logValue: 30,
      loggedAt: new Date("2025-04-10T00:00:00Z"),
    });
    await createMetricLogRow({
      metricId: metricB.id,
      logValue: 60,
      loggedAt: new Date("2025-04-11T00:00:00Z"),
    });

    const params = {
      userId: user.id,
      startISO: "2025-04-09T00:00:00Z",
      endISO: "2025-04-13T00:00:00Z",
      bucket: "1d" as const,
      bucketSpec,
      tz: "UTC",
      fill: "none" as const,
      limit: 5,
    };

    const first = await repo.fetchDashboardVisualization(params);
    const metricIds = first.items
      .map((item: DashboardVizItem) => item.metricId)
      .sort();
    expect(metricIds).toEqual([metricA.id, metricB.id].sort());
    expect(first.meta.count).toBe(2);
    expect(first.sync.etagSeed).toBeDefined();
    expect(
      first.items.every(
        (item: DashboardVizItem) => (item.series ?? []).length > 0,
      ),
    ).toBe(true);

    const second = await repo.fetchDashboardVisualization(params);
    expect(second).toBe(first);
    expect(cache.dashboardHitsFromCache).toBe(1);
  });
});
