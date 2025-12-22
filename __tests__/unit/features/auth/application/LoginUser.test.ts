import { jest } from "@jest/globals";
import { LoginUser } from "@/features/auth/application/use-cases/LoginUser";
import { UserRepository } from "@/features/auth/domain/repositories/UserRepository";
import { PasswordHasher } from "@/features/auth/application/ports/PasswordHasher";
import { TokenProvider } from "@/features/auth/application/ports/TokenProvider";
import { AuthUser } from "@/features/auth/domain/entities/AuthUser";
import AppError from "@/utils/AppError";

const makeUser = () =>
  AuthUser.fromPersistence({
    id: "user-1",
    email: "user@example.com",
    username: "tester",
    passwordHash: "hash",
    role: "user",
    isPublicProfile: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

const build = () => {
  const repo: jest.Mocked<UserRepository> = {
    existsByEmail: jest.fn(),
    existsByUsername: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const hasher: jest.Mocked<PasswordHasher> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };
  const token: jest.Mocked<TokenProvider> = {
    sign: jest.fn(),
  };
  const sut = new LoginUser(repo, hasher, token);
  return { sut, repo, hasher, token };
};

describe("LoginUser use case", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns token when credentials are valid", async () => {
    const { sut, repo, hasher, token } = build();
    const user = makeUser();
    repo.findByEmail.mockResolvedValue(user);
    hasher.compare.mockResolvedValue(true);
    token.sign.mockReturnValue("jwt");

    const result = await sut.execute(" User@example.com ", "Password123!");

    expect(repo.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(hasher.compare).toHaveBeenCalledWith("Password123!", "hash");
    expect(result).toEqual({ user, token: "jwt" });
  });

  it("throws when user is not found", async () => {
    const { sut, repo } = build();
    repo.findByEmail.mockResolvedValue(null);

    await expect(
      sut.execute("missing@example.com", "Password123!"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("throws when password mismatch", async () => {
    const { sut, repo, hasher } = build();
    repo.findByEmail.mockResolvedValue(makeUser());
    hasher.compare.mockResolvedValue(false);

    await expect(
      sut.execute("user@example.com", "WrongPassword"),
    ).rejects.toBeInstanceOf(AppError);
  });
});
