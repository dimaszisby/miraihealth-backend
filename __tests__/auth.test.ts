// auth.test.ts

import request from "supertest";
import app from "../src/server.js";

/**
 * * Auth Tests
 * Tests authentication endpoints including user registration, login, and error handling.
 */

/**
 * Generates unique user test data to prevent conflicts.
 * @returns Unique test user data
 */
const generateUniqueUserData = () => {
  const timestamp = Date.now();
  return {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@example.com`,
    password: "Password123!",
    passwordConfirmation: "Password123!",
    age: 25,
    sex: "male",
  };
};

/**
 * * Auth API Tests
 */
describe("🔒 Auth Endpoints", () => {
  let testUser = generateUniqueUserData();
  let authToken = "";

  /**
   * ✅ Test: User Registration
   */
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register") // Removed /api/v1 prefix
      .send(testUser);

    if (res.statusCode !== 201) {
      console.error("❌ Register Error:", res.body);
    }

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user).toHaveProperty("email", testUser.email);

    // Store token for later tests
    authToken = res.body.data.token;
  });

  /**
   * ✅ Test: User Login
   */
  it("should login the user", async () => {
    // Register user first
    await request(app).post("/api/v1/auth/register").send(testUser);

    const res = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    if (res.statusCode !== 200) {
      console.error("❌ Login Error:", res.body);
    }

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user).toHaveProperty("email", testUser.email);

    // Store token for later tests
    authToken = res.body.data.token;
  });

  /**
   * ✅ Test: Login Failure with Wrong Credentials
   */
  it("should not login with wrong credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "nonexistent@example.com",
      password: "WrongPassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe("fail");
  });

  /**
   * ✅ Test: Fetch User Profile with Authentication
   */
  it("should fetch user profile when authenticated", async () => {
    // Register and login first
    const userData = generateUniqueUserData();
    await request(app).post("/api/v1/auth/register").send(userData);

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: userData.email,
      password: userData.password,
    });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("email", userData.email);
  });

  /**
   * ✅ Test: Prevent Fetching Profile Without Authentication
   */
  it("should not fetch profile without authentication", async () => {
    const res = await request(app).get("/api/v1/auth/profile");

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe("fail");
  });

  describe("Validation Tests", () => {
    it("should fail when passwords do not match", async () => {
      const invalidUser = {
        ...generateUniqueUserData(),
        passwordConfirmation: "DifferentPassword123!",
      };

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
      expect(res.body.errors).toBeDefined();
    });

    it("should fail when required fields are missing", async () => {
      const incompleteUser = {
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
        // Missing passwordConfirmation for test purposes
      };

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(incompleteUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
      expect(res.body.errors).toContainEqual({
        field: "body.passwordConfirmation",
        message: "Required",
      });
    });
  });
});
