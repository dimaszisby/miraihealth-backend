import { EmailVerificationToken } from "@/features/auth/domain/entities/EmailVerificationToken.js";

const FROZEN_NOW = new Date("2026-05-08T10:00:00.000Z");

const makeToken = (
  overrides: Partial<{
    expiresAt: Date;
    usedAt: Date | null;
  }> = {},
) =>
  EmailVerificationToken.fromPersistence({
    id: "token-1",
    userId: "user-1",
    tokenHash: "a".repeat(64),
    expiresAt:
      overrides.expiresAt ??
      new Date(FROZEN_NOW.getTime() + 24 * 60 * 60 * 1000),
    usedAt: overrides.usedAt !== undefined ? overrides.usedAt : null,
    createdAt: FROZEN_NOW,
  });

describe("EmailVerificationToken entity", () => {
  it("exposes props through getters", () => {
    const token = makeToken();
    expect(token.id).toBe("token-1");
    expect(token.userId).toBe("user-1");
    expect(token.tokenHash).toBe("a".repeat(64));
  });

  describe("isUsed()", () => {
    it("returns false when usedAt is null", () => {
      expect(makeToken({ usedAt: null }).isUsed()).toBe(false);
    });

    it("returns true when usedAt is set", () => {
      expect(makeToken({ usedAt: FROZEN_NOW }).isUsed()).toBe(true);
    });
  });

  describe("isExpired()", () => {
    it("returns false when expiry is in the future", () => {
      const token = makeToken({
        expiresAt: new Date(FROZEN_NOW.getTime() + 1000),
      });
      expect(token.isExpired(FROZEN_NOW)).toBe(false);
    });

    it("returns true when expiry is in the past", () => {
      const token = makeToken({
        expiresAt: new Date(FROZEN_NOW.getTime() - 1000),
      });
      expect(token.isExpired(FROZEN_NOW)).toBe(true);
    });

    it("returns true when expiry equals now (boundary)", () => {
      const token = makeToken({ expiresAt: FROZEN_NOW });
      expect(token.isExpired(FROZEN_NOW)).toBe(true);
    });
  });

  describe("isUsable()", () => {
    it("returns true for unused, unexpired token", () => {
      const token = makeToken({
        expiresAt: new Date(FROZEN_NOW.getTime() + 1000),
        usedAt: null,
      });
      expect(token.isUsable(FROZEN_NOW)).toBe(true);
    });

    it("returns false for used token", () => {
      const token = makeToken({ usedAt: FROZEN_NOW });
      expect(token.isUsable(FROZEN_NOW)).toBe(false);
    });

    it("returns false for expired token", () => {
      const token = makeToken({
        expiresAt: new Date(FROZEN_NOW.getTime() - 1000),
        usedAt: null,
      });
      expect(token.isUsable(FROZEN_NOW)).toBe(false);
    });
  });

  describe("markUsed()", () => {
    it("sets usedAt and makes isUsed() return true", () => {
      const token = makeToken({ usedAt: null });
      expect(token.isUsed()).toBe(false);
      token.markUsed(FROZEN_NOW);
      expect(token.isUsed()).toBe(true);
      expect(token.usedAt).toEqual(FROZEN_NOW);
    });
  });
});
