export type InviteRole = "admin" | "member";

export type OrganizationInviteProps = {
  id: string;
  organizationId: string;
  email: string;
  role: InviteRole;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
};

export class OrganizationInvite {
  private constructor(private props: OrganizationInviteProps) {}

  static fromPersistence(props: OrganizationInviteProps) {
    return new OrganizationInvite(props);
  }

  get id() {
    return this.props.id;
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get email() {
    return this.props.email;
  }
  get role() {
    return this.props.role;
  }
  get tokenHash() {
    return this.props.tokenHash;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }
  get acceptedAt() {
    return this.props.acceptedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  isAccepted(): boolean {
    return this.props.acceptedAt !== null;
  }

  markAccepted(now: Date = new Date()) {
    this.props.acceptedAt = now;
  }
}
