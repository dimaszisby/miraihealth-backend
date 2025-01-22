// __tests__/metric.test.js
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

describe("Metric Endpoints", () => {
  let user;
  let token;
  let dummyCategory;

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
      email: `testuser@example.com`,
      password: "Password123",
    });
    if (loginRes.statusCode !== 200) {
      console.log("Login Error:", loginRes.body);
    }

    console.log("Token Recieved:", loginRes.body.data.token);
    token = loginRes.body.data.token;

    if (!token) {
      throw new Error("Authentication failed. Token not received.");
    }

    // Fetch the user from the database
    user = await User.findOne({ where: { email: "testuser@example.com" } });
    if (!user) {
      throw new Error("Test user not found in the database.");
    }
    console.log("USER ID:", user.id);

    // * Category Setup
    // Create a dummy category for each test-case
    const newCategory = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Muscle Group",
      });

    if (newCategory.statusCode !== 201) {
      console.log("Create Category Error:", newCategory.body);
    }

    console.log("Dummy Category Created:", newCategory.body);
    dummyCategory = newCategory.body;
  });

  afterAll(async () => {
    // Optionally, delete the user if not using truncation
    // await user.destroy();
  });

  /*
   * Test Cases
   */

  it("Should create a new metric with partial parameters", async () => {
    const res = await request(app)
      .post(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Weight",
        unit: "Kg",
        version: 1,
        isPublic: true,
      });

    if (res.statusCode !== 201) {
      console.log("Create Metric Error:", res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty("metric");
    expect(res.body.data.metric).toHaveProperty("id");
    expect(res.body.data.metric).toHaveProperty("name", "Weight");
    expect(res.body.data.metric).toHaveProperty("unit", "Kg");
    // expect(res.body.metric.name).toEqual("Weight");
    // expect(res.body.metric.unit).toEqual("Kg");
  });

  it("Should create a new metric with full parameters", async () => {
    // Dummy metric for insertion
    const dummyMetric = await request(app)
      .post(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        // userId: user.id,
        name: "Weight",
        unit: "Kg",
        version: 1,
        isPublic: true,
      });

    if (dummyMetric.statusCode !== 201) {
      console.log("Create Metric Error:", dummyMetric.body);
    }
    console.log("Dummy Metric Id:", dummyMetric.body.id);
    dummyId = dummyMetric.body.data.metric.id;

    // Metric
    const res = await request(app)
      .post("/api/v1/metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({
        categoryId: dummyCategory.id, // Adjust based on your schema
        originalMetricId: dummyId,
        name: "Height",
        unit: "cm",
        version: 1,
        isPublic: true,
      });

    if (res.statusCode !== 201) {
      console.log("Create Metric Error:", res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.metric).toHaveProperty("id");
    expect(res.body.data.metric).toHaveProperty("name", "Height");
    expect(res.body.data.metric).toHaveProperty("unit", "cm");
    expect(res.body.data.metric.name).toEqual("Height");
    expect(res.body.data.metric.unit).toEqual("cm");
  });

  it("Should fetch all metrics for authenticated user", async () => {
    const res = await request(app)
      .get(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`);

    console.log("RES Metrics", res.statusCode);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.metrics)).toBe(true);
  });

  it("Should fetch a metric for authenticated user", async () => {
    // Create Metric to fetch via API to ensure consistency
    const createRes = await request(app)
      .post(`/api/v1/metrics/`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Height",
        unit: "cm",
        version: 1,
        isPublic: true,
      });

    if (createRes.statusCode !== 201) {
      console.log("Create Metric for Fetch Error:", createRes.body);
    }

    const metricId = createRes.body.data.metric.id;

    // Fetch Settings
    const res = await request(app)
      .get(`/api/v1/metrics/${metricId}/`)
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Fetch Metric for Metric Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty("metric");
    expect(res.body.data.metric).toHaveProperty("id", metricId);
  });

  it("should update a metric", async () => {
    // Create Metric to update via API to ensure consistency
    const createRes = await request(app)
      .post(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "BMI",
        unit: "kg/m²",
        version: 1,
        isPublic: true,
      });

    if (createRes.statusCode !== 201) {
      console.log("Create Metric for Update Error:", createRes.body);
    }

    const metricId = createRes.body.data.metric.id;

    // Update metric
    const res = await request(app)
      .put(`/api/v1/metrics/${metricId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Body Mass Index",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Metric updated successfully");
    expect(res.body.data.metric.name).toEqual("Body Mass Index");
  });

  it("should delete a metric", async () => {
    // Create a metric to delete via API to ensure consistency
    const createRes = await request(app)
      .post(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Waist Circumference",
        unit: "cm",
        version: 1,
        isPublic: true,
      });

    if (createRes.statusCode !== 201) {
      console.log("Create Metric for Deletion Error:", createRes.body);
    }

    const metricId = createRes.body.data.metric.id;

    // Delete metric
    const res = await request(app)
      .delete(`/api/v1/metrics/${metricId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Metric deleted successfully");
  });
});
