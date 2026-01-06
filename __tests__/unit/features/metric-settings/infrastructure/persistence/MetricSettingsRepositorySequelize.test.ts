import { jest } from "@jest/globals";
import { MetricSettingsRepositorySequelize } from "@/features/metric-settings/infrastructure/persistence/MetricSettingsRepositorySequelize.js";
import { models } from "@/infrastructure/db/models.js";
import AppError from "@/utils/AppError.js";
import { buildMetricSettings } from "../../../../factories/metric-settings.js";
import { UniqueConstraintError, ValidationErrorItem } from "sequelize";

const repo = new MetricSettingsRepositorySequelize();

type AsyncFn<T = any> = (...args: any[]) => Promise<T>;
type AsyncMock<T = any> = jest.MockedFunction<AsyncFn<T>>;

type MetricSettingsModelMock = {
  create: AsyncMock;
  findOne: AsyncMock;
  findByPk: AsyncMock;
  destroy: AsyncMock;
  findAll: AsyncMock;
  count: AsyncMock;
};

const makeAsyncMock = <T = any>() => jest.fn<AsyncFn<T>>();

const originalModel = models.MetricSettings;
const metricSettingsModel: MetricSettingsModelMock = {
  create: makeAsyncMock(),
  findOne: makeAsyncMock(),
  findByPk: makeAsyncMock(),
  destroy: makeAsyncMock(),
  findAll: makeAsyncMock(),
  count: makeAsyncMock(),
};

beforeAll(() => {
  (models as any).MetricSettings = metricSettingsModel;
});

afterAll(() => {
  (models as any).MetricSettings = originalModel;
});

const makeUniqueConstraintError = () => {
  const item = new ValidationErrorItem(
    "metric_id duplicate",
    "unique violation",
    "metric_id",
    "metric_id",
    null as any,
    "unique",
    "fn",
    [],
  );
  return new UniqueConstraintError({ errors: [item] });
};

describe("MetricSettingsRepositorySequelize", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.values(metricSettingsModel).forEach((mock) => mock.mockReset());
  });

  describe("create", () => {
    it("creates settings and reloads with metric include", async () => {
      const created: any = {
        reload: makeAsyncMock().mockResolvedValue(undefined),
        id: "settings-1",
        metricId: "metric-1",
        isActive: true,
        goalEnabled: false,
        goalType: null,
        goalValue: null,
        timeFrameEnabled: false,
        startDate: null,
        deadlineDate: null,
        alertEnabled: false,
        alertThresholds: null,
        isAchieved: false,
        displayOptions: {
          showOnDashboard: true,
          priority: 1,
          chartType: "line",
          color: "#E897A3",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        metric: { id: "metric-1", userId: "user-1" },
      };
      metricSettingsModel.create.mockResolvedValue(created);

      const result = await repo.create({
        metricId: "metric-1",
        isActive: true,
        goalEnabled: false,
        goalType: null,
        goalValue: null,
        timeFrameEnabled: false,
        startDate: null,
        deadlineDate: null,
        alertEnabled: false,
        alertThresholds: null,
        isAchieved: false,
        displayOptions: {
          showOnDashboard: true,
          priority: 1,
          chartType: "line",
          color: "#E897A3",
        },
      });

      expect(metricSettingsModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ metricId: "metric-1" }),
      );
      expect(created.reload).toHaveBeenCalled();
      expect(result).toMatchObject({ id: "settings-1", metricId: "metric-1" });
    });

    it("maps unique constraint to AppError", async () => {
      metricSettingsModel.create.mockRejectedValue(makeUniqueConstraintError());

      await expect(
        repo.create({
          metricId: "metric-2",
          isActive: true,
          goalEnabled: false,
          goalType: null,
          goalValue: null,
          timeFrameEnabled: false,
          startDate: null,
          deadlineDate: null,
          alertEnabled: false,
          alertThresholds: null,
          isAchieved: false,
          displayOptions: {
            showOnDashboard: true,
            priority: 1,
            chartType: "line",
            color: "#E897A3",
          },
        }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("findById", () => {
    it("returns entity when owner matches", async () => {
      const entity = buildMetricSettings({ id: "settings-9" });
      metricSettingsModel.findOne.mockResolvedValue({
        ...entity.snapshot(),
        metric: { id: "metric-1", userId: "user-1" },
      });

      const result = await repo.findById("user-1", "settings-9");
      expect(result?.id).toBe("settings-9");
    });

    it("throws AppError when owner mismatches", async () => {
      metricSettingsModel.findOne.mockResolvedValue({
        metric: { userId: "other-user" },
      });

      await expect(
        repo.findById("user-1", "settings-9"),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("save", () => {
    it("throws when row missing", async () => {
      metricSettingsModel.findByPk.mockResolvedValue(null);
      const entity = buildMetricSettings();

      await expect(repo.save(entity)).rejects.toBeInstanceOf(AppError);
    });

    it("updates persistence row and returns reloaded entity", async () => {
      const entity = buildMetricSettings({
        id: "settings-10",
        metricId: "metric-1",
      });
      const row: any = {
        update: jest.fn<AsyncFn<void>>().mockResolvedValue(undefined),
        reload: jest.fn<AsyncFn<any>>().mockImplementation(async () => {
          Object.assign(row, {
            ...entity.snapshot(),
            metric: { id: "metric-1", userId: "user-1" },
          });
          return row;
        }),
      };
      metricSettingsModel.findByPk.mockResolvedValue(row);

      const result = await repo.save(entity);

      expect(row.update).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: entity.snapshot().isActive }),
      );
      expect(row.reload).toHaveBeenCalled();
      expect(result.id).toBe("settings-10");
    });
  });

  describe("delete", () => {
    it("invokes destroy with id", async () => {
      metricSettingsModel.destroy.mockResolvedValue(1);
      await repo.delete(buildMetricSettings({ id: "settings-12" }));
      expect(metricSettingsModel.destroy).toHaveBeenCalledWith({
        where: { id: "settings-12" },
      });
    });
  });

  describe("findByMetricId", () => {
    it("returns entity when found", async () => {
      const entity = buildMetricSettings({ metricId: "metric-xyz" });
      metricSettingsModel.findOne.mockResolvedValue({
        ...entity.snapshot(),
        metric: { id: "metric-xyz", userId: "user-1" },
      });
      const result = await repo.findByMetricId("metric-xyz");
      expect(result?.metricId).toBe("metric-xyz");
    });
  });

  describe("listByCursor", () => {
    it("returns paginated items and nextCursor", async () => {
      const item = {
        ...buildMetricSettings({ id: "settings-11" }).snapshot(),
        metric: { id: "metric-1", userId: "user-1" },
      };
      metricSettingsModel.findAll.mockResolvedValue([item, item, item]);
      metricSettingsModel.count.mockResolvedValue(5);

      const result = await repo.listByCursor({
        userId: "user-1",
        limit: 1,
        sort: "-createdAt",
        includeTotal: true,
      });

      expect(metricSettingsModel.findAll).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeDefined();
      expect(result.totalCount).toBe(5);
    });
  });
});
