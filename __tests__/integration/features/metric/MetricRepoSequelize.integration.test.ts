import { randomUUID } from "crypto";
import { MetricRepoSequelize } from "@/features/metric/infrastructure/persistence/repositories/MetricRepoSequelize.js";
import { models } from "@/infrastructure/db/models.js";
import {
  buildMetricDomain,
  createMetricCategoryRow,
  createUserRow,
  runInTransaction,
} from "../../helpers/db-fixtures.js";

const repo = new MetricRepoSequelize();

describe("MetricRepoSequelize (integration)", () => {
  it("creates metric rows in a transaction and maps to domain", async () => {
    const user = await createUserRow();
    const category = await createMetricCategoryRow(user.id);

    const metric = await runInTransaction((tx) =>
      repo.create(
        {
          userId: user.id,
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

    const saved = await repo.save(metric);

    expect(saved.name).toBe("Bench Press (updated)");
    const row = await models.Metric.findOne({ where: { id: metricRow.id } });
    expect(row?.name).toBe("Bench Press (updated)");
    expect(row?.description).toBe("desc");
  });

  it("throws when saving unknown metric", async () => {
    const metric = buildMetricDomain();
    await expect(repo.save(metric)).rejects.toThrow("Metric not found");
  });
});
