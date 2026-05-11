export type MembershipRole = "owner" | "admin" | "member";
export type MembershipStatus = "active" | "invited" | "removed";

export type MembershipProps = {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: Date;
};

export class Membership {
  private constructor(private props: MembershipProps) {}

  static fromPersistence(props: MembershipProps) {
    return new Membership(props);
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get role() {
    return this.props.role;
  }
  get status() {
    return this.props.status;
  }
  get joinedAt() {
    return this.props.joinedAt;
  }

  changeRole(role: MembershipRole) {
    this.props.role = role;
  }

  isActive(): boolean {
    return this.props.status === "active";
  }

  isOwner(): boolean {
    return this.props.role === "owner";
  }

  isAdmin(): boolean {
    return this.props.role === "admin" || this.props.role === "owner";
  }
}
