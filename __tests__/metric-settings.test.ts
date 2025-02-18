// __tests__/metric-settings.test.ts
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

const today = new Date().toISOString().split("T")[0]; // e.g., "2025-02-17"
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0]; // e.g., "2025-02-18"

describe("Metric Settings Endpoints", () => {
  let user: User;
  let token: string;
  let metricParent: Metric;
  let settingsId: string; // ✅ Declare settingsId properly to avoid scope issues
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

  it("Should create Settings for a Metric", async () => {
    const res: Response = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        goalEnabled: true,
        goalType: "cumulative", // Added goalType
        goalValue: 10,
        timeFrameEnabled: true,
        startDate: today,
        deadlineDate: tomorrow,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty(
      "message",
      "Metric Settings created successfully"
    );
    expect(res.body.data).toHaveProperty("metricSettings");
    expect(res.body.data.metricSettings).toHaveProperty("id");
    expect(res.body.data.metricSettings).toHaveProperty("goalEnabled", true);
    expect(res.body.data.metricSettings).toHaveProperty("goalValue", 10);

    settingsId = res.body.data.metricSettings.id; // ✅ Store settingsId for further tests
  });

  it("Should fetch all settings for a Metric", async () => {
    const res: Response = await request(app)
      .get(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.metricSettings)).toBe(true);
  });

  it("Should fetch specific Settings for a Metric", async () => {
    // ✅ Ensure settings exist before fetching
    const createRes: Response = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        goalEnabled: true,
        goalType: "cumulative", // Added goalType
        goalValue: 15,
        timeFrameEnabled: true,
        startDate: today,
        deadlineDate: tomorrow,
      });

    expect(createRes.statusCode).toBe(201);
    settingsId = createRes.body.data.metricSettings.id;

    // 🛠 Fetch the settings
    const res: Response = await request(app)
      .get(`/api/v1/metrics/${metricParent.id}/settings/${settingsId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("metricSettings");
    expect(res.body.data.metricSettings).toHaveProperty("id", settingsId);
    expect(res.body.data.metricSettings).toHaveProperty("goalEnabled", true);
    expect(res.body.data.metricSettings).toHaveProperty("goalValue", 15);
  });

  it("Should update Settings for a Metric", async () => {
    // ✅ Ensure settings exist before updating
    const createRes: Response = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        goalEnabled: true,
        goalType: "cumulative", // Added goalType
        goalValue: 15,
        timeFrameEnabled: true,
        startDate: today,
        deadlineDate: tomorrow,
      });

    expect(createRes.statusCode).toBe(201);
    settingsId = createRes.body.data.metricSettings.id;

    // 🛠 Update the settings
    const res: Response = await request(app)
      .put(`/api/v1/metrics/${metricParent.id}/settings/${settingsId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        goalValue: 20,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Metric settings updated successfully"
    );
    expect(res.body.data.metricSettings).toHaveProperty("goalValue", 20);
  });

  it("Should delete Settings for a Metric", async () => {
    // ✅ Ensure settings exist before deleting
    const createRes: Response = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        goalEnabled: true,
        goalType: "cumulative", // Added goalType
        goalValue: 15,
        timeFrameEnabled: true,
        startDate: today,
        deadlineDate: tomorrow,
      });

    expect(createRes.statusCode).toBe(201);
    settingsId = createRes.body.data.metricSettings.id;

    // 🛠 Delete the settings
    const res: Response = await request(app)
      .delete(`/api/v1/metrics/${metricParent.id}/settings/${settingsId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Metric Settings deleted successfully"
    );
    expect(res.body.data.metricSettings).toHaveProperty("id", settingsId);
  });

  describe("🔒 Authorization Tests", () => {
    it("should not allow unauthorized access to create settings", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/settings`)
        .send({
          goalEnabled: true,
          goalType: "cumulative",
          goalValue: 10,
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should not allow access with invalid token", async () => {
      const res = await request(app)
        .get(`/api/v1/metrics/${metricParent.id}/settings`)
        .set("Authorization", "Bearer invalid_token");

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("✅ Validation Tests", () => {
    it("should validate goal value is positive", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/settings`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          goalEnabled: true,
          goalType: "cumulative",
          goalValue: -10,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });

    it("should validate deadline date is after start date", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/settings`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          timeFrameEnabled: true,
          startDate: tomorrow,
          deadlineDate: today,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("🎯 Goal Settings Tests", () => {
    it("should handle goal achievement updates", async () => {
      // Create settings first
      const createRes = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/settings`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          goalEnabled: true,
          goalType: "cumulative",
          goalValue: 10,
        });

      const settingsId = createRes.body.data.metricSettings.id;

      // Update achievement status
      const res = await request(app)
        .patch(
          `/api/v1/metrics/${metricParent.id}/settings/${settingsId}/achieve`
        )
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.metricSettings.isAchieved).toBe(true);
    });
  });

  describe("📊 Display Options Tests", () => {
    it("should update display options", async () => {
      // Create settings first
      const createRes = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/settings`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          displayOptions: {
            showOnDashboard: true,
            priority: 1,
            chartType: "line",
            color: "#E897A3",
          },
        });

      const settingsId = createRes.body.data.metricSettings.id;

      // Update display options
      const res = await request(app)
        .patch(
          `/api/v1/metrics/${metricParent.id}/settings/${settingsId}/display`
        )
        .set("Authorization", `Bearer ${token}`)
        .send({
          displayOptions: {
            showOnDashboard: false,
            priority: 2,
            chartType: "bar",
            color: "#123456",
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.metricSettings.displayOptions).toEqual({
        showOnDashboard: false,
        priority: 2,
        chartType: "bar",
        color: "#123456",
      });
    });
  });

  describe("⚠️ Alert Settings Tests", () => {
    it("should handle alert threshold updates", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/settings`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          alertEnabled: true,
          alertThresholds: 90,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.metricSettings.alertThresholds).toBe(90);
    });
  });

  describe("🔍 Edge Cases", () => {
    it("should handle non-existent metric ID", async () => {
      const res = await request(app)
        .post(`/api/v1/metrics/${nonExistentId}/settings`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          goalEnabled: true,
          goalValue: 10,
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe("fail");
    });

    it("should handle concurrent updates", async () => {
      // Create initial settings
      const createRes = await request(app)
        .post(`/api/v1/metrics/${metricParent.id}/settings`)
        .set("Authorization", `Bearer ${token}`)
        .send({ goalValue: 10 });

      const settingsId = createRes.body.data.metricSettings.id;

      // Make concurrent update requests
      const updates = [15, 20].map((value) =>
        request(app)
          .put(`/api/v1/metrics/${metricParent.id}/settings/${settingsId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ goalValue: value })
      );

      const results = await Promise.all(updates);
      expect(results.every((res) => res.statusCode === 200)).toBe(true);
    });
  });
});
