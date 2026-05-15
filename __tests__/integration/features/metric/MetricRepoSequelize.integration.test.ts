import { randomUUID } from "crypto";
import { MetricRepoSequelize } from "@/features/metric/infrastructure/persistence/repositories/MetricRepoSequelize.js";
import { models } from "@/infrastructure/db/models.js";
import {
  buildMetricDomain,
  createMetricCategoryRow,
  createMetricRow,
  createUserRow,
  runInTransaction,
  TEST_ORG_ID,
} from "../../helpers/db-fixtures.js";

const repo = new MetricRepoSequelize();

describe("MetricRepoSequelize (integration)", () => {
  // Developer note: happy-path create scenario covering transactional insert + domain mapping.
  it("creates metric rows in a transaction and maps to domain", async () => {
    const user = await createUserRow();
    const category = await createMetricCategoryRow(user.id);

    const metric = await runInTransaction((tx) =>
      repo.create(
        {
          userId: user.id,
          organizationId: TEST_ORG_ID,
          categoryId: category.id,
          originalMetricId: null,
          name: "Weekly Steps",
          description: "desc",
          defaultUnit: "steps",
          isPublic: true,
        },
        tx,
      ),
    );

    expect(metric.name).toBe("Weekly Steps");
    expect(metric.categoryId).toBe(category.id);

    const row = await models.Metric.findOne({ where: { id: metric.id } });
    expect(row).not.toBeNull();
    expect(row?.userId).toBe(user.id);
    expect(row?.categoryId).toBe(category.id);
  });

  it("saves updates to existing metrics", async () => {
    const user = await createUserRow();
    const metricRow = await models.Metric.create({
      id: randomUUID(),
      userId: user.id,
      organizationId: TEST_ORG_ID,
      name: "Bench Press",
      defaultUnit: "kg",
      isPublic: true,
    });
    const metric = buildMetricDomain({
      id: metricRow.id,
      userId: user.id,
      name: "Bench Press",
      defaultUnit: "kg",
    });

    metric.rename("Bench Press (updated)");
    metric.describe("desc");

    const saved = await repo.save(TEST_ORG_ID, metric);

    expect(saved.name).toBe("Bench Press (updated)");
    const row = await models.Metric.findOne({ where: { id: metricRow.id } });
    expect(row?.name).toBe("Bench Press (updated)");
    expect(row?.description).toBe("desc");
  });

  it("throws when saving unknown metric", async () => {
    const metric = buildMetricDomain();
    await expect(repo.save(TEST_ORG_ID, metric)).rejects.toThrow(
      "Metric not found",
    );
  });

  it("checks metric existence by name per user boundary", async () => {
    const owner = await createUserRow();
    const otherUser = await createUserRow();
    await createMetricRow({ userId: owner.id, name: "Sleep" });
    await createMetricRow({ userId: otherUser.id, name: "Sleep" });

    await expect(
      repo.existsByName(owner.id, TEST_ORG_ID, "Sleep"),
    ).resolves.toBe(true);
    await expect(repo.existsByName(owner.id, TEST_ORG_ID, "Run")).resolves.toBe(
      false,
    );
  });

  it("finds owned metrics and rejects unauthorized access", async () => {
    const owner = await createUserRow();
    const intruder = await createUserRow();
    const metricRow = await createMetricRow({
      userId: owner.id,
      name: "Bench Rows",
    });

    const found = await repo.findOwnedById(owner.id, TEST_ORG_ID, metricRow.id);
    expect(found.id).toBe(metricRow.id);
    await expect(
      repo.findOwnedById(intruder.id, TEST_ORG_ID, metricRow.id),
    ).rejects.toThrow("Metric not found");
  });

  it("deletes owned metrics and errors on unknown ids", async () => {
    const owner = await createUserRow();
    const metricRow = await createMetricRow({
      userId: owner.id,
      name: "Tempo Run",
      defaultUnit: "km",
    });
    const domain = buildMetricDomain({
      id: metricRow.id,
      userId: owner.id,
      name: metricRow.name,
      defaultUnit: "km",
    });

    await repo.delete(TEST_ORG_ID, domain);
    const deleted = await models.Metric.findByPk(metricRow.id);
    expect(deleted).toBeNull();

    const phantom = buildMetricDomain({ id: randomUUID(), userId: owner.id });
    await expect(repo.delete(TEST_ORG_ID, phantom)).rejects.toThrow(
      "Metric not found",
    );
  });
});
