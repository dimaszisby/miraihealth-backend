import { MetricCategory } from "../entities/MetricCategory.js";
import { MetricCategoryName } from "../value-objects/MetricCategoryName.js";
import { MetricCategoryColor } from "../value-objects/MetricCategoryColor.js";
import { MetricCategoryIcon } from "../value-objects/MetricCategoryIcon.js";

export interface MetricCategorySeed {
  userId: string;
  name?: string;
  color?: string;
  icon?: string;
}

const FALLBACK_NAMES = [
  "Health",
  "Mindfulness",
  "Productivity",
  "Nutrition",
  "Fitness",
  "Sleep",
  "Relationships",
];
const FALLBACK_COLORS = ["#FF6347", "#FFD700", "#ADFF2F", "#6495ED", "#DA70D6"];
const FALLBACK_ICONS = ["📚", "💡", "💪", "🌱", "🌟", "🧠", "💤"];

export class MetricCategoryFactory {
  generate(seed: MetricCategorySeed) {
    const name =
      seed.name ??
      `${FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)]} ${Math.floor(Math.random() * 1000)}`;
    const color =
      seed.color ??
      FALLBACK_COLORS[Math.floor(Math.random() * FALLBACK_COLORS.length)];
    const icon =
      seed.icon ??
      FALLBACK_ICONS[Math.floor(Math.random() * FALLBACK_ICONS.length)];

    return MetricCategory.create(seed.userId, {
      name: MetricCategoryName.create(name).toString(),
      color: MetricCategoryColor.create(color).toString(),
      icon: MetricCategoryIcon.create(icon).toString(),
    });
  }
}
