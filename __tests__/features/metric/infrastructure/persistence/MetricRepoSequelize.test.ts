import { jest } from "@jest/globals";
import { MetricRepoSequelize } from "@/features/metric/infrastructure/persistence/repositories/MetricRepoSequelize";
import { models } from "@/infrastructure/db/models";

const makeInstance = () => {
  const reload = jest.fn<(options?: any) => Promise<void>>();
  reload.mockResolvedValue(undefined);

  return {
    id: "metric-1",
    userId: "user-1",
    categoryId: "cat-1",
    originalMetricId: null,
    name: "Steps",
    description: "desc",
    defaultUnit: "steps",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    reload,
  };
};

describe("MetricRepoSequelize", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("checks existence by name", async () => {
    const countSpy = jest
      .spyOn(models.Metric, "count")
      .mockResolvedValue(1 as any);
    const repo = new MetricRepoSequelize();

    const exists = await repo.existsByName("user-1", "Steps");

    expect(exists).toBe(true);
    expect(countSpy).toHaveBeenCalledWith({
      where: { userId: "user-1", name: "Steps" },
    });
  });

  it("creates metric row and maps to domain", async () => {
    const instance = makeInstance();
    const createSpy = jest
      .spyOn(models.Metric, "create")
      .mockResolvedValue(instance as any);
    const repo = new MetricRepoSequelize();
    const tx = Symbol("tx");

    const result = await repo.create(
      {
        userId: "user-1",
        categoryId: "cat-1",
        originalMetricId: null,
        name: "Steps",
        description: "desc",
        defaultUnit: "steps",
        isPublic: true,
      },
      tx as any
    );

    expect(createSpy).toHaveBeenCalledWith(
      {
        userId: "user-1",
        categoryId: "cat-1",
        originalMetricId: null,
        name: "Steps",
        description: "desc",
        defaultUnit: "steps",
        isPublic: true,
      },
      { transaction: tx }
    );
    expect(instance.reload).toHaveBeenCalledWith({ transaction: tx });
    expect(result.name).toBe("Steps");
    expect(result.userId).toBe("user-1");
  });
});
