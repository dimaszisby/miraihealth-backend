export type EmailVerificationTokenProps = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export class EmailVerificationToken {
  private constructor(private props: EmailVerificationTokenProps) {}

  static fromPersistence(props: EmailVerificationTokenProps) {
    return new EmailVerificationToken(props);
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get tokenHash() {
    return this.props.tokenHash;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }
  get usedAt() {
    return this.props.usedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  isUsable(now: Date = new Date()): boolean {
    return !this.isUsed() && !this.isExpired(now);
  }

  markUsed(now: Date = new Date()) {
    this.props.usedAt = now;
  }
}
