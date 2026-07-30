import { describe, it, expect, jest, afterEach } from "@jest/globals";
import { api } from "../helpers/test-utils.js";
import sequelize from "@/config/db.js";
import { redisClient } from "@/utils/redis-client.js";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("GET /api/v1/ready", () => {
  it("returns 200 with both checks ok when db and redis respond", async () => {
    jest.spyOn(redisClient, "ping").mockResolvedValueOnce("PONG");

    const res = await api.get("/api/v1/ready");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.checks.db).toBe("ok");
    expect(res.body.checks.redis).toBe("ok");
  });

  it("returns 503 with db:fail when sequelize.authenticate throws", async () => {
    jest
      .spyOn(sequelize, "authenticate")
      .mockRejectedValueOnce(new Error("DB connection refused"));
    jest.spyOn(redisClient, "ping").mockResolvedValueOnce("PONG");

    const res = await api.get("/api/v1/ready");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
    expect(res.body.checks.db).toBe("fail");
    expect(res.body.checks.redis).toBe("ok");
  });

  it("returns 503 with redis:fail when redis.ping throws", async () => {
    jest
      .spyOn(redisClient, "ping")
      .mockRejectedValueOnce(new Error("Redis not connected"));

    const res = await api.get("/api/v1/ready");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
    expect(res.body.checks.db).toBe("ok");
    expect(res.body.checks.redis).toBe("fail");
  });

  it("is reachable without a JWT (unauthenticated)", async () => {
    jest.spyOn(redisClient, "ping").mockResolvedValueOnce("PONG");

    const res = await api.get("/api/v1/ready");
    expect(res.status).not.toBe(401);
  });
});
