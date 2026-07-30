import { jest } from "@jest/globals";
import {
  RequestPasswordReset,
  RESET_TOKEN_TTL_MINUTES,
} from "@/features/auth/application/use-cases/RequestPasswordReset.js";
import { UserRepository } from "@/features/auth/domain/repositories/UserRepository.js";
import { PasswordResetTokenRepository } from "@/features/auth/domain/repositories/PasswordResetTokenRepository.js";
import { EmailSender } from "@/features/auth/application/ports/EmailSender.js";
import { AuthUser } from "@/features/auth/domain/entities/AuthUser.js";
import { PasswordResetToken } from "@/features/auth/domain/entities/PasswordResetToken.js";
import { buildPasswordResetEmail } from "@/features/auth/infrastructure/email/templates/password-reset.js";

const FROZEN_NOW = new Date("2026-04-24T10:00:00.000Z");

const makeUser = () =>
  AuthUser.fromPersistence({
    id: "user-1",
    email: "user@example.com",
    username: "tester",
    passwordHash: "hash",
    isPublicProfile: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

const build = () => {
  const userRepo: jest.Mocked<UserRepository> = {
    existsByEmail: jest.fn(),
    existsByUsername: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const tokenRepo: jest.Mocked<PasswordResetTokenRepository> = {
    findByTokenHash: jest.fn(),
    create: jest.fn(),
    markUsed: jest.fn(),
    invalidateAllForUser: jest.fn(),
  };
  const emailSender: jest.Mocked<EmailSender> = {
    send: jest.fn(),
  };
  const sut = new RequestPasswordReset(userRepo, tokenRepo, emailSender, {
    frontendResetUrl: "https://app.example.com/reset-password",
    buildEmail: buildPasswordResetEmail,
    now: () => FROZEN_NOW,
  });
  return { sut, userRepo, tokenRepo, emailSender };
};

describe("RequestPasswordReset use case", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("invalidates prior tokens, persists hashed token, and sends email when user exists", async () => {
    const { sut, userRepo, tokenRepo, emailSender } = build();
    const user = makeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    tokenRepo.create.mockImplementation(async (data) =>
      PasswordResetToken.fromPersistence({
        id: "token-1",
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        usedAt: null,
        createdAt: FROZEN_NOW,
      }),
    );

    await sut.execute({ email: "User@Example.COM " });

    expect(userRepo.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(tokenRepo.invalidateAllForUser).toHaveBeenCalledWith(
      user.id,
      FROZEN_NOW,
    );
    expect(tokenRepo.create).toHaveBeenCalledTimes(1);

    const created = tokenRepo.create.mock.calls[0][0];
    expect(created.userId).toBe(user.id);
    expect(created.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(created.expiresAt.getTime()).toBe(
      FROZEN_NOW.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    );

    expect(emailSender.send).toHaveBeenCalledTimes(1);
    const sent = emailSender.send.mock.calls[0][0];
    expect(sent.to).toBe(user.email);
    expect(sent.subject).toMatch(/reset/i);
    expect(sent.text).toContain(
      "https://app.example.com/reset-password?token=",
    );
    // The raw token must NOT equal the persisted hash
    const linkToken = decodeURIComponent(
      sent.text.split("?token=")[1].split(/\s/)[0],
    );
    expect(linkToken.length).toBeGreaterThan(0);
    expect(linkToken).not.toBe(created.tokenHash);
  });

  it("returns silently when user is unknown (anti-enumeration)", async () => {
    const { sut, userRepo, tokenRepo, emailSender } = build();
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      sut.execute({ email: "missing@example.com" }),
    ).resolves.toBeUndefined();

    expect(tokenRepo.invalidateAllForUser).not.toHaveBeenCalled();
    expect(tokenRepo.create).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("does not throw when emailSender.send fails (logs and resolves)", async () => {
    const { sut, userRepo, tokenRepo, emailSender } = build();
    userRepo.findByEmail.mockResolvedValue(makeUser());
    tokenRepo.create.mockImplementation(async (data) =>
      PasswordResetToken.fromPersistence({
        id: "token-1",
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        usedAt: null,
        createdAt: FROZEN_NOW,
      }),
    );
    emailSender.send.mockRejectedValue(new Error("smtp down"));

    await expect(
      sut.execute({ email: "user@example.com" }),
    ).resolves.toBeUndefined();
  });
});
