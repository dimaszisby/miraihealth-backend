import {
  api,
  authHeader,
  createMetric,
  createMetricLog,
  createTestUser,
} from "../helpers/test-utils";

describe("Analytics API", () => {
  let token: string;
  let metricId: string;

  beforeEach(async () => {
    const auth = await createTestUser();
    token = auth.token;
    const { metric } = await createMetric(token);
    metricId = metric.id;

    await createMetricLog(token, metricId, { logValue: 10 });
    await createMetricLog(token, metricId, { logValue: 20 });
  });

  it("returns dashboard visualization data", async () => {
    const res = await api
      .get("/api/v1/analytics/dashboard")
      .set("Authorization", authHeader(token))
      .query({ last: "7d" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.meta).toHaveProperty("range");
  });

  it("returns visualization for a specific metric", async () => {
    const res = await api
      .get(`/api/v1/analytics/metrics/${metricId}`)
      .set("Authorization", authHeader(token))
      .query({ last: "7d" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data.series)).toBe(true);
    expect(res.body.data.meta.metricId).toBe(metricId);
  });

  it("requires authentication", async () => {
    const res = await api
      .get("/api/v1/analytics/dashboard")
      .query({ last: "7d" });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("fail");
  });
});
