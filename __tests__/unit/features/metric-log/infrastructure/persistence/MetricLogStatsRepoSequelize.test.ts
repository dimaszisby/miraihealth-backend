import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";
import { MetricLogStatsRepoSequelize } from "@/features/metric-log/infrastructure/persistence/repositories/MetricLogStatsRepoSequelize.js";
import { models } from "@/infrastructure/db/models.js";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const METRIC_ID = "metric-1";

type AsyncMock<T = unknown> = jest.MockedFunction<
  (...args: any[]) => Promise<T>
>;

const metricLogModel = {
  findAll: jest.fn() as AsyncMock<any[]>,
};
const originalMetricLog = models.MetricLog;
const originalMetric = models.Metric;

beforeAll(() => {
  (models as any).MetricLog = metricLogModel;
  (models as any).Metric = { name: "Metric" };
});

afterAll(() => {
  (models as any).MetricLog = originalMetricLog;
  (models as any).Metric = originalMetric;
});

const repo = new MetricLogStatsRepoSequelize();

describe("MetricLogStatsRepoSequelize.computeStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns zero stats when no logs are found", async () => {
    metricLogModel.findAll.mockResolvedValue([]);

    const result = await repo.computeStats({
      organizationId: ORG_ID,
      userId: USER_ID,
      metricId: METRIC_ID,
    });

    expect(result).toEqual({ average: 0, min: 0, max: 0 });
  });

  it("queries by metricId + organizationId and skips JOIN when metricId is provided", async () => {
    metricLogModel.findAll.mockResolvedValue([{ logValue: 10 }]);

    await repo.computeStats({
      organizationId: ORG_ID,
      userId: USER_ID,
      metricId: METRIC_ID,
    });

    const call = metricLogModel.findAll.mock.calls[0][0] as any;
    expect(call.where).toEqual({
      metricId: METRIC_ID,
      organizationId: ORG_ID,
    });
    expect(call.include).toBeUndefined();
  });

  it("queries by organizationId only and adds userId-scoped INNER JOIN when metricId is omitted", async () => {
    metricLogModel.findAll.mockResolvedValue([{ logValue: 5 }]);

    await repo.computeStats({ organizationId: ORG_ID, userId: USER_ID });

    const call = metricLogModel.findAll.mock.calls[0][0] as any;
    expect(call.where).toEqual({ organizationId: ORG_ID });
    expect(call.include).toHaveLength(1);
    expect(call.include[0]).toMatchObject({
      as: "metric",
      attributes: [],
      required: true,
      where: { userId: USER_ID, organizationId: ORG_ID },
    });
  });

  it("computes correct average, min, and max from a single log", async () => {
    metricLogModel.findAll.mockResolvedValue([{ logValue: 42 }]);

    const result = await repo.computeStats({
      organizationId: ORG_ID,
      metricId: METRIC_ID,
    });

    expect(result).toEqual({ average: 42, min: 42, max: 42 });
  });

  it("computes correct average, min, and max from multiple logs", async () => {
    metricLogModel.findAll.mockResolvedValue([
      { logValue: 10 },
      { logValue: 20 },
      { logValue: 30 },
    ]);

    const result = await repo.computeStats({
      organizationId: ORG_ID,
      metricId: METRIC_ID,
    });

    expect(result).toEqual({ average: 20, min: 10, max: 30 });
  });

  it("treats non-numeric logValue as 0 when computing stats", async () => {
    metricLogModel.findAll.mockResolvedValue([
      { logValue: null },
      { logValue: 10 },
    ]);

    const result = await repo.computeStats({
      organizationId: ORG_ID,
      metricId: METRIC_ID,
    });

    expect(result).toEqual({ average: 5, min: 0, max: 10 });
  });
});
