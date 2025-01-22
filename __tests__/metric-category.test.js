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

describe("Metric Category Endpoints", () => {
  let token;
  let user;

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

    // Validate Token Token for test
    token = loginRes.body.data.token;
    if (!token) {
      throw new Error("Authentication failed. Token not received.");
    }
    console.log("Token Recieved:", loginRes.body.token);

    // Fetch the user from the database
    user = await User.findOne({ where: { email: "testuser@example.com" } });
    if (!user) {
      throw new Error("Test user not found in the database.");
    }
    console.log("User Id is created and ready for testing insertion:", user.id);
  });

  /*
   * Test Cases
   */

  it("Should create a new Category", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Muscle",
      });

    if (res.statusCode !== 201) {
      console.log("Create Category Error:", res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("message", "Category created successfully");
    expect(res.body.data.category).toHaveProperty("name", "Muscle");
    expect(res.body.data.category.name).toEqual("Muscle");
  });

  it("Should fetch all categories from authenticated user", async () => {
    const res = await request(app)
      .get("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Fetch all categories for user Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.data.categories)).toBe(true);
  });

  it("Should fetch a category from authenticated user", async () => {
    // Create initial category to fetch via API to ensure consistency
    const category = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Body Composition",
      });

    if (category.statusCode !== 201) {
      console.log("Create Category Error:", category.body);
    }

    const categoryId = category.body.data.category.id;

    // Get category
    const res = await request(app)
      .get(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`);

    if (res.statusCode !== 200) {
      console.log("Fetch a category for user Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.category).toHaveProperty("name");
    expect(res.body.data.category).toHaveProperty("icon");
    expect(res.body.data.category).toHaveProperty("color");
  });

  it("Should update a category", async () => {
    // Create initial category to update via API to ensure consistency
    const category = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Body Composition",
      });

    if (category.statusCode !== 201) {
      console.log("Create Category Error:", category.body);
    }
    const categoryId = category.body.data.category.id;

    // Update category
    const res = await request(app)
      .put(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Body Mass Index",
      });

    if (res.statusCode !== 200) {
      console.log("Update Category Error:", res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Category updated successfully");
    expect(res.body.data.category.name).toEqual("Body Mass Index");
  });

  it("Should delete a category", async () => {
    // Create initial category to delete via API to ensure consistency
    const category = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Body Fat Percentage",
      });

    if (category.statusCode !== 201) {
      console.log("Create Category Error:", category.body);
    }
    const categoryId = category.body.data.category.id;

    // Delete category
    const res = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Category deleted successfully");
  });
});
