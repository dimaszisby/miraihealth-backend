import { env } from "@/config/envManager.js";
import { redisClient } from "@/utils/redis-client.js";
import { createHash } from "crypto";
import { api, buildUserPayload } from "../helpers/test-utils.js";

const describeRedis = env.ENABLE_REDIS_INTEGRATION ? describe : describe.skip;

describeRedis("POST /api/v1/auth/login — account lockout", () => {
  const lockoutKey = (email: string) =>
    `auth:lockout:${createHash("sha256")
      .update(email.trim().toLowerCase())
      .digest("hex")}`;

  it("returns 429 with Retry-After after 5 failed attempts", async () => {
    const payload = buildUserPayload();
    const registerRes = await api
      .post("/api/v1/auth/register")
      .send(payload)
      .expect(201);
    expect(registerRes.body.status).toBe("success");

    await redisClient.del(lockoutKey(payload.email));

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const res = await api.post("/api/v1/auth/login").send({
        email: payload.email,
        password: "WrongPassword!",
      });
      expect(res.status).toBe(401);
    }

    const lockoutRes = await api.post("/api/v1/auth/login").send({
      email: payload.email,
      password: "WrongPassword!",
    });

    expect(lockoutRes.status).toBe(429);
    expect(lockoutRes.headers["retry-after"]).toBe("900");

    await redisClient.del(lockoutKey(payload.email));
  });

  it("resets the counter after a successful login", async () => {
    const payload = buildUserPayload();
    await api.post("/api/v1/auth/register").send(payload).expect(201);
    await redisClient.del(lockoutKey(payload.email));

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const res = await api.post("/api/v1/auth/login").send({
        email: payload.email,
        password: "WrongPassword!",
      });
      expect(res.status).toBe(401);
    }

    const okRes = await api.post("/api/v1/auth/login").send({
      email: payload.email,
      password: payload.password,
    });
    expect(okRes.status).toBe(200);

    const counter = await redisClient.get(lockoutKey(payload.email));
    expect(counter).toBeNull();

    await redisClient.del(lockoutKey(payload.email));
  });
});
