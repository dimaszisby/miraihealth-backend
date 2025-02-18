import request, { Response } from "supertest";
import app from "../src/server";
import { User } from "../src/models/user";
import { MetricCategory } from "../src/models/metric-category"; // Ensure correct import
import { Metric } from "../src/models/metric"; // Ensure correct import

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

describe("Metric Endpoints", () => {
  let user: User;
  let token: string;
  let dummyCategory: MetricCategory;
  let metricId: string; // ✅ Store metricId for consistency

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

    // 🛠 **Setup Category (Parent Entity)**
    const category: Response = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Muscle Group",
      });

    expect(category.statusCode).toBe(201);
    dummyCategory = category.body.data.category;
  });

  /*
   * 🧪 **Test Cases**
   */

  it("Should create a new metric with partial parameters", async () => {
    const res: Response = await request(app)
      .post(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Weight",
        defaultUnit: "Kg",
        isPublic: true,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty("metric");
    expect(res.body.data.metric).toHaveProperty("id");
    expect(res.body.data.metric).toHaveProperty("name", "Weight");
    expect(res.body.data.metric).toHaveProperty("defaultUnit", "Kg");

    metricId = res.body.data.metric.id;
  });

  it("Should create a new metric with full parameters", async () => {
    // Dummy metric for insertion
    const dummyMetric: Response = await request(app)
      .post(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Weight",
        defaultUnit: "Kg",
        isPublic: true,
      });

    expect(dummyMetric.statusCode).toBe(201);
    const dummyId = dummyMetric.body.data.metric.id;

    // Metric Creation
    const res: Response = await request(app)
      .post("/api/v1/metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({
        categoryId: dummyCategory.id,
        originalMetricId: dummyId,
        name: "Height",
        defaultUnit: "cm",
        isPublic: true,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.metric).toHaveProperty("id");
    expect(res.body.data.metric).toHaveProperty("name", "Height");
    expect(res.body.data.metric).toHaveProperty("defaultUnit", "cm");
  });

  it("Should fetch all metrics for authenticated user", async () => {
    const res: Response = await request(app)
      .get(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.metrics)).toBe(true);
  });

  it("Should fetch a metric for authenticated user", async () => {
    // ✅ Create Metric before fetching
    const createRes: Response = await request(app)
      .post(`/api/v1/metrics/`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Height",
        defaultUnit: "cm",
        isPublic: true,
      });

    expect(createRes.statusCode).toBe(201);
    const metricId = createRes.body.data.metric.id;

    // Fetch Metric
    const res: Response = await request(app)
      .get(`/api/v1/metrics/${metricId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty("metric");
    expect(res.body.data.metric).toHaveProperty("id", metricId);
  });

  it("Should update a metric", async () => {
    // ✅ Create Metric before updating
    const createRes: Response = await request(app)
      .post(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "BMI",
        defaultUnit: "kg/m²",
        isPublic: true,
      });

    expect(createRes.statusCode).toBe(201);
    const metricId = createRes.body.data.metric.id;

    // Update Metric
    const res: Response = await request(app)
      .put(`/api/v1/metrics/${metricId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Body Mass Index",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Metric updated successfully");
    expect(res.body.data.metric.name).toEqual("Body Mass Index");
  });

  it("Should delete a metric", async () => {
    // ✅ Create Metric before deleting
    const createRes: Response = await request(app)
      .post(`/api/v1/metrics`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Waist Circumference",
        defaultUnit: "cm",
        isPublic: true,
      });

    expect(createRes.statusCode).toBe(201);
    const metricId = createRes.body.data.metric.id;

    // Delete Metric
    const res: Response = await request(app)
      .delete(`/api/v1/metrics/${metricId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Metric deleted successfully");
  });

  describe("🔒 Authorization Tests", () => {
    it("should not create metric without authentication", async () => {
      const res: Response = await request(app).post("/api/v1/metrics").send({
        name: "Weight",
        defaultUnit: "Kg",
        isPublic: true,
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should not access metrics with invalid token", async () => {
      const res: Response = await request(app)
        .get("/api/v1/metrics")
        .set("Authorization", "Bearer invalid_token");

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("✅ Validation Tests", () => {
    it("should not create metric with empty name", async () => {
      const res: Response = await request(app)
        .post("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "",
          defaultUnit: "Kg",
          isPublic: true,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });

    it("should not create metric with invalid category ID", async () => {
      const res: Response = await request(app)
        .post("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Weight",
          defaultUnit: "Kg",
          isPublic: true,
          categoryId: "invalid-id",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });

    it("should not create duplicate metric names for same user", async () => {
      // Create first metric
      await request(app)
        .post("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Unique Metric",
          defaultUnit: "units",
          isPublic: true,
        });

      // Try to create duplicate
      const res: Response = await request(app)
        .post("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Unique Metric",
          defaultUnit: "units",
          isPublic: true,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("🔍 Edge Cases", () => {
    it("should handle non-existent metric ID", async () => {
      const nonExistentId = "11111111-1111-1111-1111-111111111111";
      const res: Response = await request(app)
        .get(`/api/v1/metrics/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe("fail");
    });

    it("should handle malformed metric IDs", async () => {
      const res: Response = await request(app)
        .get("/api/v1/metrics/invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("🔄 Relationship Tests", () => {
    it("should fetch metrics with category information", async () => {
      // Create metric with category
      await request(app)
        .post("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Weight",
          defaultUnit: "Kg",
          isPublic: true,
          categoryId: dummyCategory.id,
        });

      const res: Response = await request(app)
        .get("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .query({ includeCategory: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.metrics[0]).toHaveProperty("category");
      expect(res.body.data.metrics[0].category).toHaveProperty("id");
      expect(res.body.data.metrics[0].category).toHaveProperty("name");
    });

    it("should handle metric creation with non-existent category", async () => {
      const res: Response = await request(app)
        .post("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Weight",
          defaultUnit: "Kg",
          isPublic: true,
          categoryId: "11111111-1111-1111-1111-111111111111",
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("🔍 Query Parameter Tests", () => {
    it("should filter metrics by isPublic flag", async () => {
      const res: Response = await request(app)
        .get("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .query({ isPublic: true });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.metrics)).toBe(true);
      res.body.data.metrics.forEach((metric: any) => {
        expect(metric.isPublic).toBe(true);
      });
    });

    it("should search metrics by name", async () => {
      const searchTerm = "Weight";
      const res: Response = await request(app)
        .get("/api/v1/metrics")
        .set("Authorization", `Bearer ${token}`)
        .query({ search: searchTerm });

      expect(res.statusCode).toBe(200);
      res.body.data.metrics.forEach((metric: any) => {
        expect(metric.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    });
  });
});
