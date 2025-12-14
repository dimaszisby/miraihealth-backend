import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";
import { ListQuery, ListResult } from "../../domain/types";
import { CachePort } from "../ports/CachePort";
import { MetricCategory } from "../../domain/entities/MetricCategory";
import { buildCursorCacheKey } from "@/shared/cache/keys";
import {
  METRIC_CATEGORY_CURSOR_FEATURE,
  METRIC_CATEGORY_CURSOR_VERSION,
} from "@/features/metric-category/application/cache.constants";

export class ListCategories {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort
  ) {}

  async execute(q: ListQuery): Promise<ListResult<MetricCategory>> {
    const key = buildCursorCacheKey({
      feature: METRIC_CATEGORY_CURSOR_FEATURE,
      version: METRIC_CATEGORY_CURSOR_VERSION,
      userId: q.userId,
      segments: [
        ["l", q.limit],
        ["s", q.sort],
        ["q", q.q ?? ""],
        ["fn", q.filter?.name ?? ""],
        ["after", q.after ?? ""],
        ["it", q.includeTotal ?? false],
      ],
    });
    if (this.cache.isEnabled()) {
      const cached = await this.cache.get<ListResult<MetricCategory>>(key);
      if (cached) return cached;
    }
    const page = await this.repo.list(q);
    if (this.cache.isEnabled()) await this.cache.set(key, page, 300);
    return page;
  }
}
