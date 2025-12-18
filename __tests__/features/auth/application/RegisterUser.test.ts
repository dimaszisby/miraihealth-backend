import { jest } from "@jest/globals";
import { RegisterUser } from "@/features/auth/application/use-cases/RegisterUser";
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
  const sut = new RegisterUser(repo, hasher, token);
  return { sut, repo, hasher, token };
};

describe("RegisterUser use case", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("creates a new user and returns auth payload", async () => {
    const { sut, repo, hasher, token } = build();
    const user = makeUser();
    repo.existsByEmail.mockResolvedValue(false);
    repo.existsByUsername.mockResolvedValue(false);
    repo.create.mockResolvedValue(user);
    hasher.hash.mockResolvedValue("secure-hash");
    token.sign.mockReturnValue("jwt-token");

    const result = await sut.execute({
      email: "User@Example.com ",
      username: " Tester ",
      password: "Password123!",
      passwordConfirmation: "Password123!",
    });

    expect(repo.existsByEmail).toHaveBeenCalledWith("user@example.com");
    expect(repo.existsByUsername).toHaveBeenCalledWith("Tester");
    expect(repo.create).toHaveBeenCalledWith({
      email: "user@example.com",
      username: "Tester",
      passwordHash: "secure-hash",
    });
    expect(token.sign).toHaveBeenCalledWith({
      id: user.id,
      email: user.email,
      username: user.username,
    });
    expect(result).toEqual({ user, token: "jwt-token" });
  });

  it("throws when passwords mismatch", async () => {
    const { sut } = build();

    await expect(
      sut.execute({
        email: "user@example.com",
        username: "tester",
        password: "one",
        passwordConfirmation: "two",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("throws when email already exists", async () => {
    const { sut, repo } = build();
    repo.existsByEmail.mockResolvedValue(true);

    await expect(
      sut.execute({
        email: "user@example.com",
        username: "tester",
        password: "Password123!",
        passwordConfirmation: "Password123!",
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
