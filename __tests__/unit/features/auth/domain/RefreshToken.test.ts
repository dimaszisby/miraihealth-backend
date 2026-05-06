import { RefreshToken } from "@/features/auth/domain/entities/RefreshToken.js";

describe("RefreshToken entity", () => {
  const makeToken = (
    overrides: Partial<Parameters<typeof RefreshToken.fromPersistence>[0]> = {},
  ) =>
    RefreshToken.fromPersistence({
      id: "rt-1",
      userId: "user-1",
      familyId: "fam-1",
      tokenHash: "abc123",
      issuedAt: new Date("2026-01-01"),
      expiresAt: new Date("2026-01-31"),
      revokedAt: null,
      replacedById: null,
      userAgent: "Mozilla/5.0",
      ip: "127.0.0.1",
      ...overrides,
    });

  it("exposes all getters", () => {
    const rt = makeToken();
    expect(rt.id).toBe("rt-1");
    expect(rt.userId).toBe("user-1");
    expect(rt.familyId).toBe("fam-1");
    expect(rt.tokenHash).toBe("abc123");
    expect(rt.userAgent).toBe("Mozilla/5.0");
    expect(rt.ip).toBe("127.0.0.1");
    expect(rt.revokedAt).toBeNull();
    expect(rt.replacedById).toBeNull();
  });

  it("issue() creates a new token with generated id and familyId", () => {
    const rt = RefreshToken.issue("user-1", "hash-val", { ttlDays: 7 });
    expect(rt.userId).toBe("user-1");
    expect(rt.tokenHash).toBe("hash-val");
    expect(rt.id).toBeDefined();
    expect(rt.familyId).toBeDefined();
    expect(rt.revokedAt).toBeNull();
    expect(rt.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("issue() uses provided familyId", () => {
    const rt = RefreshToken.issue("user-1", "hash", {
      familyId: "my-family",
    });
    expect(rt.familyId).toBe("my-family");
  });

  it("isRevoked() returns false when revokedAt is null", () => {
    expect(makeToken().isRevoked()).toBe(false);
  });

  it("isRevoked() returns true when revokedAt is set", () => {
    expect(makeToken({ revokedAt: new Date() }).isRevoked()).toBe(true);
  });

  it("isExpired() returns true when expiresAt is in the past", () => {
    const rt = makeToken({ expiresAt: new Date("2020-01-01") });
    expect(rt.isExpired()).toBe(true);
  });

  it("isExpired() returns false when expiresAt is in the future", () => {
    const rt = makeToken({
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    expect(rt.isExpired()).toBe(false);
  });

  it("markRevoked() sets revokedAt", () => {
    const rt = makeToken();
    const now = new Date("2026-01-15");
    rt.markRevoked(now);
    expect(rt.revokedAt).toEqual(now);
    expect(rt.isRevoked()).toBe(true);
  });

  it("replaceWith() sets replacedById", () => {
    const rt = makeToken();
    rt.replaceWith("rt-2");
    expect(rt.replacedById).toBe("rt-2");
  });

  it("replaceWith() throws when already replaced", () => {
    const rt = makeToken({ replacedById: "rt-2" });
    expect(() => rt.replaceWith("rt-3")).toThrow("already replaced");
  });
});
