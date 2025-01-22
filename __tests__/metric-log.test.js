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

describe("Metric Log Endpoints", () => {
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
    console.log("Metric Setup:", metricParent);
  });

  afterAll(async () => {});

  /*
   * Test Cases
   */

  it("Should create a Log for a Metric", async () => {
    const res = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 10,
        type: "manual",
      });
    if (res.statusCode !== 201) {
      console.log("Create Log Error:", res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.log).toHaveProperty("id");
    expect(res.body.data.log).toHaveProperty("logValue", 10);
    expect(res.body.data.log).toHaveProperty("type", "manual");
    expect(res.body.data.log.logValue).toEqual(10);
    expect(res.body.data.log.type).toEqual("manual");
  });

  it("Should fetch all logs for a Metirc", async () => {
    const res = await request(app)
      .get(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Fetch all log Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.logs)).toBe(true);
  });

  it("Should fetch a log from a Metric", async () => {
    // Create initial log to fetch via API to ensure consistency
    const logRes = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 20,
        type: "manual",
      });
    if (logRes.statusCode !== 201) {
      console.log("Create Log Error:", logRes.body);
    }

    logId = logRes.body.data.log.id;

    // Fetch Log
    const res = await request(app)
      .get(`/api/v1/metrics/${metricParent.id}/logs/${logId}`)
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Fetch log Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.log).toHaveProperty("id", logId);
    expect(res.body.data.log).toHaveProperty("logValue", 20);
    expect(res.body.data.log).toHaveProperty("type", "manual");
  });

  it("Should update a Log from a Metric", async () => {
    // Create initial log to fetch via API to ensure consistency
    const logRes = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 20,
        type: "manual",
      });
    if (logRes.statusCode !== 201) {
      console.log("Create Log Error:", logRes.body);
    }

    logId = logRes.body.data.log.id;

    // Update Log
    const res = await request(app)
      .put(`/api/v1/metrics/${metricParent.id}/logs/${logId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 30,
      });

    if (res.statusCode !== 200) {
      console.log("Update Log Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Log updated successfully");
    expect(res.body.data.log.logValue).toEqual(30);
  });

  it("Should delete a Log from a Metric:", async () => {
    // Create initial log to fetch via API to ensure consistency
    const logRes = await request(app)
      .post(`/api/v1/metrics/${metricParent.id}/logs`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        logValue: 20,
        type: "manual",
      });
    if (logRes.statusCode !== 201) {
      console.log("Create Log Error:", logRes.body);
    }

    logId = logRes.body.data.log.id;

    // Delete Log
    const res = await request(app)
      .delete(`/api/v1/metrics/${metricParent.id}/logs/${logId}`)
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Delete log Error:", res.body);
    }
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Log deleted successfully");
  });
});
