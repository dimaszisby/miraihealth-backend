import {
  api,
  authHeader,
  createMetric,
  createMetricLog,
  createTestUser,
} from "../helpers/test-utils.js";

describe("Metric Log API", () => {
  let token: string;
  let metricId: string;

  beforeEach(async () => {
    const auth = await createTestUser();
    token = auth.token;
    const { metric } = await createMetric(token);
    metricId = metric.id;
  });

  it("creates a metric log", async () => {
    const res = await api
      .post("/api/v1/metric-logs")
      .set("Authorization", authHeader(token))
      .send({
        metricId,
        logValue: 15.5,
        type: "manual",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toHaveProperty("metricId", metricId);
    expect(res.body.data.logValue).toBe(15.5);
  });

  it("lists logs via cursor with filters", async () => {
    await createMetricLog(token, metricId, { logValue: 10 });
    await createMetricLog(token, metricId, { logValue: 20 });

    const res = await api
      .get("/api/v1/metric-logs")
      .set("Authorization", authHeader(token))
      .query({
        limit: 10,
        includeTotal: true,
        "filter[metricId]": metricId,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data).toHaveProperty("totalCount");
  });

  it("fetches a log by id with metric validation", async () => {
    const { log } = await createMetricLog(token, metricId, { logValue: 25 });
    const res = await api
      .get(`/api/v1/metric-logs/${log.id}`)
      .set("Authorization", authHeader(token))
      .query({ metricId });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(log.id);
  });

  it("updates a metric log", async () => {
    const { log } = await createMetricLog(token, metricId);
    const res = await api
      .put(`/api/v1/metric-logs/${log.id}`)
      .set("Authorization", authHeader(token))
      .send({ logValue: 99.9 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Log updated successfully");
    expect(res.body.data.logValue).toBe(99.9);
  });

  it("deletes a metric log", async () => {
    const { log } = await createMetricLog(token, metricId);
    const res = await api
      .delete(`/api/v1/metric-logs/${log.id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Log deleted successfully");
  });

  it("returns aggregated stats for a metric", async () => {
    await createMetricLog(token, metricId, { logValue: 10 });
    await createMetricLog(token, metricId, { logValue: 30 });

    const res = await api
      .get("/api/v1/metric-logs/stats")
      .set("Authorization", authHeader(token))
      .query({ metricId });

    expect(res.status).toBe(200);
    expect(res.body.data.average).toBe(20);
    expect(res.body.data.min).toBe(10);
    expect(res.body.data.max).toBe(30);
  });

  it("prevents duplicate logs for the same timestamp", async () => {
    const loggedAt = new Date().toISOString();
    await api
      .post("/api/v1/metric-logs")
      .set("Authorization", authHeader(token))
      .send({ metricId, logValue: 10, loggedAt, type: "manual" });

    const res = await api
      .post("/api/v1/metric-logs")
      .set("Authorization", authHeader(token))
      .send({ metricId, logValue: 12, loggedAt, type: "manual" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
  });

  it("blocks unauthorized creation", async () => {
    const res = await api.post("/api/v1/metric-logs").send({
      metricId,
      logValue: 5,
      type: "manual",
    });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("fail");
  });

  it("validates log payloads", async () => {
    const res = await api
      .post("/api/v1/metric-logs")
      .set("Authorization", authHeader(token))
      .send({ metricId, logValue: "invalid", type: "manual" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
  });
});
