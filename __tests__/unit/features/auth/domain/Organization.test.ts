import { Organization } from "@/features/auth/domain/entities/Organization.js";

const makeOrg = (
  overrides: Partial<Parameters<typeof Organization.fromPersistence>[0]> = {},
) =>
  Organization.fromPersistence({
    id: "org-1",
    name: "Acme Corp",
    slug: "acme-corp-abcd1234",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    deletedAt: null,
    ...overrides,
  });

describe("Organization entity", () => {
  it("exposes all properties via getters", () => {
    const org = makeOrg();
    expect(org.id).toBe("org-1");
    expect(org.name).toBe("Acme Corp");
    expect(org.slug).toBe("acme-corp-abcd1234");
    expect(org.deletedAt).toBeNull();
  });

  describe("changeName", () => {
    it("updates name and touches updatedAt", () => {
      const org = makeOrg();
      org.changeName("New Name");
      expect(org.name).toBe("New Name");
      expect(org.updatedAt.getTime()).toBeGreaterThan(
        new Date("2024-01-01T00:00:00Z").getTime(),
      );
    });

    it("trims whitespace", () => {
      const org = makeOrg();
      org.changeName("  Trimmed  ");
      expect(org.name).toBe("Trimmed");
    });

    it("rejects empty name", () => {
      const org = makeOrg();
      expect(() => org.changeName("  ")).toThrow(
        "Organization name cannot be empty",
      );
    });

    it("rejects name over 100 characters", () => {
      const org = makeOrg();
      expect(() => org.changeName("x".repeat(101))).toThrow(
        "Organization name must be 100 characters or less",
      );
    });

    it("accepts exactly 100 characters", () => {
      const org = makeOrg();
      org.changeName("x".repeat(100));
      expect(org.name).toBe("x".repeat(100));
    });
  });

  describe("changeSlug", () => {
    it("updates slug in lowercase and touches updatedAt", () => {
      const org = makeOrg();
      org.changeSlug("NEW-SLUG");
      expect(org.slug).toBe("new-slug");
      expect(org.updatedAt.getTime()).toBeGreaterThan(
        new Date("2024-01-01T00:00:00Z").getTime(),
      );
    });

    it("rejects empty slug", () => {
      const org = makeOrg();
      expect(() => org.changeSlug("  ")).toThrow(
        "Organization slug cannot be empty",
      );
    });

    it("rejects slug over 100 characters", () => {
      const org = makeOrg();
      expect(() => org.changeSlug("x".repeat(101))).toThrow(
        "Organization slug must be 100 characters or less",
      );
    });
  });

  describe("softDelete", () => {
    it("sets deletedAt and touches updatedAt", () => {
      const org = makeOrg();
      org.softDelete();
      expect(org.deletedAt).toBeInstanceOf(Date);
      expect(org.updatedAt.getTime()).toBeGreaterThan(
        new Date("2024-01-01T00:00:00Z").getTime(),
      );
    });
  });
});
