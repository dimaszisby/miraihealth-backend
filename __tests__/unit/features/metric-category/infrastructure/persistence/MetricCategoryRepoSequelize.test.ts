import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  jest,
} from "@jest/globals";
import { Op } from "sequelize";
import { MetricCategoryRepoSequelize } from "@/features/metric-category/infrastructure/persistence/repositories/MetricCategoryRepoSequelize.js";
import { models } from "@/infrastructure/db/models.js";
import type { MetricCategoryRow } from "@/features/metric-category/infrastructure/mappers/MetricCategoryMapper.js";

const TEST_ORG_ID = "org-test-id";

const repo = new MetricCategoryRepoSequelize();

type AsyncMock<T = unknown, A extends any[] = any[]> = jest.MockedFunction<
  (...args: A) => Promise<T>
>;

type MetricCategoryModelMock = {
  findOne: AsyncMock<any>;
  count: AsyncMock<number>;
  create: AsyncMock<any>;
  findByPk: AsyncMock<any>;
  destroy: AsyncMock<void>;
  findAll: AsyncMock<any[]>;
};

const makeAsyncMock = <T = any>() => jest.fn<(...args: any[]) => Promise<T>>();

const metricCategoryModel: MetricCategoryModelMock = {
  findOne: makeAsyncMock(),
  count: makeAsyncMock<number>(),
  create: makeAsyncMock(),
  findByPk: makeAsyncMock(),
  destroy: makeAsyncMock(),
  findAll: makeAsyncMock<any[]>(),
};

const originalModel = models.MetricCategory;

beforeAll(() => {
  (models as any).MetricCategory = metricCategoryModel;
});

afterAll(() => {
  (models as any).MetricCategory = originalModel;
});

const buildRow = (
  overrides: Partial<MetricCategoryRow> = {},
): MetricCategoryRow => ({
  id: overrides.id ?? "category-1",
  userId: overrides.userId ?? "user-1",
  name: overrides.name ?? "Planning",
  color: overrides.color ?? "#123456",
  icon: overrides.icon ?? "🔥",
  createdAt: overrides.createdAt ?? new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: overrides.updatedAt ?? new Date("2025-01-02T00:00:00.000Z"),
  deletedAt: overrides.deletedAt ?? null,
  metricCount: overrides.metricCount ?? 3,
});

describe("MetricCategoryRepoSequelize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(metricCategoryModel).forEach((mock) => mock.mockReset());
  });

  describe("findById", () => {
    it("returns mapped domain entity when row exists", async () => {
      metricCategoryModel.findOne.mockResolvedValue(buildRow({ id: "cat-9" }));

      const result = await repo.findById("user-1", TEST_ORG_ID, "cat-9");

      expect(metricCategoryModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "cat-9",
            userId: "user-1",
            organizationId: TEST_ORG_ID,
            deletedAt: null,
          },
          raw: true,
          nest: true,
        }),
      );
      expect(result?.id).toBe("cat-9");
      expect(result?.metricCount).toBe(3);
    });

    it("returns null when row missing", async () => {
      metricCategoryModel.findOne.mockResolvedValue(null);

      expect(await repo.findById("user-1", TEST_ORG_ID, "missing")).toBeNull();
    });
  });

  it("existsByName returns true when count greater than zero", async () => {
    metricCategoryModel.count.mockResolvedValue(2);

    await expect(
      repo.existsByName("user-1", TEST_ORG_ID, "Planning"),
    ).resolves.toBe(true);
    expect(metricCategoryModel.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        organizationId: TEST_ORG_ID,
        name: "Planning",
      },
    });
  });

  describe("create", () => {
    it("persists defaults and reloads with metric count", async () => {
      metricCategoryModel.create.mockResolvedValue({ id: "cat-1" });
      metricCategoryModel.findByPk.mockResolvedValue(
        buildRow({ id: "cat-1", name: "Deep Work", metricCount: 0 }),
      );

      const created = await repo.create("user-1", "org-1", {
        name: "Deep Work",
      });

      expect(metricCategoryModel.create).toHaveBeenCalledWith({
        userId: "user-1",
        organizationId: "org-1",
        name: "Deep Work",
        color: "#E897A3",
        icon: "📁",
      });
      expect(metricCategoryModel.findByPk).toHaveBeenCalledWith("cat-1", {
        attributes: expect.objectContaining({ include: expect.any(Array) }),
        raw: true,
        nest: true,
      });
      expect(created.id).toBe("cat-1");
      expect(created.metricCount).toBe(0);
    });
  });

  describe("update", () => {
    it("throws when category cannot be found for user", async () => {
      metricCategoryModel.findOne.mockResolvedValue(null);

      await expect(
        repo.update("user-1", TEST_ORG_ID, "cat-1", { name: "Focus" }),
      ).rejects.toThrow("Category not found");
    });

    it("updates row and returns reloaded domain entity", async () => {
      const row: any = {
        update: makeAsyncMock<void>().mockResolvedValue(undefined),
      };
      metricCategoryModel.findOne.mockResolvedValue(row);
      metricCategoryModel.findByPk.mockResolvedValue(
        buildRow({ id: "cat-2", name: "Focus" }),
      );

      const updated = await repo.update("user-1", TEST_ORG_ID, "cat-2", {
        name: "Focus",
      });

      expect(row.update).toHaveBeenCalledWith({ name: "Focus" });
      expect(metricCategoryModel.findByPk).toHaveBeenCalledWith("cat-2", {
        attributes: expect.objectContaining({ include: expect.any(Array) }),
        raw: true,
        nest: true,
      });
      expect(updated.name).toBe("Focus");
    });
  });

  it("delete removes record scoped to user", async () => {
    metricCategoryModel.destroy.mockResolvedValue(undefined);

    await repo.delete("user-1", TEST_ORG_ID, "cat-1");

    expect(metricCategoryModel.destroy).toHaveBeenCalledWith({
      where: { id: "cat-1", userId: "user-1", organizationId: TEST_ORG_ID },
    });
  });

  describe("list", () => {
    it("returns paginated rows with cursor metadata and optional total", async () => {
      const first = buildRow({ id: "cat-1", name: "Alpha" });
      const second = buildRow({ id: "cat-2", name: "Bravo" });
      metricCategoryModel.findAll.mockResolvedValue([first, second]);
      metricCategoryModel.count.mockResolvedValue(8);

      const result = await repo.list({
        userId: "user-1",
        organizationId: TEST_ORG_ID,
        limit: 1,
        sort: "createdAt",
        includeTotal: true,
        q: "alp",
        filter: { name: "Al" },
      });

      expect(metricCategoryModel.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        }),
      );
      const args = metricCategoryModel.findAll.mock.calls[0][0];
      expect(args.limit).toBe(2); // limit + 1 to detect hasMore
      expect(Array.isArray(args.order)).toBe(true);
      expect(args.attributes).toEqual(
        expect.objectContaining({ include: expect.any(Array) }),
      );
      expect(args.where[Op.and]).toEqual(
        expect.arrayContaining([
          { userId: "user-1" },
          { organizationId: TEST_ORG_ID },
          { deletedAt: null },
        ]),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("cat-1");
      expect(result.nextCursor).toBeDefined();
      expect(result.totalCount).toBe(8);
      expect(result.q).toBe("alp");
      expect(result.filter).toEqual({ name: "Al" });
    });
  });
});
