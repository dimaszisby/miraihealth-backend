import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";
import { CachePort } from "../ports/CachePort";
import { MetricCategory } from "../../domain/entities/MetricCategory";
import { MetricCategoryFactory } from "../../domain/services/MetricCategoryFactory";

type Input = {
  userId: string;
  count: number;
};

export class GenerateDummyCategories {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort,
    private factory: MetricCategoryFactory
  ) {}

  async execute({ userId, count }: Input): Promise<MetricCategory[]> {
    const created: MetricCategory[] = [];

    for (let i = 0; i < count; i++) {
      const aggregate = this.factory.generate({ userId });
      const category = await this.repo.create(userId, {
        name: aggregate.name,
        color: aggregate.color,
        icon: aggregate.icon,
      });
      created.push(category);
    }

    if (this.cache.isEnabled()) {
      await this.cache.delByPattern(`categories:${userId}:*`);
    }

    return created;
  }
}
