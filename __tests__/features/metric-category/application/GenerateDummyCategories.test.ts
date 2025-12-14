import { jest } from "@jest/globals";
import { GenerateDummyCategories } from "@/features/metric-category/application/use-cases/GenerateDummyCategories";
import { MetricCategory, MetricCategoryProps } from "@/features/metric-category/domain/entities/MetricCategory";
import { METRIC_CATEGORY_CURSOR_NAMESPACE_ALL } from "@/features/metric-category/application/cache.constants";

const buildCategory = (overrides: Partial<MetricCategoryProps> = {}) =>
  MetricCategory.fromProps({
    id: overrides.id ?? "category-id",
    userId: overrides.userId ?? "user-1",
    name: overrides.name ?? "Wellness",
    color: overrides.color ?? "#fff000",
    icon: overrides.icon ?? "🔥",
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    metricCount: overrides.metricCount ?? 0,
    deletedAt: overrides.deletedAt ?? null,
  });

describe("GenerateDummyCategories use-case", () => {
  const userId = "user-1";

  const makeDeps = () => {
    const repo = {
      create: jest.fn<
        (userId: string, data: { name: string; color?: string; icon?: string }) => Promise<MetricCategory>
      >(),
    };
    const cache = {
      get: jest.fn(),
      set: jest.fn(),
      delByPattern: jest.fn<(pattern: string) => Promise<void>>(),
      isEnabled: jest.fn<() => boolean>(() => true),
    };
    const factory = {
      generate: jest.fn<() => { name: string; color: string; icon: string }>(),
    };
    return { repo, cache, factory };
  };

  it("creates the requested number of categories and invalidates cache", async () => {
    const { repo, cache, factory } = makeDeps();
    factory.generate
      .mockReturnValueOnce({ name: "Health", color: "#111111", icon: "💪" })
      .mockReturnValueOnce({ name: "Mindfulness", color: "#222222", icon: "🧘" });
    repo.create
      .mockResolvedValueOnce(buildCategory({ id: "cat-1", name: "Health" }))
      .mockResolvedValueOnce(buildCategory({ id: "cat-2", name: "Mindfulness" }));

    const useCase = new GenerateDummyCategories(
      repo as any,
      cache as any,
      factory as any
    );

    const result = await useCase.execute({ userId, count: 2 });

    expect(result).toHaveLength(2);
    expect(repo.create).toHaveBeenNthCalledWith(1, userId, {
      name: "Health",
      color: "#111111",
      icon: "💪",
    });
    expect(repo.create).toHaveBeenNthCalledWith(2, userId, {
      name: "Mindfulness",
      color: "#222222",
      icon: "🧘",
    });
    expect(cache.delByPattern).toHaveBeenCalledWith(
      `${METRIC_CATEGORY_CURSOR_NAMESPACE_ALL}:${userId}:*`
    );
  });

  it("skips cache invalidation when cache is disabled", async () => {
    const { repo, cache, factory } = makeDeps();
    cache.isEnabled.mockReturnValue(false);
    factory.generate.mockReturnValue({ name: "Focus", color: "#333333", icon: "🎯" });
    repo.create.mockResolvedValue(buildCategory({ id: "cat-3", name: "Focus" }));

    const useCase = new GenerateDummyCategories(
      repo as any,
      cache as any,
      factory as any
    );

    await useCase.execute({ userId, count: 1 });

    expect(cache.delByPattern).not.toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
