export type AuthUserProps = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: "user" | "admin";
  isPublicProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export class AuthUser {
  private constructor(private props: AuthUserProps) {}

  static fromPersistence(props: AuthUserProps) {
    return new AuthUser(props);
  }

  get id() {
    return this.props.id;
  }
  get email() {
    return this.props.email;
  }
  get username() {
    return this.props.username;
  }
  get passwordHash() {
    return this.props.passwordHash;
  }
  get isPublicProfile() {
    return this.props.isPublicProfile;
  }
  get role() {
    return this.props.role;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }

  changeEmail(next: string) {
    const trimmed = next.trim().toLowerCase();
    if (!trimmed) throw new Error("Email cannot be empty");
    this.props.email = trimmed;
    this.touch();
  }

  changeUsername(next: string) {
    const trimmed = next.trim();
    if (!trimmed) throw new Error("Username cannot be empty");
    this.props.username = trimmed;
    this.touch();
  }

  togglePublicProfile(value: boolean) {
    this.props.isPublicProfile = value;
    this.touch();
  }

  setPasswordHash(hash: string) {
    this.props.passwordHash = hash;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }
}
