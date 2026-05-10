import crypto from "node:crypto";
import logger from "@/utils/logger.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { EmailVerificationTokenRepository } from "../../domain/repositories/EmailVerificationTokenRepository.js";
import { EmailSender } from "../ports/EmailSender.js";

export const VERIFICATION_TOKEN_TTL_SEC = 86400;

export type RequestEmailVerificationInput = {
  userId: string;
  email: string;
};

export type RequestEmailVerificationDeps = {
  frontendVerifyUrl: string;
  buildEmail: (
    link: string,
    ttlHours: number,
  ) => {
    subject: string;
    text: string;
    html: string;
  };
  ttlSec?: number;
  now?: () => Date;
};

export class RequestEmailVerification {
  constructor(
    private userRepo: UserRepository,
    private tokenRepo: EmailVerificationTokenRepository,
    private emailSender: EmailSender,
    private deps: RequestEmailVerificationDeps,
  ) {}

  async execute(input: RequestEmailVerificationInput): Promise<void> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) return;

    if (user.emailVerifiedAt !== null) return;

    const now = this.deps.now ? this.deps.now() : new Date();
    const ttlSec = this.deps.ttlSec ?? VERIFICATION_TOKEN_TTL_SEC;

    await this.tokenRepo.revokeAllForUser(user.id, now);

    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(now.getTime() + ttlSec * 1000);

    await this.tokenRepo.save({ userId: user.id, tokenHash, expiresAt });

    const link = this.buildVerifyLink(rawToken);
    const ttlHours = Math.round(ttlSec / 3600);
    const message = this.deps.buildEmail(link, ttlHours);

    try {
      await this.emailSender.send({
        to: user.email,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (error) {
      logger.error("Failed to send verification email", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private buildVerifyLink(rawToken: string): string {
    const base = this.deps.frontendVerifyUrl;
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(rawToken)}`;
  }
}
