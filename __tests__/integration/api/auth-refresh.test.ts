import { api, buildUserPayload, authHeader } from "../helpers/test-utils.js";

const extractRefreshCookie = (res: any): string | undefined => {
  const cookies: string[] = res.headers["set-cookie"] ?? [];
  const match = cookies
    .map((c: string) => c.match(/^lakira_refresh=([^;]+)/))
    .find(Boolean);
  return match?.[1];
};

const loginUser = async () => {
  const payload = buildUserPayload();
  await api.post("/api/v1/auth/register").send(payload);
  const loginRes = await api.post("/api/v1/auth/login").send({
    email: payload.email,
    password: payload.password,
  });
  return { loginRes, payload };
};

describe("Auth Refresh Token Flow", () => {
  it("login sets a refresh token cookie", async () => {
    const { loginRes } = await loginUser();

    expect(loginRes.status).toBe(200);
    const cookie = extractRefreshCookie(loginRes);
    expect(cookie).toBeDefined();
    expect(cookie!.length).toBeGreaterThan(20);
  });

  it("POST /auth/refresh rotates the token and returns new access token", async () => {
    const { loginRes } = await loginUser();
    const cookie = extractRefreshCookie(loginRes)!;

    const refreshRes = await api
      .post("/api/v1/auth/refresh")
      .set("Cookie", `lakira_refresh=${cookie}`);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data).toHaveProperty("token");
    expect(refreshRes.body.data.token).toBeTruthy();

    const newCookie = extractRefreshCookie(refreshRes);
    expect(newCookie).toBeDefined();
    expect(newCookie).not.toBe(cookie);
  });

  it("reusing an already-rotated refresh token returns 401 and revokes family", async () => {
    const { loginRes } = await loginUser();
    const originalCookie = extractRefreshCookie(loginRes)!;

    const firstRefresh = await api
      .post("/api/v1/auth/refresh")
      .set("Cookie", `lakira_refresh=${originalCookie}`);
    expect(firstRefresh.status).toBe(200);

    const reuseRes = await api
      .post("/api/v1/auth/refresh")
      .set("Cookie", `lakira_refresh=${originalCookie}`);
    expect(reuseRes.status).toBe(401);

    const newCookie = extractRefreshCookie(firstRefresh)!;
    const familyRevokedRes = await api
      .post("/api/v1/auth/refresh")
      .set("Cookie", `lakira_refresh=${newCookie}`);
    expect(familyRevokedRes.status).toBe(401);
  });

  it("POST /auth/logout revokes the refresh token family", async () => {
    const { loginRes } = await loginUser();
    const cookie = extractRefreshCookie(loginRes)!;

    const logoutRes = await api
      .post("/api/v1/auth/logout")
      .set("Cookie", `lakira_refresh=${cookie}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe("Logged out successfully");

    const refreshAfterLogout = await api
      .post("/api/v1/auth/refresh")
      .set("Cookie", `lakira_refresh=${cookie}`);
    expect(refreshAfterLogout.status).toBe(401);
  });

  it("POST /auth/refresh with no token returns 401", async () => {
    const res = await api.post("/api/v1/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("expired access token is rejected with 401", async () => {
    const res = await api
      .get("/api/v1/auth/profile")
      .set("Authorization", authHeader("expired.token.here"));
    expect(res.status).toBe(401);
  });

  it("POST /auth/refresh rejects Authorization header (cookie-only)", async () => {
    const { loginRes } = await loginUser();
    const cookie = extractRefreshCookie(loginRes)!;

    const refreshRes = await api
      .post("/api/v1/auth/refresh")
      .set("Authorization", `Bearer ${cookie}`);

    expect(refreshRes.status).toBe(401);
  });
});
