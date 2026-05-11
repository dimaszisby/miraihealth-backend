import { MetricLogRepoSequelize } from "@/features/metric-log/infrastructure/persistence/repositories/MetricLogRepoSequelize.js";
import { MetricLogQueryRepoSequelize } from "@/features/metric-log/infrastructure/persistence/repositories/MetricLogQueryRepoSequelize.js";
import { models } from "@/infrastructure/db/models.js";
import type { MetricLogDomain } from "@/types/domain/metric-log.domain.js";
import {
  createMetricLogRow,
  createMetricRow,
  createUserRow,
  truncateAllTables,
  TEST_ORG_ID,
} from "../../helpers/db-fixtures.js";

const repo = new MetricLogRepoSequelize();
const queryRepo = new MetricLogQueryRepoSequelize();

describe("MetricLog repositories (integration)", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  it("checks timestamp uniqueness with optional exclusion", async () => {
    const user = await createUserRow();
    const metric = await createMetricRow({ userId: user.id });
    const loggedAt = new Date("2025-01-01T00:00:00Z");
    const log = await repo.create({
      metricId: metric.id,
      organizationId: TEST_ORG_ID,
      logValue: 10,
      type: "manual",
      loggedAt,
    });

    await expect(repo.existsAtTimestamp(metric.id, loggedAt)).resolves.toBe(
      true,
    );
    await expect(
      repo.existsAtTimestamp(metric.id, loggedAt, log.id),
    ).resolves.toBe(false);
  });

  // Developer note: happy-path CRUD lifecycle validating ownership rules.
  it("creates, finds, saves, and deletes metric logs", async () => {
    const owner = await createUserRow();
    const intruder = await createUserRow();
    const metric = await createMetricRow({ userId: owner.id });
    const created = await repo.create({
      metricId: metric.id,
      organizationId: TEST_ORG_ID,
      logValue: 12,
      type: "manual",
      loggedAt: new Date("2025-01-02T00:00:00Z"),
    });

    const row = await models.MetricLog.findByPk(created.id);
    expect(row?.metricId).toBe(metric.id);

    const foundOwner = await repo.findById(owner.id, created.id);
    expect(foundOwner?.id).toBe(created.id);
    const foundIntruder = await repo.findById(intruder.id, created.id);
    expect(foundIntruder).toBeNull();

    foundOwner?.setLogValue(99);
    foundOwner?.setType("automatic");
    foundOwner?.setLoggedAt(new Date("2025-01-03T00:00:00Z"));
    const saved = await repo.save(foundOwner!);
    expect(saved.logValue).toBe(99);
    expect(saved.type).toBe("automatic");

    await repo.delete(saved);
    await expect(models.MetricLog.findByPk(saved.id)).resolves.toBeNull();
  });

  it("lists logs via cursor pagination and filters for the owning user", async () => {
    const owner = await createUserRow();
    const other = await createUserRow();
    const metric = await createMetricRow({ userId: owner.id });
    const otherMetric = await createMetricRow({ userId: other.id });
    const timestamps = [
      new Date("2025-02-01T00:00:00Z"),
      new Date("2025-02-02T00:00:00Z"),
      new Date("2025-02-03T00:00:00Z"),
    ];

    await createMetricLogRow({
      metricId: metric.id,
      logValue: 10,
      loggedAt: timestamps[0],
    });
    await createMetricLogRow({
      metricId: metric.id,
      logValue: 20,
      loggedAt: timestamps[1],
    });
    await createMetricLogRow({
      metricId: metric.id,
      logValue: 30,
      loggedAt: timestamps[2],
    });
    await createMetricLogRow({
      metricId: otherMetric.id,
      logValue: 999,
      loggedAt: new Date("2025-02-04T00:00:00Z"),
    });

    const firstPage = await queryRepo.listLogs({
      userId: owner.id,
      limit: 2,
      sort: "-loggedAt",
      includeTotal: true,
      filter: { metricId: metric.id },
    });
    const firstPageValues = firstPage.items.map(
      (i: MetricLogDomain) => i.logValue,
    );
    expect(firstPageValues).toEqual([30, 20]);
    expect(firstPage.totalCount).toBe(3);
    expect(firstPage.nextCursor).toBeDefined();

    const secondPage = await queryRepo.listLogs({
      userId: owner.id,
      limit: 2,
      sort: "-loggedAt",
      filter: { metricId: metric.id },
      after: firstPage.nextCursor,
    });
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0].logValue).toBe(10);
  });

  it("accepts numeric q filters and logValue ordering", async () => {
    const owner = await createUserRow();
    const metric = await createMetricRow({ userId: owner.id });
    await createMetricLogRow({
      metricId: metric.id,
      logValue: 5,
      loggedAt: new Date("2025-04-01T00:00:00Z"),
    });
    await createMetricLogRow({
      metricId: metric.id,
      logValue: 15,
      loggedAt: new Date("2025-04-02T00:00:00Z"),
    });
    await createMetricLogRow({
      metricId: metric.id,
      logValue: 25,
      loggedAt: new Date("2025-04-03T00:00:00Z"),
    });

    const byValue = await queryRepo.listLogs({
      userId: owner.id,
      limit: 10,
      sort: "-logValue",
      q: "15",
      filter: { metricId: metric.id },
    });
    expect(byValue.items).toHaveLength(1);
    expect(byValue.items[0].logValue).toBe(15);
  });
});
