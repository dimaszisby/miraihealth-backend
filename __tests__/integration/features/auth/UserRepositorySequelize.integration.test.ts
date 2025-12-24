import { UserRepositorySequelize } from "@/features/auth/infrastructure/persistence/UserRepositorySequelize.js";
import { models } from "@/infrastructure/db/models.js";
import { createUserRow, truncateAllTables } from "../../helpers/db-fixtures.js";

const repo = new UserRepositorySequelize();

describe("UserRepositorySequelize (integration)", () => {
  beforeEach(async () => {
    await truncateAllTables();
  });

  // Developer note: happy-path creation flow verifying persistence + domain mapping.
  it("creates user rows and maps to AuthUser domain", async () => {
    const user = await repo.create({
      email: "author@example.com",
      username: "author",
      passwordHash: "bcrypt-hash",
    });

    expect(user.email).toBe("author@example.com");
    const row = await models.User.findByPk(user.id);
    expect(row).not.toBeNull();
    expect(row?.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(row?.username).toBe("author");
  });

  it("checks uniqueness by email and username", async () => {
    await createUserRow({
      email: "dupe@example.com",
      username: "dupe",
    });

    await expect(repo.existsByEmail("dupe@example.com")).resolves.toBe(true);
    await expect(repo.existsByEmail("new@example.com")).resolves.toBe(false);
    await expect(repo.existsByUsername("dupe")).resolves.toBe(true);
    await expect(repo.existsByUsername("fresh")).resolves.toBe(false);
  });

  it("finds users by id and email, returning null for unknown values", async () => {
    const created = await createUserRow({
      email: "finder@example.com",
      username: "finder",
    });

    const byId = await repo.findById(created.id);
    const byEmail = await repo.findByEmail("finder@example.com");
    const missing = await repo.findByEmail("missing@example.com");

    expect(byId?.id).toBe(created.id);
    expect(byEmail?.email).toBe("finder@example.com");
    expect(missing).toBeNull();
  });

  it("updates persisted users via save()", async () => {
    const created = await repo.create({
      email: "edit@example.com",
      username: "edit",
      passwordHash: "hash",
    });

    created.changeEmail("edited@example.com");
    created.changeUsername("edited");
    created.togglePublicProfile(false);
    created.setPasswordHash("next");

    const saved = await repo.save(created);
    const row = await models.User.findByPk(saved.id);

    expect(row?.email).toBe("edited@example.com");
    expect(row?.username).toBe("edited");
    expect(row?.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(row?.isPublicProfile).toBe(false);
    expect(saved.passwordHash).toBe(row?.password);
  });
});
