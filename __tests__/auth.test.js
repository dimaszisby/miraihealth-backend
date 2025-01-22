const request = require("supertest");
const app = require("../server");

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

describe("Auth Endpoints", () => {
  /*
   * Test Cases
   */

  it("should register a new user", async () => {
    const userData = generateUniqueUserData();

    const res = await request(app).post("/api/v1/auth/register").send(userData);
    if (res.statusCode !== 201) {
      console.log("Register Error:", res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user).toHaveProperty("email", userData.email);
  });

  it("should login the user", async () => {
    const userData = generateUniqueUserData();

    const res = await request(app).post("/api/v1/auth/register").send(userData);
    if (res.statusCode !== 201) {
      console.log("Register Error:", res.body);
    }

    // Then, login
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: userData.email,
      password: userData.password,
    });
    if (loginRes.statusCode !== 200) {
      console.log("Login Error:", loginRes.body);
    }
    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body.data).toHaveProperty("token");
    expect(loginRes.body.data.user).toHaveProperty("email", userData.email);
  });

  it("should not login with wrong credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "WrongPassword",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("message", "Invalid email or password");
  });
});
