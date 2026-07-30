export type OrganizationProps = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export class Organization {
  private constructor(private props: OrganizationProps) {}

  static fromPersistence(props: OrganizationProps) {
    return new Organization(props);
  }

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get slug() {
    return this.props.slug;
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

  changeName(next: string) {
    const trimmed = next.trim();
    if (!trimmed) throw new Error("Organization name cannot be empty");
    if (trimmed.length > 100)
      throw new Error("Organization name must be 100 characters or less");
    this.props.name = trimmed;
    this.touch();
  }

  changeSlug(next: string) {
    const trimmed = next.trim().toLowerCase();
    if (!trimmed) throw new Error("Organization slug cannot be empty");
    if (trimmed.length > 100)
      throw new Error("Organization slug must be 100 characters or less");
    this.props.slug = trimmed;
    this.touch();
  }

  softDelete() {
    this.props.deletedAt = new Date();
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }
}
