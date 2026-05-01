import { MetricCategory } from "../entities/MetricCategory.js";
import { ListQuery, ListResult } from "../types.js";

export interface MetricCategoryRepository {
  // GET specific by Id
  findById(userId: string, id: string): Promise<MetricCategory | null>;

  // GET specific by Name
  existsByName(userId: string, name: string): Promise<boolean>;

  // GET lIST
  list(query: ListQuery): Promise<ListResult<MetricCategory>>;

  // CREATE
  create(
    userId: string,
    data: { name: string; color?: string; icon?: string },
  ): Promise<MetricCategory>;

  // UPDATE
  update(
    userId: string,
    id: string,
    patch: Partial<{ name: string; color: string; icon: string }>,
  ): Promise<MetricCategory>;

  // DELETE
  delete(userId: string, id: string): Promise<void>;
}
