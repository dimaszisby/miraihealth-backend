import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";
import { ListQuery, ListResult } from "../../domain/types";
import { CachePort } from "../ports/CachePort";
import { MetricCategory } from "../../domain/entities/MetricCategory";

export class ListCategories {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort
  ) {}

  async execute(q: ListQuery): Promise<ListResult<MetricCategory>> {
    const key = `categories:${q.userId}:l:${q.limit}:s:${q.sort}:q:${q.q ?? ""}:fn:${q.filter?.name ?? ""}:after:${q.after ?? ""}:it:${q.includeTotal ?? false}`;
    if (this.cache.isEnabled()) {
      const cached = await this.cache.get<ListResult<MetricCategory>>(key);
      if (cached) return cached;
    }
    const page = await this.repo.list(q);
    if (this.cache.isEnabled()) await this.cache.set(key, page, 300);
    return page;
  }
}
