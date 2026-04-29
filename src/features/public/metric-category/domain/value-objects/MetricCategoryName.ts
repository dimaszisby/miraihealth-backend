const MAX_LENGTH = 64;

export class MetricCategoryName {
  private constructor(private readonly value: string) {}

  static create(raw: string) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new Error("Category name is required");
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new Error("Category name is too long");
    }
    return new MetricCategoryName(trimmed);
  }

  toString() {
    return this.value;
  }
}
