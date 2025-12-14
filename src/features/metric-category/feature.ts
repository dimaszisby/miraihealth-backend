import { MetricCategoryRepoSequelize } from "./infrastructure/persistence/repositories/MetricCategoryRepoSequelize";
import { MetricCategoryCacheRedis } from "./infrastructure/cache/MetricCategoryCacheRedis";
import { CreateCategory } from "./application/use-cases/CreateCategory";
import { UpdateCategory } from "./application/use-cases/UpdateCategory";
import { DeleteCategory } from "./application/use-cases/DeleteCategory";
import { GenerateDummyCategories } from "./application/use-cases/GenerateDummyCategories";
import { ListCategories } from "./application/queries/ListCategories";
import { GetCategory } from "./application/queries/GetCategory";
import { MetricCategoryFactory } from "./domain/services/MetricCategoryFactory";

export const buildMetricCategoryFeature = () => {
  const repo = new MetricCategoryRepoSequelize();
  const cache = new MetricCategoryCacheRedis();
  const factory = new MetricCategoryFactory();

  return {
    createCategory: new CreateCategory(repo, cache),
    listCategories: new ListCategories(repo, cache),
    getCategory: new GetCategory(repo),
    updateCategory: new UpdateCategory(repo, cache),
    deleteCategory: new DeleteCategory(repo, cache),
    generateDummyCategories: new GenerateDummyCategories(repo, cache, factory),
  };
};
