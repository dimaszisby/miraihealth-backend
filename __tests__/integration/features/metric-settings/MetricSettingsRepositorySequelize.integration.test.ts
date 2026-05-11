import { MetricSettingsRepositorySequelize } from "@/features/metric-settings/infrastructure/persistence/MetricSettingsRepositorySequelize.js";
import { models } from "@/infrastructure/db/models.js";
import {
  createMetricRow,
  createMetricSettingsRow,
  createUserRow,
  truncateAllTables,
  TEST_ORG_ID,
} from "../../helpers/db-fixtures.js";

const repo = new MetricSettingsRepositorySequelize();

describe("MetricSettingsRepositorySequelize (integration)", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  // Developer note: happy-path creation ensuring core fields + uniqueness enforcement.
  it("creates metric settings and enforces uniqueness per metric", async () => {
    const user = await createUserRow();
    const metric = await createMetricRow({ userId: user.id });

    const created = await repo.create({
      metricId: metric.id,
      organizationId: TEST_ORG_ID,
      isActive: true,
      goalEnabled: true,
      goalType: "cumulative",
      goalValue: 50,
      timeFrameEnabled: false,
      startDate: null,
      deadlineDate: null,
      alertEnabled: false,
      alertThresholds: null,
      isAchieved: false,
      displayOptions: {
        showOnDashboard: true,
        priority: 2,
        chartType: "bar",
        color: "#FF00AA",
      },
    });

    expect(created.metricId).toBe(metric.id);
    const row = await models.MetricSettings.findByPk(created.id);
    expect(row?.metricId).toBe(metric.id);
    await expect(
      repo.create({
        metricId: metric.id,
        organizationId: TEST_ORG_ID,
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
          showOnDashboard: false,
          priority: 1,
          chartType: "line",
          color: "#123456",
        },
      }),
    ).rejects.toThrow("Metric settings already exist for this metric");
  });

  it("finds settings by metric id and enforces ownership on findById", async () => {
    const owner = await createUserRow();
    const intruder = await createUserRow();
    const metric = await createMetricRow({ userId: owner.id });
    const settings = await createMetricSettingsRow({
      metricId: metric.id,
      goalEnabled: false,
    });

    const byMetric = await repo.findByMetricId(metric.id);
    expect(byMetric?.id).toBe(settings.id);

    const byId = await repo.findById(owner.id, settings.id);
    expect(byId?.metricId).toBe(metric.id);
    await expect(repo.findById(intruder.id, settings.id)).rejects.toThrow(
      "Unauthorized access to metric settings",
    );
  });

  it("updates settings via save() and deletes persisted rows", async () => {
    const user = await createUserRow();
    const metric = await createMetricRow({ userId: user.id });
    const settings = await repo.create({
      metricId: metric.id,
      organizationId: TEST_ORG_ID,
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
        color: "#ABCDEF",
      },
    });

    settings.updateDetails({
      isActive: false,
      goalEnabled: true,
      goalType: "incremental",
      goalValue: 10,
      timeFrameEnabled: true,
      startDate: new Date("2025-01-01T00:00:00Z"),
      deadlineDate: new Date("2025-02-01T00:00:00Z"),
      alertEnabled: true,
      alertThresholds: 5,
    });
    settings.markAchieved();

    const saved = await repo.save(settings);
    expect(saved.snapshot().goalEnabled).toBe(true);
    expect(saved.snapshot().goalType).toBe("incremental");
    expect(saved.snapshot().timeFrameEnabled).toBe(true);
    expect(saved.snapshot().alertEnabled).toBe(true);
    expect(saved.snapshot().isAchieved).toBe(true);

    await repo.delete(saved);
    await expect(models.MetricSettings.findByPk(saved.id)).resolves.toBeNull();
  });

  it("lists settings with cursor pagination and filters", async () => {
    const user = await createUserRow();
    const activeMetric = await createMetricRow({ userId: user.id });
    const inactiveMetric = await createMetricRow({ userId: user.id });
    const otherMetric = await createMetricRow({ userId: user.id });

    await createMetricSettingsRow({
      metricId: activeMetric.id,
      isActive: true,
    });
    await createMetricSettingsRow({
      metricId: inactiveMetric.id,
      isActive: false,
    });
    await createMetricSettingsRow({
      metricId: otherMetric.id,
      isActive: true,
    });

    const firstPage = await repo.listByCursor({
      userId: user.id,
      limit: 1,
      sort: "-createdAt",
      includeTotal: true,
      filter: { isActive: true },
    });
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.totalCount).toBe(2);
    expect(firstPage.nextCursor).toBeDefined();

    const secondPage = await repo.listByCursor({
      userId: user.id,
      limit: 1,
      sort: "-createdAt",
      filter: { isActive: true },
      after: firstPage.nextCursor,
    });
    expect(secondPage.items).toHaveLength(1);
  });

  it("throws when saving unknown settings", async () => {
    const dummy = await repo.create({
      metricId: (await createMetricRow({ userId: (await createUserRow()).id }))
        .id,
      organizationId: TEST_ORG_ID,
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
        color: "#ABCDE0",
      },
    });
    await repo.delete(dummy);
    await expect(repo.save(dummy)).rejects.toThrow("Metric Settings not found");
  });
});
