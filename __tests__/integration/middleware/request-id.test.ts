import { describe, it, expect } from "@jest/globals";
import { api } from "../helpers/test-utils.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("Request-ID middleware", () => {
  it("echoes a provided x-request-id header back in the response", async () => {
    const customId = "my-trace-id-abc123";
    const res = await api.get("/api/v1/health").set("x-request-id", customId);
    expect(res.headers["x-request-id"]).toBe(customId);
  });

  it("generates a UUID v4 when no x-request-id header is provided", async () => {
    const res = await api.get("/api/v1/health");
    expect(res.headers["x-request-id"]).toMatch(UUID_PATTERN);
  });

  it("two sequential requests receive distinct generated IDs", async () => {
    const res1 = await api.get("/api/v1/health");
    const res2 = await api.get("/api/v1/health");
    expect(res1.headers["x-request-id"]).toMatch(UUID_PATTERN);
    expect(res2.headers["x-request-id"]).toMatch(UUID_PATTERN);
    expect(res1.headers["x-request-id"]).not.toBe(res2.headers["x-request-id"]);
  });
});
