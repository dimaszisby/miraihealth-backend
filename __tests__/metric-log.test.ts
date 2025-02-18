//src/__tests__/metric-log.test.ts
import request, { Response } from "supertest";
import app from "../src/server";
import { User } from "../src/models/user";
import { Metric } from "../src/models/metric"; // Ensure correct import if Metric model exists

/**
 * * Generate Unique User Data
 * Creates a new test user each time using a timestamp.
 */
const generateUniqueUserData = () => {
  const timestamp = Date.now();
  return {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@example.com`,
    password: "Password123",
    passwordConfirmation: "Password123",
    age: 25,
    sex: "male",
  };
};

describe("Metric Log Endpoints", () => {
  let user: User;
  let token: string;
  let metricParent: Metric;
  let logId: string; // ✅ Declare logId properly to avoid scope issues
  const nonExistentId = "11111111-1111-1111-1111-111111111111";

  beforeEach(async () => {
    // 🛠 **Setup User**
    const userData = generateUniqueUserData();
    const newUser: Response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(newUser.statusCode).toBe(201);

    // 🔑 **Login User & Get Token**
    const loginRes: Response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: userData.email,
        password: "Password123",
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.data.token;

    if (!token) throw new Error("Authentication failed. No token received.");

    // ✅ **Fetch user from DB & Handle `null` case properly**
    const foundUser = await User.findOne({ where: { email: userData.email } });
    if (!foundUser) throw new Error("Test user not found in the database.");
    user = foundUser;

    // 🛠 **Setup Metric (Parent Entity)**
    const metric: Response = await request(app)
      .post("/api/v1/metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Height",
        defaultUnit: "cm",
        isPublic: true,
      });

    expect(metric.statusCode).toBe(201);
    metricParent = metric.body.data.metric;
  });

  /*
   * 🧪 **Test Cases**
   */

  it("Should create a Log for a Metric", async () => {
    const res: Response = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 10,
        type: "manual",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.log).toHaveProperty("id");
    expect(res.body.data.log).toHaveProperty("logValue", 10);
    expect(res.body.data.log).toHaveProperty("type", "manual");

    logId = res.body.data.log.id; // ✅ Store logId for further tests
  });

  it("Should fetch all logs for a Metric", async () => {
    const res: Response = await request(app)
      .get(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.logs)).toBe(true);
  });

  it("Should fetch a specific log for a Metric", async () => {
    // ✅ Ensure a log exists before fetching
    const logRes: Response = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 20,
        type: "manual",
      });

    expect(logRes.statusCode).toBe(201);
    logId = logRes.body.data.log.id;

    // 🛠 Fetch the log
    const res: Response = await request(app)
      .get(`/api/v1/metrics/${metricParent.id}/logs/${logId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.log).toHaveProperty("id", logId);
    expect(res.body.data.log).toHaveProperty("logValue", 20);
    expect(res.body.data.log).toHaveProperty("type", "manual");
  });

  it("Should update a Log for a Metric", async () => {
    // ✅ Ensure a log exists before updating
    const logRes: Response = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 20,
        type: "manual",
      });

    expect(logRes.statusCode).toBe(201);
    logId = logRes.body.data.log.id;

    // 🛠 Update the log
    const res: Response = await request(app)
      .put(`/api/v1/metrics/${metricParent.id}/logs/${logId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 30,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Log updated successfully");
    expect(res.body.data.log.logValue).toEqual(30);
  });

  it("Should delete a Log for a Metric", async () => {
    // ✅ Ensure a log exists before deleting
    const logRes: Response = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 20,
        type: "manual",
      });

    expect(logRes.statusCode).toBe(201);
    logId = logRes.body.data.log.id;

    // 🛠 Delete the log
    const res: Response = await request(app)
      .delete(`/api/v1/metrics/${metricParent.id}/logs/${logId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Log deleted successfully");
  });

  describe("🔒 Authorization Tests", () => {
    it("should not allow unauthorized access to create logs", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/logs`)
        .send({
          logValue: 10,
          type: "manual",
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should not allow access to logs of other users", async () => {
      // Other User: Create another user and their metric
      const otherUserData = generateUniqueUserData();
      const otherUser = await request(app)
        .post("/api/v1/auth/register")
        .send(otherUserData);

      // Other User: Login another user to get token
      const otherUserLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: otherUserData.email,
          password: "Password123",
        });
      const otherUserToken = otherUserLogin.body.data.token;

      // Correct/Original User: Create a metric for the purposed user
      const originalUserMetric = await request(app)
        .post("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Weight",
          defaultUnit: "kg",
          isPublic: false,
        });

      // Try to access the correct user's metric logs with the other user's token
      const res = await request(app)
        .get(`/api/v1/metrics/${originalUserMetric.body.data.metric.id}/logs`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("✅ Validation Tests", () => {
    it("should validate log value is numeric", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          logValue: "invalid",
          type: "manual",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });

    it("should validate log type is valid", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          logValue: 10,
          type: "invalid_type",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("🔍 Query Parameters Tests", () => {
    beforeEach(async () => {
      // Create multiple logs with different dates
      await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          logValue: 10,
          type: "manual",
          loggedAt: "2025-01-01",
        });

      await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          logValue: 20,
          type: "manual",
          loggedAt: "2025-02-01",
        });
    });

    it("should filter logs by date range", async () => {
      const res = await request(app)
        .get(`/api/v1/metrics/${metricParent.id}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .query({
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.logs).toHaveLength(1);
      expect(res.body.data.logs[0].logValue).toBe(10);
    });

    it("should sort logs by value", async () => {
      const res = await request(app)
        .get(`/api/v1/metrics/${metricParent.id}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .query({
          sortBy: "logValue",
          order: "desc",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.logs[0].logValue).toBe(20);
    });
  });

  describe("📊 Aggregation Tests", () => {
    it("should return aggregated statistics", async () => {
      const metricResponse = await request(app)
        .post("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Weight",
          defaultUnit: "kg",
          isPublic: false,
        });

      // Ensure logs are created
      await Promise.all(
        [10, 20, 30].map((value) =>
          request(app)
            .post(`/api/v1/metrics/${metricParent.id}/logs`)
            .set("Authorization", `Bearer ${token}`)
            .send({
              logValue: value,
              type: "manual",
            })
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 500)); // ✅ Ensure DB writes

      // Fetch the stats
      const res = await request(app)
        .get(`/api/v1/metrics/${metricParent.id}/logs/stats`)
        .set("Authorization", `Bearer ${token}`);

      console.log("Aggregation Response:", res.statusCode, res.body);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("average", 20);
      expect(res.body.data).toHaveProperty("min", 10);
      expect(res.body.data).toHaveProperty("max", 30);
    });
  });

  describe("🔍 Edge Cases", () => {
    it("should handle non-existent metric ID", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${nonExistentId}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          logValue: 10,
          type: "manual",
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe("fail");
    });

    it("should handle duplicate log entries", async () => {
      // Create first log
      await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          logValue: 10,
          type: "manual",
          loggedAt: "2025-01-01T00:00:00Z",
        });

      // Try to create duplicate log
      const res = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/logs`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          logValue: 20,
          type: "manual",
          loggedAt: "2025-01-01T00:00:00Z",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });
  });
});
