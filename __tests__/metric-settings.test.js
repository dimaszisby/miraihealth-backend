// __tests__/metric-settings.test.js
const request = require("supertest");
const app = require("../server");
const { User } = require("../models");

const generateUniqueUserData = () => {
  const timestamp = Date.now();
  return {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@example.com`,
    password: "Password123",
    age: 25,
    sex: "male",
  };
};

describe("Metric Settings Endpoints", () => {
  let user;
  let token;
  let metricParent;

  beforeEach(async () => {
    // * User Setup
    // Create a dummy user for all test-cases
    // Register a new user to recieve valid object on db
    const userData = generateUniqueUserData();
    const newUser = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);
    if (newUser.statusCode !== 201) {
      console.log("Register Error:", newUser.body);
    }

    // Login endpoint to obtain JWT
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: userData.email, // Use the unique email generated
      password: "Password123",
    });
    if (loginRes.statusCode !== 200) {
      console.log("Login Error:", loginRes.body);
    }

    // Validate token
    token = loginRes.body.data.token;
    if (!token) {
      throw new Error("Authentication failed. Token not received.");
    }
    console.log("Token Received:", token);

    // Fetch the user from the database
    user = await User.findOne({ where: { email: userData.email } });
    if (!user) {
      throw new Error("Test user not found in the database.");
    }
    console.log("USER ID:", user.id);

    // * Metric Setup (Parent Entity)
    const metric = await request(app)
      .post("/api/v1/metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Height",
        unit: "cm",
        version: 1,
        isPublic: true,
      });

    if (metric.statusCode !== 201) {
      console.log("Metric Setup Creation Error:", metric.body);
    }

    metricParent = metric.body.data.metric;
  });

  afterEach(async () => {
    // Any necessary cleanup can be done here
  });

  /*
   * Test Cases
   */

  it("Should create Settings for Metric", async () => {
    const timestamp = Date.now();

    const res = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isTracked: true,
        goalValue: 10,
        versionDate: new Date(timestamp).toISOString(), // Send as ISO string
      });

    if (res.statusCode !== 201) {
      console.log("Create Setting for Metric Error:", res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty(
      "message",
      "Metric Settings created successfully"
    );
    expect(res.body.data).toHaveProperty("settings");
    expect(res.body.data.settings).toHaveProperty("id");
    expect(res.body.data.settings).toHaveProperty("isTracked", true);
    expect(res.body.data.settings).toHaveProperty("goalValue", 10);
    expect(new Date(res.body.data.settings.versionDate).getTime()).toBeCloseTo(
      timestamp,
      -1
    );
  });

  it("Should fetch all logs for a Metirc", async () => {
    const res = await request(app)
      .get(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Fetch all Settings for Metric Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.settings)).toBe(true);
  });

  it("Should fetch a Settings for Metric", async () => {
    const timestamp = Date.now();

    // Create Settings to fetch via API to ensure consistency
    const createRes = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isTracked: true,
        goalValue: 15,
        versionDate: new Date(timestamp).toISOString(), // Send as ISO string
      });

    if (createRes.statusCode !== 201) {
      console.log("Create Setting for Fetch Error:", createRes.body);
    }
    console.log("-- SettingsId", createRes.body.data.settings.id);
    const settingsId = createRes.body.data.settings.id;

    // Fetch Settings
    const res = await request(app)
      .get(`/api/v1/metrics/${metricParent.id}/settings/${settingsId}`)
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Fetch Settings for Metric Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty("settings");
    expect(res.body.data.settings).toHaveProperty("id", settingsId);
    expect(res.body.data.settings).toHaveProperty("isTracked", true);
    expect(res.body.data.settings).toHaveProperty("goalValue", 15);
    expect(new Date(res.body.data.settings.versionDate).getTime()).toBeCloseTo(
      timestamp,
      -1
    );
  });

  it("Should update a Settings for Metric", async () => {
    const timestamp = Date.now();

    // Create Settings to update via API to ensure consistency
    const createRes = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isTracked: true,
        goalValue: 15,
        versionDate: new Date(timestamp).toISOString(), // Send as ISO string
      });

    if (createRes.statusCode !== 201) {
      console.log("Create Setting for Update Error:", createRes.body);
    }

    const settingsId = createRes.body.data.settings.id;

    // Update Settings
    const res = await request(app)
      .put(`/api/v1/metrics/${metricParent.id}/settings/${settingsId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        goalValue: 20,
      });

    if (res.statusCode !== 200) {
      console.log("Update Setting for Metric Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Settings updated successfully");
    expect(res.body.data).toHaveProperty("settings");
    expect(res.body.data.settings).toHaveProperty("goalValue", 20);
  });

  it("Should delete a Settings for Metric", async () => {
    const timestamp = Date.now();

    // Create settings to delete via API to ensure consistency
    const createRes = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isTracked: true,
        goalValue: 15,
        versionDate: new Date(timestamp).toISOString(), // Send as ISO string
      });

    if (createRes.statusCode !== 201) {
      console.log("Create Setting for Deletion Error:", createRes.body);
    }

    const settingsId = createRes.body.data.settings.id;

    // Delete settings
    const res = await request(app)
      .delete(`/api/v1/metrics/${metricParent.id}/settings/${settingsId}`)
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Delete Setting for Metric Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Settings deleted successfully");
    expect(res.body.data).toHaveProperty("settings");
    expect(res.body.data.settings).toHaveProperty("id", settingsId);
  });
});
