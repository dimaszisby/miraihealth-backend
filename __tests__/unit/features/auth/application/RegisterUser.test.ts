import { jest } from "@jest/globals";
import { RegisterUser } from "@/features/auth/application/use-cases/RegisterUser.js";
import { UserRepository } from "@/features/auth/domain/repositories/UserRepository.js";
import { OrganizationRepository } from "@/features/auth/domain/repositories/OrganizationRepository.js";
import { MembershipRepository } from "@/features/auth/domain/repositories/MembershipRepository.js";
import { PasswordHasher } from "@/features/auth/application/ports/PasswordHasher.js";
import { TokenProvider } from "@/features/auth/application/ports/TokenProvider.js";
import { AuthUser } from "@/features/auth/domain/entities/AuthUser.js";
import { Organization } from "@/features/auth/domain/entities/Organization.js";
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

const makeOrg = () =>
  Organization.fromPersistence({
    id: "org-1",
    name: "Tester",
    slug: "tester-user-1-s",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

const makeMembership = () =>
  Membership.fromPersistence({
    id: "membership-1",
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
  const orgRepo: jest.Mocked<OrganizationRepository> = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn(),
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
  const sut = new RegisterUser(repo, orgRepo, membershipRepo, hasher, token);
  return { sut, repo, orgRepo, membershipRepo, hasher, token };
};

describe("RegisterUser use case", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("creates a new user with org and membership, returns auth payload", async () => {
    const { sut, repo, orgRepo, membershipRepo, hasher, token } = build();
    const user = makeUser();
    const org = makeOrg();
    const membership = makeMembership();
    repo.existsByEmail.mockResolvedValue(false);
    repo.existsByUsername.mockResolvedValue(false);
    repo.create.mockResolvedValue(user);
    orgRepo.create.mockResolvedValue(org);
    membershipRepo.create.mockResolvedValue(membership);
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
      isPublicProfile: true,
    });
    expect(orgRepo.create).toHaveBeenCalledWith({
      name: "Tester",
      slug: expect.stringMatching(/^tester-/),
    });
    expect(membershipRepo.create).toHaveBeenCalledWith({
      userId: user.id,
      organizationId: org.id,
      role: "owner",
      status: "active",
    });
    expect(token.sign).toHaveBeenCalledWith({
      id: user.id,
      email: user.email,
      username: user.username,
      organizationId: org.id,
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
      }),
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
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
