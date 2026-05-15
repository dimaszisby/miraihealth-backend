import { randomUUID } from "crypto";
import { MetricReadRepoSequelize } from "@/features/metric/infrastructure/persistence/repositories/MetricReadRepoSequelize.js";
import { MetricRepoSequelize } from "@/features/metric/infrastructure/persistence/repositories/MetricRepoSequelize.js";
import { models } from "@/infrastructure/db/models.js";
import { runInTransaction } from "../../helpers/db-fixtures.js";

const readRepo = new MetricReadRepoSequelize();
const writeRepo = new MetricRepoSequelize();

const uniqueSuffix = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function createOrgWithUser(orgId: string) {
  await models.Organization.create({
    id: orgId,
    name: `Org-${orgId.slice(0, 8)}`,
    slug: `org-${uniqueSuffix()}`,
  });
  const userId = randomUUID();
  await models.User.create({
    id: userId,
    email: `${uniqueSuffix()}@test.com`,
    username: `user-${uniqueSuffix()}`,
    password: "hash",
    role: "user",
    isPublicProfile: true,
  });
  await models.Membership.create({
    userId,
    organizationId: orgId,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  });
  return { id: userId };
}

async function createMetricForOrg(userId: string, orgId: string, name: string) {
  return models.Metric.create({
    id: randomUUID(),
    userId,
    organizationId: orgId,
    name,
    defaultUnit: "units",
    isPublic: false,
  });
}

describe("Cross-org data isolation", () => {
  const ORG_A = "aa000000-0000-4000-8000-000000000001";
  const ORG_B = "bb000000-0000-4000-8000-000000000002";

  it("listMetrics returns only the requesting org's metrics", async () => {
    const userA = await createOrgWithUser(ORG_A);
    const userB = await createOrgWithUser(ORG_B);

    await createMetricForOrg(userA.id, ORG_A, "Org A Metric");
    await createMetricForOrg(userB.id, ORG_B, "Org B Metric");

    const resultA = await readRepo.listMetrics({
      userId: userA.id,
      organizationId: ORG_A,
      limit: 20,
      sort: "-createdAt",
    });

    const resultB = await readRepo.listMetrics({
      userId: userB.id,
      organizationId: ORG_B,
      limit: 20,
      sort: "-createdAt",
    });

    expect(resultA.items.map((m) => m.name)).toEqual(["Org A Metric"]);
    expect(resultB.items.map((m) => m.name)).toEqual(["Org B Metric"]);
  });

  it("findOwnedById rejects access to a metric from another org", async () => {
    const userA = await createOrgWithUser(ORG_A);
    const userB = await createOrgWithUser(ORG_B);

    const metricA = await createMetricForOrg(userA.id, ORG_A, "Secret A");

    // userB querying metricA's ID scoped to ORG_B must fail
    await expect(
      writeRepo.findOwnedById(userB.id, ORG_B, metricA.id),
    ).rejects.toThrow("Metric not found");
  });

  it("same user in two orgs sees only the current org's metrics", async () => {
    const { id: userId } = await createOrgWithUser(ORG_A);

    // add that user to ORG_B as well
    await models.Organization.create({
      id: ORG_B,
      name: `Org-${ORG_B.slice(0, 8)}`,
      slug: `org-${uniqueSuffix()}`,
    });
    await models.Membership.create({
      userId,
      organizationId: ORG_B,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    });

    const metricInOrgA = await createMetricForOrg(userId, ORG_A, "Org A Only");
    await createMetricForOrg(userId, ORG_B, "Org B Only");

    const resultA = await readRepo.listMetrics({
      userId,
      organizationId: ORG_A,
      limit: 20,
      sort: "-createdAt",
    });

    expect(resultA.items).toHaveLength(1);
    expect(resultA.items[0].id).toBe(metricInOrgA.id);
    expect(resultA.items[0].name).toBe("Org A Only");
  });

  it("create scopes new metrics to the given org", async () => {
    const userA = await createOrgWithUser(ORG_A);
    await createOrgWithUser(ORG_B);

    await runInTransaction((tx) =>
      writeRepo.create(
        {
          userId: userA.id,
          organizationId: ORG_A,
          name: "Created In A",
          defaultUnit: "reps",
          isPublic: false,
        },
        tx,
      ),
    );

    const row = await models.Metric.findOne({
      where: { name: "Created In A" },
    });
    expect(row?.organizationId).toBe(ORG_A);

    // same user, different org context — must not see the metric
    const resultB = await readRepo.listMetrics({
      userId: userA.id,
      organizationId: ORG_B,
      limit: 20,
      sort: "-createdAt",
    });
    expect(resultB.items).toHaveLength(0);
  });
});
