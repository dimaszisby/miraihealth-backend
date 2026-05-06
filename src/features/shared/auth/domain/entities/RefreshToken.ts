import crypto from "node:crypto";

export type RefreshTokenProps = {
  id: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  userAgent: string | null;
  ip: string | null;
};

export class RefreshToken {
  private constructor(private props: RefreshTokenProps) {}

  static fromPersistence(props: RefreshTokenProps) {
    return new RefreshToken(props);
  }

  static issue(
    userId: string,
    tokenHash: string,
    opts: {
      familyId?: string;
      ttlDays?: number;
      userAgent?: string | null;
      ip?: string | null;
    } = {},
  ) {
    const now = new Date();
    const ttlDays = opts.ttlDays ?? 30;
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

    return new RefreshToken({
      id: crypto.randomUUID(),
      userId,
      familyId: opts.familyId ?? crypto.randomUUID(),
      tokenHash,
      issuedAt: now,
      expiresAt,
      revokedAt: null,
      replacedById: null,
      userAgent: opts.userAgent ?? null,
      ip: opts.ip ?? null,
    });
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get familyId() {
    return this.props.familyId;
  }
  get tokenHash() {
    return this.props.tokenHash;
  }
  get issuedAt() {
    return this.props.issuedAt;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }
  get revokedAt() {
    return this.props.revokedAt;
  }
  get replacedById() {
    return this.props.replacedById;
  }
  get userAgent() {
    return this.props.userAgent;
  }
  get ip() {
    return this.props.ip;
  }

  isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  markRevoked(now: Date = new Date()) {
    this.props.revokedAt = now;
  }

  replaceWith(newId: string) {
    if (this.props.replacedById !== null) {
      throw new Error("RefreshToken already replaced");
    }
    this.props.replacedById = newId;
  }
}
