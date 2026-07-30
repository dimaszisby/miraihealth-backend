import { MetricCategory } from "../entities/MetricCategory.js";
import { ListQuery, ListResult } from "../types.js";

export interface MetricCategoryRepository {
  findById(
    userId: string,
    organizationId: string,
    id: string,
  ): Promise<MetricCategory | null>;

  existsByName(
    userId: string,
    organizationId: string,
    name: string,
  ): Promise<boolean>;

  list(query: ListQuery): Promise<ListResult<MetricCategory>>;

  create(
    userId: string,
    organizationId: string,
    data: { name: string; color?: string; icon?: string },
  ): Promise<MetricCategory>;

  update(
    userId: string,
    organizationId: string,
    id: string,
    patch: Partial<{ name: string; color: string; icon: string }>,
  ): Promise<MetricCategory>;

  delete(userId: string, organizationId: string, id: string): Promise<void>;
}
