import { api, authHeader, createTestUser } from "../helpers/test-utils.js";

type GuardedEndpoint = {
  method: "post" | "put" | "patch";
  url: string;
  requiresAuth?: boolean;
};

const guardedEndpoints: GuardedEndpoint[] = [
  { method: "post", url: "/api/v1/auth/register" },
  { method: "post", url: "/api/v1/auth/login" },
  { method: "put", url: "/api/v1/auth/profile", requiresAuth: true },
  { method: "post", url: "/api/v1/metric-categories", requiresAuth: true },
  {
    method: "put",
    url: "/api/v1/metric-categories/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    requiresAuth: true,
  },
  { method: "post", url: "/api/v1/metrics", requiresAuth: true },
  {
    method: "put",
    url: "/api/v1/metrics/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    requiresAuth: true,
  },
  { method: "post", url: "/api/v1/metric-logs", requiresAuth: true },
  {
    method: "put",
    url: "/api/v1/metric-logs/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    requiresAuth: true,
  },
  { method: "post", url: "/api/v1/metric-settings", requiresAuth: true },
  {
    method: "put",
    url: "/api/v1/metric-settings/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    requiresAuth: true,
  },
  {
    method: "patch",
    url: "/api/v1/metric-settings/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/achieve",
    requiresAuth: true,
  },
  {
    method: "patch",
    url: "/api/v1/metric-settings/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/display",
    requiresAuth: true,
  },
];

describe("JSON body guard", () => {
  let token: string;

  beforeEach(async () => {
    const auth = await createTestUser();
    token = auth.token;
  });

  it.each(guardedEndpoints)(
    "rejects scalar payloads for %s %s",
    async ({ method, url, requiresAuth }) => {
      const request = api[method](url);
      if (requiresAuth) {
        request.set("Authorization", authHeader(token));
      }

      const res = await request
        .set("Content-Type", "application/json")
        .send("");

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("fail");
      expect(Array.isArray(res.body.errors)).toBe(true);
    },
  );
});
