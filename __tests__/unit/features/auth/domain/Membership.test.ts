import { Membership } from "@/features/auth/domain/entities/Membership.js";

const makeMembership = (
  overrides: Partial<Parameters<typeof Membership.fromPersistence>[0]> = {},
) =>
  Membership.fromPersistence({
    id: "mem-1",
    userId: "user-1",
    organizationId: "org-1",
    role: "member",
    status: "active",
    joinedAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  });

describe("Membership entity", () => {
  it("exposes all properties via getters", () => {
    const m = makeMembership();
    expect(m.id).toBe("mem-1");
    expect(m.userId).toBe("user-1");
    expect(m.organizationId).toBe("org-1");
    expect(m.role).toBe("member");
    expect(m.status).toBe("active");
    expect(m.joinedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
  });

  describe("changeRole", () => {
    it("updates role to admin", () => {
      const m = makeMembership();
      m.changeRole("admin");
      expect(m.role).toBe("admin");
    });

    it("updates role to owner", () => {
      const m = makeMembership();
      m.changeRole("owner");
      expect(m.role).toBe("owner");
    });
  });

  describe("isOwner", () => {
    it("returns true for owner", () => {
      const m = makeMembership({ role: "owner" });
      expect(m.isOwner()).toBe(true);
    });

    it("returns false for admin", () => {
      const m = makeMembership({ role: "admin" });
      expect(m.isOwner()).toBe(false);
    });

    it("returns false for member", () => {
      const m = makeMembership({ role: "member" });
      expect(m.isOwner()).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("returns true for admin", () => {
      const m = makeMembership({ role: "admin" });
      expect(m.isAdmin()).toBe(true);
    });

    it("returns true for owner (owner implies admin)", () => {
      const m = makeMembership({ role: "owner" });
      expect(m.isAdmin()).toBe(true);
    });

    it("returns false for member", () => {
      const m = makeMembership({ role: "member" });
      expect(m.isAdmin()).toBe(false);
    });
  });

  describe("isActive", () => {
    it("returns true for active status", () => {
      const m = makeMembership({ status: "active" });
      expect(m.isActive()).toBe(true);
    });

    it("returns false for invited status", () => {
      const m = makeMembership({ status: "invited" });
      expect(m.isActive()).toBe(false);
    });

    it("returns false for removed status", () => {
      const m = makeMembership({ status: "removed" });
      expect(m.isActive()).toBe(false);
    });
  });
});
