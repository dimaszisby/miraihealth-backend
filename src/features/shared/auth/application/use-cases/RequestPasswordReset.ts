import crypto from "node:crypto";
import logger from "@/utils/logger.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { PasswordResetTokenRepository } from "../../domain/repositories/PasswordResetTokenRepository.js";
import { EmailSender } from "../ports/EmailSender.js";
import { buildPasswordResetEmail } from "../../infrastructure/email/templates/password-reset.js";

export const RESET_TOKEN_TTL_MINUTES = 15;

export type RequestPasswordResetInput = {
  email: string;
};

export type RequestPasswordResetDeps = {
  frontendResetUrl: string;
  ttlMinutes?: number;
  now?: () => Date;
};

export class RequestPasswordReset {
  constructor(
    private userRepo: UserRepository,
    private tokenRepo: PasswordResetTokenRepository,
    private emailSender: EmailSender,
    private deps: RequestPasswordResetDeps,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;

    const now = this.deps.now ? this.deps.now() : new Date();
    const ttlMinutes = this.deps.ttlMinutes ?? RESET_TOKEN_TTL_MINUTES;

    await this.tokenRepo.invalidateAllForUser(user.id, now);

    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    await this.tokenRepo.create({ userId: user.id, tokenHash, expiresAt });

    const link = this.buildResetLink(rawToken);
    const message = buildPasswordResetEmail(link, ttlMinutes);

    try {
      await this.emailSender.send({
        to: user.email,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private buildResetLink(rawToken: string): string {
    const base = this.deps.frontendResetUrl;
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(rawToken)}`;
  }
}
