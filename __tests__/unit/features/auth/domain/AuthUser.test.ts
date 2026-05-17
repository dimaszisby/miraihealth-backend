import { AuthUser } from "@/features/auth/domain/entities/AuthUser.js";

const makeUser = () =>
  AuthUser.fromPersistence({
    id: "user-1",
    email: "user@example.com",
    username: "tester",
    passwordHash: "hashed",
    isPublicProfile: true,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    deletedAt: null,
  });

describe("AuthUser entity", () => {
  it("normalizes and updates email", () => {
    const user = makeUser();
    user.changeEmail("  New@Example.COM  ");

    expect(user.email).toBe("new@example.com");
    expect(user.updatedAt.getTime()).toBeGreaterThan(
      new Date("2024-01-01T00:00:00Z").getTime(),
    );
  });

  it("rejects empty email and username updates", () => {
    const user = makeUser();
    expect(() => user.changeEmail("  ")).toThrow("Email cannot be empty");
    expect(() => user.changeUsername("")).toThrow("Username cannot be empty");
  });

  it("updates username, visibility, and password hash", () => {
    const user = makeUser();
    user.changeUsername("new-name");
    user.togglePublicProfile(false);
    user.setPasswordHash("next-hash");

    expect(user.username).toBe("new-name");
    expect(user.isPublicProfile).toBe(false);
    expect(user.passwordHash).toBe("next-hash");
  });
});
