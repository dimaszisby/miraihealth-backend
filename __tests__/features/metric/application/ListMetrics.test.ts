import { jest } from "@jest/globals";
import AppError from "@/utils/AppError";
import { ListMetrics } from "@/features/metric/application/queries/ListMetrics";
import type { ListMetricCategoriesResult } from "@/features/metric/application/ports/MetricReadRepository";

describe("ListMetrics query", () => {
  const baseResult: ListMetricCategoriesResult = {
    items: [],
    nextCursor: undefined,
    sort: "-createdAt",
    limit: 10,
  };

  it("throws when userId is missing", async () => {
    const repo = {
      listMetrics: jest
        .fn<(...args: any[]) => Promise<ListMetricCategoriesResult>>(),
    } as any;
    const query = new ListMetrics(repo);

    await expect(
      query.execute({ userId: "" as any, limit: 10, sort: "-createdAt" })
    ).rejects.toBeInstanceOf(AppError);
    expect(repo.listMetrics).not.toHaveBeenCalled();
  });

  it("delegates to read repository", async () => {
    const repo = {
      listMetrics: jest
        .fn<(...args: any[]) => Promise<ListMetricCategoriesResult>>()
        .mockResolvedValue(baseResult),
    } as any;
    const query = new ListMetrics(repo);

    const output = await query.execute({
      userId: "user-1",
      limit: 5,
      sort: "-createdAt",
      q: "steps",
      filter: { categoryId: "cat-1" },
      includeTotal: true,
    });

    expect(repo.listMetrics).toHaveBeenCalledWith({
      userId: "user-1",
      limit: 5,
      sort: "-createdAt",
      q: "steps",
      filter: { categoryId: "cat-1" },
      includeTotal: true,
    });
    expect(output).toBe(baseResult);
  });
});
