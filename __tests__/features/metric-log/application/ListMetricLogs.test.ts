import { jest } from "@jest/globals";
import AppError from "@/utils/AppError";
import { ListMetricLogs } from "@/features/metric-log/application/queries/ListMetricLogs";
import type { ListLogsResult } from "@/features/metric-log/application/ports/MetricLogQueryPort";

describe("ListMetricLogs query", () => {
  const response: ListLogsResult = {
    items: [],
    sort: "-createdAt",
    limit: 25,
    nextCursor: undefined,
  };

  it("requires userId", async () => {
    const repo = {
      listLogs: jest.fn<(...args: any[]) => Promise<ListLogsResult>>(),
    } as any;
    const query = new ListMetricLogs(repo);

    await expect(
      query.execute({ userId: "" as any, limit: 25, sort: "-createdAt" })
    ).rejects.toBeInstanceOf(AppError);
    expect(repo.listLogs).not.toHaveBeenCalled();
  });

  it("forwards options to repository", async () => {
    const repo = {
      listLogs: jest
        .fn<(...args: any[]) => Promise<ListLogsResult>>()
        .mockResolvedValue(response),
    } as any;
    const query = new ListMetricLogs(repo);

    const opts = {
      userId: "user-1",
      limit: 5,
      sort: "-updatedAt" as const,
      q: "42",
      filter: { metricId: "metric-1" },
      includeTotal: true,
    };

    const result = await query.execute(opts);

    expect(repo.listLogs).toHaveBeenCalledWith(opts);
    expect(result).toBe(response);
  });
});
