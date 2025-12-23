import { api, createTestUser, authHeader } from "../helpers/test-utils.js";

describe("Swagger documentation routes", () => {
  it("requires authentication for the docs UI", async () => {
    const res = await api.get("/api/v1/docs");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe("fail");
  });

  it("returns OpenAPI JSON when authenticated", async () => {
    const { token } = await createTestUser();
    const res = await api
      .get("/api/v1/docs/openapi.json")
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toHaveProperty("openapi");
    expect(res.body).toHaveProperty("paths");
  });
});
