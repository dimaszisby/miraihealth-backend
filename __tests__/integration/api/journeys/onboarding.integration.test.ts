import {
  api,
  authHeader,
  buildUserPayload,
  uniqueName,
} from "../../helpers/test-utils.js";

describe("Journeys – user onboarding", () => {
  it("registers, configures, logs, and reads analytics in a single flow", async () => {
    const userPayload = buildUserPayload();
    const registerRes = await api
      .post("/api/v1/auth/register")
      .send(userPayload);

    expect(registerRes.status).toBe(201);
    const token = registerRes.body.data.token as string;

    const categoryPayload = {
      name: uniqueName("JourneyCategory"),
      color: "#2274A5",
      icon: "📈",
    };
    const categoryRes = await api
      .post("/api/v1/metric-categories")
      .set("Authorization", authHeader(token))
      .send(categoryPayload);

    expect(categoryRes.status).toBe(201);
    const categoryId = categoryRes.body.data.id as string;

    const metricPayload = {
      name: uniqueName("JourneyMetric"),
      defaultUnit: "kg",
      isPublic: false,
      categoryId,
    };
    const metricRes = await api
      .post("/api/v1/metrics")
      .set("Authorization", authHeader(token))
      .send(metricPayload);

    expect(metricRes.status).toBe(201);
    const metricId = metricRes.body.data.id as string;

    const initialMetricDetail = await api
      .get(`/api/v1/metrics/${metricId}`)
      .set("Authorization", authHeader(token))
      .query({ include: "full" });
    expect(initialMetricDetail.status).toBe(200);
    const settingsId = initialMetricDetail.body.data.settings.id as string;

    const displayUpdateRes = await api
      .patch(`/api/v1/metric-settings/${settingsId}/display`)
      .set("Authorization", authHeader(token))
      .send({
        displayOptions: {
          showOnDashboard: true,
          priority: 1,
          chartType: "line",
          color: "#FF9F1C",
        },
      });
    expect(displayUpdateRes.status).toBe(200);

    const logPayload = {
      metricId,
      logValue: 42,
      type: "manual" as const,
    };
    const logRes = await api
      .post("/api/v1/metric-logs")
      .set("Authorization", authHeader(token))
      .send(logPayload);

    expect(logRes.status).toBe(201);

    const metricDetailRes = await api
      .get(`/api/v1/metrics/${metricId}`)
      .set("Authorization", authHeader(token))
      .query({ include: "full", logsLimit: 5 });

    expect(metricDetailRes.status).toBe(200);
    expect(metricDetailRes.body.data.logs).toHaveLength(1);
    expect(metricDetailRes.body.data.settings.metricId).toBe(metricId);

    const singleVizRes = await api
      .get(`/api/v1/analytics/metrics/${metricId}`)
      .set("Authorization", authHeader(token))
      .query({ last: "7d" });

    expect(singleVizRes.status).toBe(200);
    expect(singleVizRes.body.data.meta.metricId).toBe(metricId);
    expect(Array.isArray(singleVizRes.body.data.series)).toBe(true);

    const dashboardRes = await api
      .get("/api/v1/analytics/dashboard")
      .set("Authorization", authHeader(token))
      .query({ last: "7d" });

    expect(dashboardRes.status).toBe(200);
    const itemIds = dashboardRes.body.data.items.map(
      (item: { metricId: string }) => item.metricId,
    );
    expect(itemIds).toContain(metricId);
  });
});
