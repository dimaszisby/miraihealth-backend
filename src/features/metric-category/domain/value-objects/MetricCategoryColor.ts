const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class MetricCategoryColor {
  private constructor(private readonly value: string) {}

  static create(raw?: string) {
    const color = raw?.trim() || "#E897A3.js";
    if (!HEX_REGEX.test(color)) {
      throw new Error("Color must be a valid hex code");
    }
    return new MetricCategoryColor(color);
  }

  toString() {
    return this.value;
  }
}
