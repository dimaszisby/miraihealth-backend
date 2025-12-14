export class MetricCategoryIcon {
  private constructor(private readonly value: string) {}

  static create(raw?: string) {
    const icon = raw?.trim() || "📁";
    return new MetricCategoryIcon(icon.slice(0, 2)); // basic guard to avoid long strings
  }

  toString() {
    return this.value;
  }
}
