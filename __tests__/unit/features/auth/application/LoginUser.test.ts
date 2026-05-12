import { jest } from "@jest/globals";
import { LoginUser } from "@/features/auth/application/use-cases/LoginUser.js";
import { IssueRefreshToken } from "@/features/auth/application/use-cases/IssueRefreshToken.js";
import { UserRepository } from "@/features/auth/domain/repositories/UserRepository.js";
import { MembershipRepository } from "@/features/auth/domain/repositories/MembershipRepository.js";
import { PasswordHasher } from "@/features/auth/application/ports/PasswordHasher.js";
import { TokenProvider } from "@/features/auth/application/ports/TokenProvider.js";
import { RefreshTokenRepository } from "@/features/auth/domain/repositories/RefreshTokenRepository.js";
import { TokenHasher } from "@/features/auth/application/ports/TokenHasher.js";
import { AuthUser } from "@/features/auth/domain/entities/AuthUser.js";
import { Membership } from "@/features/auth/domain/entities/Membership.js";
import AppError from "@/utils/AppError.js";

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

const makeMembership = () =>
  Membership.fromPersistence({
    id: "mem-1",
    userId: "user-1",
    organizationId: "org-1",
    role: "owner",
    status: "active",
    joinedAt: new Date(),
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
  const membershipRepo: jest.Mocked<MembershipRepository> = {
    findById: jest.fn(),
    findByUserAndOrg: jest.fn(),
    findDefaultByUser: jest.fn(),
    findAllByUser: jest.fn(),
    findAllByOrganization: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const hasher: jest.Mocked<PasswordHasher> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };
  const token: jest.Mocked<TokenProvider> = {
    sign: jest.fn(),
    verify: jest.fn(),
  };
  const refreshTokenRepo: jest.Mocked<RefreshTokenRepository> = {
    save: jest.fn(),
    findByTokenHash: jest.fn(),
    findByTokenHashForUpdate: jest.fn(),
    revokeFamily: jest.fn(),
    findActiveByUser: jest.fn(),
  };
  const tokenHasher: jest.Mocked<TokenHasher> = {
    generate: jest
      .fn<TokenHasher["generate"]>()
      .mockReturnValue("raw-refresh-token"),
    hash: jest.fn<TokenHasher["hash"]>().mockReturnValue("hashed-token"),
  };
  const issueRefreshToken = new IssueRefreshToken(
    refreshTokenRepo,
    tokenHasher,
    30,
  );
  const sut = new LoginUser(
    repo,
    membershipRepo,
    hasher,
    token,
    issueRefreshToken,
  );
  return { sut, repo, membershipRepo, hasher, token, refreshTokenRepo };
};

describe("LoginUser use case", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns token and refresh token when credentials are valid", async () => {
    const { sut, repo, membershipRepo, hasher, token, refreshTokenRepo } =
      build();
    const user = makeUser();
    repo.findByEmail.mockResolvedValue(user);
    membershipRepo.findDefaultByUser.mockResolvedValue(makeMembership());
    hasher.compare.mockResolvedValue(true);
    token.sign.mockReturnValue("jwt");
    refreshTokenRepo.save.mockResolvedValue(undefined);

    const result = await sut.execute({
      email: " User@example.com ",
      password: "Password123!",
    });

    expect(repo.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(hasher.compare).toHaveBeenCalledWith("Password123!", "hash");
    expect(result.user).toEqual(user);
    expect(result.token).toBe("jwt");
    expect(result.rawRefreshToken).toBeDefined();
    expect(refreshTokenRepo.save).toHaveBeenCalled();
  });

  it("throws when user is not found", async () => {
    const { sut, repo } = build();
    repo.findByEmail.mockResolvedValue(null);

    await expect(
      sut.execute({ email: "missing@example.com", password: "Password123!" }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("throws when password mismatch", async () => {
    const { sut, repo, hasher } = build();
    repo.findByEmail.mockResolvedValue(makeUser());
    hasher.compare.mockResolvedValue(false);

    await expect(
      sut.execute({ email: "user@example.com", password: "WrongPassword" }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("throws 403 when user has no active membership", async () => {
    const { sut, repo, hasher, membershipRepo } = build();
    repo.findByEmail.mockResolvedValue(makeUser());
    hasher.compare.mockResolvedValue(true);
    membershipRepo.findDefaultByUser.mockResolvedValue(null);

    await expect(
      sut.execute({ email: "user@example.com", password: "Password123!" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
