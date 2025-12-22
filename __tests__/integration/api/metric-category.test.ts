import {
  api,
  authHeader,
  buildCategoryPayload,
  createCategory,
  createTestUser,
  uniqueName,
} from "../helpers/test-utils";

describe("Metric Category API", () => {
  let token: string;

  beforeEach(async () => {
    ({ token } = await createTestUser());
  });

  it("creates a metric category with defaults", async () => {
    const payload = buildCategoryPayload({ color: "#123456", icon: "💪" });
    const res = await api
      .post("/api/v1/metric-categories")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.message).toBe("Category created successfully");
    expect(res.body.data).toMatchObject({
      name: payload.name,
      color: "#123456",
      icon: "💪",
    });
  });

  it("lists categories via cursor pagination", async () => {
    const strengthName = uniqueName("Strength");
    await Promise.all([
      createCategory(token, { name: strengthName }),
      createCategory(token, { name: uniqueName("Mobility") }),
    ]);

    const res = await api
      .get("/api/v1/metric-categories")
      .set("Authorization", authHeader(token))
      .query({ limit: 10, includeTotal: true, q: strengthName });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe(strengthName);
    expect(res.body.data).toHaveProperty("totalCount", 1);
  });

  it("retrieves a category by id", async () => {
    const { category } = await createCategory(token);
    const res = await api
      .get(`/api/v1/metric-categories/${category.id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(category.id);
  });

  it("updates a category", async () => {
    const { category } = await createCategory(token, { name: "Body" });
    const res = await api
      .put(`/api/v1/metric-categories/${category.id}`)
      .set("Authorization", authHeader(token))
      .send({ name: "Body Mass" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Category updated successfully");
    expect(res.body.data.name).toBe("Body Mass");
  });

  it("deletes a category", async () => {
    const { category } = await createCategory(token);
    const res = await api
      .delete(`/api/v1/metric-categories/${category.id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Category deleted successfully");
  });

  it("prevents duplicate category names per user", async () => {
    const payload = buildCategoryPayload({ name: "Cardio" });
    await api
      .post("/api/v1/metric-categories")
      .set("Authorization", authHeader(token))
      .send(payload);

    const res = await api
      .post("/api/v1/metric-categories")
      .set("Authorization", authHeader(token))
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
  });

  it("validates required fields", async () => {
    const res = await api
      .post("/api/v1/metric-categories")
      .set("Authorization", authHeader(token))
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
  });

  it("returns 404 for unknown categories", async () => {
    const unknownId = "11111111-1111-1111-1111-111111111111";
    const [getRes, putRes, deleteRes] = await Promise.all([
      api
        .get(`/api/v1/metric-categories/${unknownId}`)
        .set("Authorization", authHeader(token)),
      api
        .put(`/api/v1/metric-categories/${unknownId}`)
        .set("Authorization", authHeader(token))
        .send({ name: "Updated" }),
      api
        .delete(`/api/v1/metric-categories/${unknownId}`)
        .set("Authorization", authHeader(token)),
    ]);

    [getRes, putRes, deleteRes].forEach((response) => {
      expect(response.status).toBe(404);
      expect(response.body.status).toBe("fail");
    });
  });

  it("blocks unauthenticated access", async () => {
    const res = await api.post("/api/v1/metric-categories").send({
      name: "Cardio",
    });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("fail");
  });

  it("rejects invalid tokens", async () => {
    const res = await api
      .get("/api/v1/metric-categories")
      .set("Authorization", "Bearer invalid");

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("fail");
  });

  it("respects optional fields during updates", async () => {
    const { category } = await createCategory(token);
    const res = await api
      .put(`/api/v1/metric-categories/${category.id}`)
      .set("Authorization", authHeader(token))
      .send({ icon: "🔥", color: "#00FF00" });

    expect(res.status).toBe(200);
    expect(res.body.data.icon).toBe("🔥");
    expect(res.body.data.color).toBe("#00FF00");
  });
});
