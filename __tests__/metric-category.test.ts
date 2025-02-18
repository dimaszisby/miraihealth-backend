import request from "supertest";
import app from "../src/server.js";
import { User } from "../src/models/user.js";
import { Response } from "supertest";

/**
 * Generates unique user test data to avoid conflicts.
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

describe("📂 Metric Category Endpoints", () => {
  let token: string;
  let user: User;

  beforeEach(async () => {
    // 🛠 Setup User: Register a new user
    const userData = generateUniqueUserData();
    const newUser: Response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(newUser.statusCode).toBe(201);

    // 🔑 Login User & Get Token
    const loginRes: Response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.data.token;

    if (!token) throw new Error("Authentication failed. No token received.");

    // ✅ Fetch user from DB & Handle `null` case properly
    const foundUser = await User.findOne({ where: { email: userData.email } });
    if (!foundUser) throw new Error("Test user not found in the database.");
    user = foundUser;
  });

  /**
   * * ✅ TEST CASES ✅
   */

  it("📝 Should create a new Metric Category", async () => {
    const res: Response = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Muscle" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Category created successfully");
    expect(res.body.data.category.name).toBe("Muscle");
  });

  it("📚 Should fetch all categories for the authenticated user", async () => {
    const res: Response = await request(app)
      .get("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.categories)).toBe(true);
  });

  it("🔍 Should fetch a specific category by ID", async () => {
    // Create a category to fetch later
    const categoryRes: Response = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Body Composition" });

    expect(categoryRes.statusCode).toBe(201);

    const categoryId = categoryRes.body.data.category.id;

    // Fetch category
    const res: Response = await request(app)
      .get(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.category).toHaveProperty("name");
    expect(res.body.data.category).toHaveProperty("icon");
    expect(res.body.data.category).toHaveProperty("color");
  });

  it("✏️ Should update a metric category", async () => {
    // Create a category to update
    const categoryRes: Response = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Body Composition" });

    expect(categoryRes.statusCode).toBe(201);
    const categoryId = categoryRes.body.data.category.id;

    // Update the category
    const res: Response = await request(app)
      .put(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Body Mass Index" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Category updated successfully");
    expect(res.body.data.category.name).toBe("Body Mass Index");
  });

  it("🗑️ Should delete a metric category", async () => {
    // Create a category to delete
    const categoryRes: Response = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Body Fat Percentage" });

    expect(categoryRes.statusCode).toBe(201);
    const categoryId = categoryRes.body.data.category.id;

    // Delete category
    const res: Response = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Category deleted successfully");
  });

  describe("🔒 Authorization Tests", () => {
    it("should not create category without authentication", async () => {
      const res: Response = await request(app)
        .post("/api/v1/categories")
        .send({ name: "Muscle" });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should not access categories with invalid token", async () => {
      const res: Response = await request(app)
        .get("/api/v1/categories")
        .set("Authorization", "Bearer invalid_token");

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("✅ Validation Tests", () => {
    it("should not create category with empty name", async () => {
      const res: Response = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "" });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });

    it("should not create duplicate category names for same user", async () => {
      // Create first category
      await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Unique Category" });

      // Try to create duplicate
      const res: Response = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Unique Category" });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("🔍 Edge Cases", () => {
    it("should handle non-existent category ID", async () => {
      const nonExistentId = "11111111-1111-1111-1111-111111111111";
      const res: Response = await request(app)
        .get(`/api/v1/categories/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe("fail");
    });

    it("should not update non-existent category", async () => {
      const nonExistentId = "11111111-1111-1111-1111-111111111111";
      const res: Response = await request(app)
        .put(`/api/v1/categories/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe("fail");
    });

    it("should not delete non-existent category", async () => {
      const nonExistentId = "11111111-1111-1111-1111-111111111111";
      const res: Response = await request(app)
        .delete(`/api/v1/categories/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("🎨 Optional Fields Tests", () => {
    it("should create category with custom icon and color", async () => {
      const res: Response = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Cardio",
          icon: "heart",
          color: "#FF0000",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.category.icon).toBe("heart");
      expect(res.body.data.category.color).toBe("#FF0000");
    });

    it("should update category optional fields", async () => {
      // Create category first
      const category = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Test Category" });

      const categoryId = category.body.data.category.id;

      // Update optional fields
      const res: Response = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          icon: "dumbbell",
          color: "#00FF00",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.category.icon).toBe("dumbbell");
      expect(res.body.data.category.color).toBe("#00FF00");
    });
  });
});
