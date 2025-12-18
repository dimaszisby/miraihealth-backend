```text
src/features/metric-category
├── application
│   ├── ports
│   │   └── CachePort.ts
│   ├── queries
│   │   ├── GetCategory.ts
│   │   └── ListCategories.ts
│   └── use-cases
│       ├── CreateCategory.ts
│       ├── DeleteCategory.ts
│       ├── GenerateDummyCategories.ts
│       └── UpdateCategory.ts
├── domain
│   ├── entities
│   │   └── MetricCategory.ts
│   ├── events
│   ├── repositories
│   │   └── MetricCategoryRepository.ts
│   ├── services
│   │   └── MetricCategoryFactory.ts
│   ├── value-objects
│   │   ├── MetricCategoryColor.ts
│   │   ├── MetricCategoryIcon.ts
│   │   └── MetricCategoryName.ts
│   └── types.ts
├── infrastructure
│   ├── cache
│   │   ├── MetricCategoryCacheRedis.ts
│   │   ├── RedisCacheAdapter.ts
│   │   └── cache.ts
│   ├── http
│   │   ├── controller.ts
│   │   ├── dto.ts
│   │   ├── router.ts
│   │   └── schema.zod.ts
│   ├── mappers
│   │   └── MetricCategoryMapper.ts
│   └── persistence
│       ├── models
│       │   ├── metric-category.attribute.ts
│       │   └── metric-category.sequelize.ts
│       └── repositories
│           └── MetricCategoryRepoSequelize.ts
├── feature.ts
└── index.ts
```

```ts
// file:src/features/metric-category/application/ports/CachePort.ts
export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSec: number): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
  isEnabled(): boolean;
}
```

```ts
// file:src/features/metric-category/application/use-cases/CreateCategory.ts
import AppError from "@/utils/AppError";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";
import { CachePort } from "../ports/CachePort";

type Input = { userId: string; name: string; color?: string; icon?: string };

export class CreateCategory {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort
  ) {}

  async execute({ userId, name, color, icon }: Input) {
    if (await this.repo.existsByName(userId, name)) {
      throw new AppError("Category already exists", 400);
    }
    const category = await this.repo.create(userId, { name, color, icon });
    if (this.cache.isEnabled()) {
      await this.cache.delByPattern(`categories:${userId}:*`); // invalidate lists
    }
    return category;
  }
}
```

```ts
// file:src/features/metric-category/application/use-cases/DeleteCategory.ts
import AppError from "@/utils/AppError";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";
import { CachePort } from "../ports/CachePort";

export class DeleteCategory {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort
  ) {}

  async execute(userId: string, categoryId: string) {
    const category = await this.repo.findById(userId, categoryId);
    if (!category) {
      throw new AppError("Metric Category not found", 404);
    }

    await this.repo.delete(userId, categoryId);

    if (this.cache.isEnabled()) {
      await this.cache.delByPattern(`categories:${userId}:*`);
      await this.cache.delByPattern(`category:${userId}:${categoryId}`);
    }
  }
}
```

```ts
// file:src/features/metric-category/application/queries/GetCategory.ts
import AppError from "@/utils/AppError";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";

export class GetCategory {
  constructor(private repo: MetricCategoryRepository) {}

  async execute(userId: string, categoryId: string) {
    const category = await this.repo.findById(userId, categoryId);
    if (!category) {
      throw new AppError("Metric Category not found", 404);
    }
    return category;
  }
}
```

```ts
// file:src/features/metric-category/application/queries/ListCategories.ts
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
```

```ts
// file:src/features/metric-category/application/use-cases/UpdateCategory.ts
import AppError from "@/utils/AppError";
import { MetricCategoryRepository } from "../../domain/repositories/MetricCategoryRepository";
import { CachePort } from "../ports/CachePort";

type Input = {
  userId: string;
  categoryId: string;
  name?: string;
  color?: string;
  icon?: string;
};

export class UpdateCategory {
  constructor(
    private repo: MetricCategoryRepository,
    private cache: CachePort
  ) {}

  async execute({ userId, categoryId, name, color, icon }: Input) {
    const current = await this.repo.findById(userId, categoryId);
    if (!current) {
      throw new AppError("Metric Category not found", 404);
    }

    if (name && name !== current.name) {
      const exists = await this.repo.existsByName(userId, name);
      if (exists) {
        throw new AppError("Metric Category name already exists", 400);
      }
    }

    const updated = await this.repo.update(userId, categoryId, {
      name,
      color,
      icon,
    });

    if (this.cache.isEnabled()) {
      await this.cache.delByPattern(`categories:${userId}:*`);
      await this.cache.delByPattern(`category:${userId}:${categoryId}`);
    }

    return updated;
  }
}
```

```ts
// file:src/features/metric-category/domain/entities/MetricCategory.ts
export type MetricCategoryProps = {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metricCount: number; // read-model convenience field
};

import crypto from "node:crypto";
import { MetricCategoryName } from "../value-objects/MetricCategoryName";
import { MetricCategoryColor } from "../value-objects/MetricCategoryColor";
import { MetricCategoryIcon } from "../value-objects/MetricCategoryIcon";

export class MetricCategory {
  private constructor(private props: MetricCategoryProps) {}

  static fromProps(p: MetricCategoryProps) {
    return new MetricCategory(p);
  }

  static create(userId: string, params: { name: string; color?: string; icon?: string }) {
    return new MetricCategory({
      id: crypto.randomUUID(),
      userId,
      name: MetricCategoryName.create(params.name).toString(),
      color: MetricCategoryColor.create(params.color).toString(),
      icon: MetricCategoryIcon.create(params.icon).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metricCount: 0,
    });
  }

  rename(next: string) {
    this.props.name = MetricCategoryName.create(next).toString();
    this.touch();
  }

  recolor(hex: string) {
    this.props.color = MetricCategoryColor.create(hex).toString();
    this.touch();
  }

  reicon(icon: string) {
    this.props.icon = MetricCategoryIcon.create(icon).toString();
    this.touch();
  }

  softDelete() {
    this.props.deletedAt = new Date();
  }

  // getters only expose readonly view
  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get name() {
    return this.props.name;
  }
  get color() {
    return this.props.color;
  }
  get icon() {
    return this.props.icon;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get deletedAt() {
    return this.props.deletedAt ?? null;
  }
  get metricCount() {
    return this.props.metricCount;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }
}
```

```ts
// file:src/features/metric-category/domain/repositories/MetricCategoryRepository.ts
import { MetricCategory } from "../entities/MetricCategory";
import { ListQuery, ListResult } from "../types";

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
    data: { name: string; color?: string; icon?: string }
  ): Promise<MetricCategory>;

  // UPDATE
  update(
    userId: string,
    id: string,
    patch: Partial<{ name: string; color: string; icon: string }>
  ): Promise<MetricCategory>;

  // DELETE
  delete(userId: string, id: string): Promise<void>;
}
```

```ts
// file:src/features/metric-category/domain/services/MetricCategoryFactory.ts
import { MetricCategory } from "../entities/MetricCategory";
import { MetricCategoryName } from "../value-objects/MetricCategoryName";
import { MetricCategoryColor } from "../value-objects/MetricCategoryColor";
import { MetricCategoryIcon } from "../value-objects/MetricCategoryIcon";

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
```

```ts
// file:src/features/metric-category/domain/types.ts
export type SortField = "createdAt" | "updatedAt" | "name" | "metricCount";
export type SortParam = SortField | `-${SortField}`;

export type ListFilter = { name?: string };
export type ListQuery = {
  userId: string;
  limit: number;
  sort: SortParam;
  q?: string;
  filter?: ListFilter;
  after?: string; // opaque cursor
  includeTotal?: boolean; // careful: can be costly
};
export type ListResult<T> = {
  items: T[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: ListFilter;
  totalCount?: number;
};
```

```ts
// file:src/features/metric-category/domain/value-objects/MetricCategoryColor.ts
const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class MetricCategoryColor {
  private constructor(private readonly value: string) {}

  static create(raw?: string) {
    const color = raw?.trim() || "#E897A3";
    if (!HEX_REGEX.test(color)) {
      throw new Error("Color must be a valid hex code");
    }
    return new MetricCategoryColor(color);
  }

  toString() {
    return this.value;
  }
}
```

```ts
// file:src/features/metric-category/domain/value-objects/MetricCategoryIcon.ts
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
```

```ts
// file:src/features/metric-category/domain/value-objects/MetricCategoryName.ts
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
```

```ts
// file:src/features/metric-category/feature.ts
import { MetricCategoryRepoSequelize } from "./infrastructure/persistence/repositories/MetricCategoryRepoSequelize";
import { MetricCategoryCacheRedis } from "./infrastructure/cache/MetricCategoryCacheRedis";
import { CreateCategory } from "./application/use-cases/CreateCategory";
import { ListCategories } from "./application/queries/ListCategories";
import { GetCategory } from "./application/queries/GetCategory";
import { UpdateCategory } from "./application/use-cases/UpdateCategory";
import { DeleteCategory } from "./application/use-cases/DeleteCategory";

export const buildMetricCategoryFeature = () => {
  const repo = new MetricCategoryRepoSequelize();
  const cache = new MetricCategoryCacheRedis();

  return {
    createCategory: new CreateCategory(repo, cache),
    listCategories: new ListCategories(repo, cache),
    getCategory: new GetCategory(repo),
    updateCategory: new UpdateCategory(repo, cache),
    deleteCategory: new DeleteCategory(repo, cache),
  };
};
```

```ts
// file:src/features/metric-category/index.ts
export {
  metricCategoryRouter,
  createMetricCategoryRouter,
} from "./infrastructure/http/router";
export { buildMetricCategoryFeature } from "./feature";
```

```ts
// file:src/features/metric-category/infrastructure/cache/MetricCategoryCacheRedis.ts
import { CachePort } from "../../application/ports/CachePort";
import {
  redisClient,
  invalidateCacheByPattern,
} from "@/utils/redis-client";
import logger from "@/utils/logger";

export class MetricCategoryCacheRedis implements CachePort {
  constructor(private defaultTtlSeconds = 300) {}

  isEnabled(): boolean {
    return redisClient.isOpen;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null;
    const value = await redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    if (!this.isEnabled()) return;
    await redisClient.setEx(
      key,
      ttlSec ?? this.defaultTtlSeconds,
      JSON.stringify(value)
    );
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isEnabled()) return;
    await invalidateCacheByPattern(pattern);
    logger.info(`[CACHE] invalidated categories pattern=${pattern}`);
  }
}
```

```ts
// file:src/features/metric-category/infrastructure/cache/RedisCacheAdapter.ts
import { redisClient, invalidateCacheByPattern } from "@/utils/redis-client";
import { CachePort } from "../../application/ports/CachePort";

export class RedisCacheAdapter implements CachePort {
  isEnabled() {
    return redisClient.isOpen;
  }
  async get<T>(key: string) {
    if (!this.isEnabled()) return null;
    const raw = await redisClient.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  async set<T>(key: string, value: T, ttlSec: number) {
    if (!this.isEnabled()) return;
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSec });
  }
  async delByPattern(pattern: string) {
    if (!this.isEnabled()) return;
    await invalidateCacheByPattern(pattern);
  }
}
```

```ts
// file:src/features/metric-category/infrastructure/cache/cache.ts
import logger from "@/utils/logger";
import { invalidateCacheByPattern } from "@/utils/redis-client";

/**
 * Invalidates all cache keys related to a user's category
 * including paginated, filtered, and sort
 * @param userId - The user ID.
 * @param metricId - The category ID.
 */
export async function invalidateAllMetricCategoryCache(
  userId: string,
  categoryId?: string
) {
  logger.info(
    `♻️ [CACHE] Invalidating category for user=${userId}, category=${categoryId ?? "-"}`
  );

  // Invalidate "all category" list (user dashboard or similar)
  await invalidateCacheByPattern(`categories:${userId}:*`);

  if (categoryId) {
    // Invalidate all metric list queries for this category
    await invalidateCacheByPattern(`category:${userId}:${categoryId}`);
  }

  logger.info(
    `♻️ [CACHE] Cache invalidated for user:${userId}, and categor:${categoryId ?? "-"}`
  );
}
```

```ts
// file:src/features/metric-category/infrastructure/http/controller.ts
import { Response } from "express";
import catchAsync from "@/utils/catch-async";
import { successResponse } from "@/utils/response-formatter";
import { AuthRequest } from "@/types/request.context";
import { assertAuthenticated } from "@/utils/auth-guards";
import {
  toResponseDTO,
  toListResponseDTO,
} from "@/features/metric-category/infrastructure/mappers/MetricCategoryMapper";
import {
  createMetricCategorySchema,
  listCategoriesQuery,
  updateMetricCategorySchema,
} from "./schema.zod";
import { buildMetricCategoryFeature } from "../../feature";
import { GenerateDummyMetricCategoriesRequestDTO } from "./dto";
import { MetricCategoryFactory } from "../../domain/services/MetricCategoryFactory";
import { models } from "@/infrastructure/db/models";
import { toDomain } from "../mappers/MetricCategoryMapper";
import { MetricCategoryCacheRedis } from "../cache/MetricCategoryCacheRedis";

type Feature = ReturnType<typeof buildMetricCategoryFeature>;
let feature: Feature = buildMetricCategoryFeature();

export const overrideMetricCategoryFeature = (custom: Feature) => {
  feature = custom;
};

export const createCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  assertAuthenticated(req);
  const payload = createMetricCategorySchema.body.parse(req.body);
  const category = await feature.createCategory.execute({
    userId: req.user.id,
    name: payload.name,
    color: payload.color,
    icon: payload.icon,
  });

  successResponse(
    res,
    201,
    toResponseDTO(category),
    "Category created successfully"
  );
});

export const listCategories = catchAsync(async (req: AuthRequest, res: Response) => {
  assertAuthenticated(req);
  const parsed = listCategoriesQuery.parse(req.query);
  const { limit, sort, q, after, includeTotal } = parsed;
  const filter =
    parsed["filter[name]"] && parsed["filter[name]"]!.trim().length > 0
      ? { name: parsed["filter[name]"]!.trim() }
      : undefined;

  const page = await feature.listCategories.execute({
    userId: req.user.id,
    limit,
    sort,
    q,
    filter,
    after,
    includeTotal,
  });

  const dto = {
    items: toListResponseDTO(page.items),
    nextCursor: page.nextCursor,
    sort: page.sort,
    limit: page.limit,
    ...(page.q ? { q: page.q } : {}),
    ...(page.filter ? { filter: page.filter } : {}),
    ...(includeTotal ? { totalCount: page.totalCount ?? 0 } : {}),
  };

  successResponse(res, 200, dto, "Categories list retrieved successfully");
});

export const getCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  assertAuthenticated(req);
  const category = await feature.getCategory.execute(req.user.id, req.params.id);
  successResponse(res, 200, toResponseDTO(category), "Category retrieved successfully");
});

export const updateCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  assertAuthenticated(req);
  const payload = updateMetricCategorySchema.body.parse(req.body);
  const category = await feature.updateCategory.execute({
    userId: req.user.id,
    categoryId: req.params.id,
    name: payload.name,
    color: payload.color,
    icon: payload.icon,
  });

  successResponse(
    res,
    200,
    toResponseDTO(category),
    "Category updated successfully"
  );
});

export const deleteCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  assertAuthenticated(req);
  await feature.deleteCategory.execute(req.user.id, req.params.id);
  successResponse(res, 200, null, "Category deleted successfully");
});

const factory = new MetricCategoryFactory();
const categoryCache = new MetricCategoryCacheRedis();

export const generateDummyCategories = catchAsync(async (req: AuthRequest, res: Response) => {
  assertAuthenticated(req);
  const payload = req.body as GenerateDummyMetricCategoriesRequestDTO;
  const created = [];
  for (let i = 0; i < payload.count; i++) {
    const aggregate = factory.generate({ userId: req.user.id });
    const saved = await models.MetricCategory.create({
      userId: aggregate.userId,
      name: aggregate.name,
      color: aggregate.color,
      icon: aggregate.icon,
    });
    created.push(saved);
  }

  if (categoryCache.isEnabled()) {
    await categoryCache.delByPattern(`categories:${req.user.id}:*`);
  }

  successResponse(
    res,
    201,
    toListResponseDTO(created.map((row: any) =>
      toDomain({
        id: row.id,
        userId: row.userId,
        name: row.name,
        color: row.color,
        icon: row.icon,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        metricCount: 0,
      })
    )),
    `${payload.count} dummy metric categories generated successfully`
  );
});

// /**
//  * * Update Category
//  * @route PUT /api/categories/:id
//  */
// export const updateCategory = catchAsync(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user?.id) throw new AppError("User not authenticated", 401);

//     const category: MetricCategoryDomain =
//       await updateMetricCategoryServiceLegacy(
//         req.user.id,
//         req.params.id,
//         req.body
//       );
      
//     successResponse(
//       res,
//       200,
//       { category: toResponseDTO(category) },
//       "Category updated successfully"
//     );
//   }
// );

// /**
//  * * Delete Category
//  * @route DELETE /api/categories/:id
//  */
// export const deleteCategory = catchAsync(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user?.id) throw new AppError("User not authenticated", 401);

//     const category: MetricCategoryDomain =
//       await deleteMetricCategoryServiceLegacy(req.user.id, req.params.id);
//     successResponse(
//       res,
//       200,
//       { category: toResponseDTO(category) },
//       "Category deleted successfully"
//     );
//   }
// );

// /**
//  * * ===== Controllers for Testing Purposes =====
//  */

// /**
//  * * Generate Dummy Metric Categories
//  * @route POST /api/categories/dummy
//  */
// export const generateDummyCategories = catchAsync(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user?.id) throw new AppError("User not authenticated", 401);

//     const userId = req.user.id;
//     const { count } = req.body as GenerateDummyMetricCategoriesRequestDTO;

//     const dummyCategories = await generateDummyCategoriesServiceLegacy(
//       userId,
//       count
//     );

//     successResponse(
//       res,
//       201,
//       { categories: toListResponseDTO(dummyCategories) },
//       `${count} dummy metric categories generated successfully`
//     );
//   }
// );

// // * ========== DDD impl ==========

// // infrastructure/http/controller.ts
// import { ListCategories } from "../../application/use-cases/ListCategories";
// import { CreateCategory } from "../../application/use-cases/CreateCategory";
// import { MetricCategoryRepoSequelize } from "../persistence/repositories/MetricCategoryRepoSequelize";
// import { RedisCacheAdapter } from "../cache/RedisCacheAdapter";
// import { toResponseDTOLegacy } from "../../legacies/MetricCategoryLegacy.mapper";

// // Construct use-cases via composition root (dependency injection)
// const listCategoriesUC = new ListCategories(
//   new MetricCategoryRepoSequelize(),
//   new RedisCacheAdapter()
// );
// const createCategoryUC = new CreateCategory(
//   new MetricCategoryRepoSequelize(),
//   new RedisCacheAdapter()
// );

// export const getAllCategories = async (
//   req: Request & { validated?: any },
//   res: Response
// ) => {
//   const userId = (req as any).user?.id;
//   if (!userId)
//     return res.status(401).json({ message: "User not authenticated" });

//   // prefer validated, fallback to parsing req.query directly
//   const q = req.validated?.query ?? listCategoriesQuery.parse(req.query);

//   const page = await listCategoriesUC.execute({ userId, ...q });

//   res.status(200).json({
//     items: toListResponseDTO(page.items),
//     nextCursor: page.nextCursor,
//     sort: page.sort,
//     limit: page.limit,
//     ...(page.q ? { q: page.q } : {}),
//     ...(page.filter ? { filter: page.filter } : {}),
//     ...(page.totalCount !== undefined ? { totalCount: page.totalCount } : {}),
//   });
// };

// export const createCategory = async (req: any, res: Response) => {
//   const userId = req.user!.id;
//   if (!req.user?.id) throw new AppError("User not authenticated", 401);

//   const body = req.validated.body;
//   const cat = await createCategoryUC.execute({ userId, ...body });
//   res.status(201).json({ category: toResponseDTO(cat) });
// };
```

```ts
// file:src/features/metric-category/infrastructure/http/dto.ts
import { z } from "zod";

// Internal validation schemas
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  generateDummyMetricCategoriesSchema,
} from "@/features/metric-category/infrastructure/http/schema.zod.js";

/**
 * @file src/types/dtos/metric-category.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for MetricCategory.
 * These interfaces and types are used for incoming and outgoing API contracts,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

/**
 * @interface MetricCategoryResponseDTO
 * @description Represents the structure of a MetricCategory object as returned in API responses.
 */
export interface MetricCategoryResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric category (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} name - The user-defined name for the metric category.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {string} color - The color code associated with the category for UI display.
   * @readonly
   */
  readonly color: string;

  /**
   * @property {string} icon - The icon identifier associated with the category.
   * @readonly
   */
  readonly icon: string;

  /**
   * @property {string} createdAt - The timestamp when the category was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;

  /**
   * @property {string} updatedAt - The timestamp when the category was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;

  /**
   * @property {string | null} [deletedAt] - The timestamp when the category was soft-deleted, formatted as an ISO string. Null if active.
   * @readonly
   */
  readonly deletedAt?: string | null;

  // Dev note: Type Added recently
  /**
   * @property {number} metricCount - The number of metrics associated with the category.
   * @readonly
   * @example 10
   */
  readonly metricCount: number;
}

/**
 * @typedef CreateMetricCategoryRequestDTO
 * @description Represents the expected structure of the request body when creating a new metric category.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricCategoryRequestDTO = z.infer<
  typeof createMetricCategorySchema.body
>;

/**
 * @typedef UpdateMetricCategoryRequestDTO
 * @description Represents the expected structure of the request body when updating an existing metric category.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricCategoryRequestDTO = z.infer<
  typeof updateMetricCategorySchema.body
>;

/**
 * * ===== DTOs for Testing Purposes =====
 */

/**
 * @typedef GenerateDummyMetricCategoriesRequestDTO
 * @description Represents the expected structure of the request body when generating dummy metric category entries.
 * Inferred from the Zod schema for validation.
 */
export type GenerateDummyMetricCategoriesRequestDTO = z.infer<
  typeof generateDummyMetricCategoriesSchema.body
>;
```

```ts
// file:src/features/metric-category/infrastructure/http/router.ts
import { Router } from "express";
import { env } from "@/config/zodEnv";
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  generateDummyCategories,
} from "./controller";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware";
import { cacheMiddleware } from "@/shared/middleware/cache";
import { userRateLimiter } from "@/shared/middleware/rate-limiter";
import { validate } from "@/shared/middleware/validation";
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  getMetricCategorySchema,
  getAllMetricCategoriesSchema,
  deleteMetricCategorySchema,
  generateDummyMetricCategoriesSchema,
} from "@/features/metric-category/infrastructure/http/schema.zod";
import { AuthRequest } from "@/types/request.context";

const categoriesCacheKey = (req: AuthRequest) => {
  const { limit = 20, sort = "-createdAt", q, after } = req.query as any;
  const fname = (req.query["filter[name]"] as string) ?? "";
  const includeTotal = String(req.query.includeTotal ?? "false");
  return [
    "categories",
    req.user?.id,
    `l:${limit}`,
    `s:${sort}`,
    `q:${q ?? ""}`,
    `fn:${fname}`,
    `after:${after ?? ""}`,
    `it:${includeTotal}`,
  ].join(":");
};

const categoryCacheKey = (req: AuthRequest) =>
  `category:${req.user?.id}:${req.params.id}`;

export const createMetricCategoryRouter = () => {
  const router = Router();
  router.use(authMiddleware);

  router.post(
    "/",
    userRateLimiter,
    validate(createMetricCategorySchema),
    createCategory
  );

  router.get(
    "/",
    validate(getAllMetricCategoriesSchema),
    cacheMiddleware(categoriesCacheKey, 300),
    listCategories
  );

  router.get(
    "/:id",
    validate(getMetricCategorySchema),
    cacheMiddleware(categoryCacheKey, 600),
    getCategory
  );

  router.put(
    "/:id",
    userRateLimiter,
    validate(updateMetricCategorySchema),
    updateCategory
  );

  router.delete(
    "/:id",
    userRateLimiter,
    validate(deleteMetricCategorySchema),
    deleteCategory
  );

  if (env.ENABLE_DUMMY_ENDPOINTS) {
    router.post(
      "/dummy",
      userRateLimiter,
      validate(generateDummyMetricCategoriesSchema),
      generateDummyCategories
    );
  }

  return router;
};

export const metricCategoryRouter = createMetricCategoryRouter();
```

```ts
// file:src/features/metric-category/infrastructure/http/schema.zod.ts
import { z } from "zod";
import { ZodMessages } from "@/constants/zod/zod-messages";
import {
  zMetricCategoryName,
  zMetricCategoryColor,
  zMetricCategoryIcon,
} from "@/constants/zod/zod-rules";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// * Base
export const metricCategoryBody = z.object({
  name: zMetricCategoryName,
  color: zMetricCategoryColor,
  icon: zMetricCategoryIcon,
});

export const metricCategoryParams = z.object({
  id: z.string().uuid({ message: ZodMessages.metricCategory.invalidId }),
});

export const listCategoriesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum([
      "createdAt",
      "-createdAt",
      "updatedAt",
      "-updatedAt",
      "name",
      "-name",
      "metricCount",
      "-metricCount",
    ] as const)
    .default("-createdAt"),
  q: z.string().trim().min(1).optional(),
  ["filter[name]"]: z.string().trim().min(1).optional(),
  after: z.string().optional(),
  includeTotal: z.coerce.boolean().default(false),
});

// * Schema Implementations
export const createMetricCategorySchema = { body: metricCategoryBody };
export const updateMetricCategorySchema = {
  params: metricCategoryParams,
  body: metricCategoryBody.partial(),
};
export const getMetricCategorySchema = { params: metricCategoryParams };
export const deleteMetricCategorySchema = { params: metricCategoryParams };
export const getAllMetricCategoriesSchema = { query: listCategoriesQuery };

/**
 * * ===== Schemas for Testing Purposes =====
 */

export const createMetricCategoryDummyBody = z.object({
  // id: z.string().uuid({ message: ZodMessages.metricCategory.invalidId }),
  count: z.number().int().min(1).max(1000).default(5), // Default to 5, max 1000
});

export const generateDummyMetricCategoriesSchema = {
  body: createMetricCategoryDummyBody,
};
```

```ts
// file:src/features/metric-category/infrastructure/mappers/MetricCategoryMapper.ts
import { MetricCategory as MetricCategorySequelize } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import { MetricCategory as MetricCategoryDomain } from "@/features/metric-category/domain/entities/MetricCategory";
import { MetricCategoryResponseDTO } from "@/features/metric-category/infrastructure/http/dto";

export type MetricCategoryRow = {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metricCount?: number; // from SELECT literal
};

/**
 * * Mapper: Sequelize → Domain
 */
export const toDomain = (row: MetricCategoryRow): MetricCategoryDomain =>
  MetricCategoryDomain.fromProps({
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
    metricCount: Number(row.metricCount ?? 0),
  });

/**
 * * Sequelize[] → Domain[] Mapper
 */
// Dev Note Update: ADDED
export const toListDomain = (
  rows: MetricCategoryRow[]
): MetricCategoryDomain[] => rows.map(toDomain);

/**
 * * Mapper: Domain → DTO (for responses)
 */
export const toResponseDTO = (
  metricCategory: MetricCategoryDomain
): MetricCategoryResponseDTO => ({
  id: metricCategory.id,
  name: metricCategory.name,
  color: metricCategory.color,
  icon: metricCategory.icon,
  createdAt: metricCategory.createdAt.toISOString(),
  updatedAt: metricCategory.updatedAt.toISOString(),
  metricCount: metricCategory.metricCount,
});

export const toListResponseDTO = (
  metricCategories: MetricCategoryDomain[]
): MetricCategoryResponseDTO[] => {
  return metricCategories.map(toResponseDTO);
};
```

```ts
// file:src/features/metric-category/infrastructure/persistence/models/metric-category.attribute.ts
/**
 * @interface MetricCategoryAttributesBase
 * @description Defines the core, non-database-specific attributes for a Metric Category entity.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, userId, timestamps, etc.
 */
export interface MetricCategoryAttributesBase {
  /**
   * @property {string} name - The user-defined name for the metric category.
   */
  name: string;

  /**
   * @property {string} color - A color code (e.g., hex) associated with the category for UI display.
   * Defaults to '#E897A3' if not provided.
   */
  color: string;

  /**
   * @property {string} icon - An icon identifier (e.g., emoji or icon font class) associated with the category.
   * Defaults to '📁' if not provided.
   */
  icon: string;

  /**
   * @property {Date | null} [deletedAt] - Timestamp indicating when the category was soft-deleted.
   * If null or undefined, the category is considered active. Used by Sequelize's paranoid mode.
   */
  deletedAt?: Date | null;
}
```

```ts
// file:src/features/metric-category/infrastructure/persistence/models/metric-category.sequelize.ts
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { MetricCategoryAttributesBase } from "@/features/metric-category/infrastructure/persistence/models/metric-category.attribute.js";
import type { DbModels } from "@/infrastructure/db/types";
import { User } from "@/features/auth/infrastructure/persistence/models/user.sequelize";
import { Metric } from "@/features/metric/infrastructure/persistence/models/metric.sequelize";

/**
 * * MetricCategory Model
 * Represents categories used to group health metrics.
 */

// Define attributes
export interface MetricCategoryAttributes extends MetricCategoryAttributesBase {
  // DB-specifics
  id: string;
  userId: string;

  // Timestamps managed by DB
  createdAt?: Date;
  updatedAt?: Date;

  // Optional associated objects
  // User?: User;
  // Metrics?: Metric[];
}

// Define optional fields for Sequelize
export interface MetricCategoryCreationAttributes
  extends Optional<MetricCategoryAttributes, "id"> {}

export class MetricCategory
  extends Model<MetricCategoryAttributes, MetricCategoryCreationAttributes>
  implements MetricCategoryAttributes
{
  declare id: string;
  declare userId: string;
  declare name: string;
  declare color: string;
  declare icon: string;
  declare deletedAt?: Date | null;

  // Timestamps managed by DB
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // Optional associated objects
  declare User?: User;
  declare Metrics?: Metric[];

  // * Init
  static initModel(sequelize: Sequelize) {
    MetricCategory.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        color: {
          type: DataTypes.STRING,
          defaultValue: "#E897A3",
        },
        icon: {
          type: DataTypes.STRING,
          defaultValue: "📁",
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "MetricCategory",
        tableName: "metric_categories",
        paranoid: true,
        underscored: true,
        schema: "public",
      }
    );

    return MetricCategory;
  }

  // * Associations
  public static associate(models: DbModels) {
    MetricCategory.belongsTo(models.User, {
      as: "user",
      foreignKey: { name: "userId", field: "user_id", allowNull: false },
      onDelete: "CASCADE",
    });
    MetricCategory.hasMany(models.Metric, {
      as: "metrics",
      foreignKey: { name: "categoryId", field: "category_id", allowNull: true },
      onDelete: "SET NULL",
    });
  }
}

export function initMetricCategory(sequelize: Sequelize) {
  return MetricCategory.initModel(sequelize);
}
export function associateMetricCategory(models: DbModels) {
  MetricCategory.associate(models);
}

export const registerMetricCategoryModels = (sequelize: Sequelize) => {
  initMetricCategory(sequelize);
  return { MetricCategory };
};

export const associateMetricCategoryModels = (models: DbModels) => {
  associateMetricCategory(models);
};
```

```ts
// file:src/features/metric-category/infrastructure/persistence/repositories/MetricCategoryRepoSequelize.ts
import {
  Op,
  OrderItem,
  Sequelize,
  WhereOptions,
  FindAttributeOptions,
  ProjectionAlias,
} from "sequelize";
import { models } from "@/infrastructure/db/models";
import { MetricCategoryRepository } from "../../../domain/repositories/MetricCategoryRepository";
import {
  ListQuery,
  ListResult,
  SortParam,
  SortField,
} from "../../../domain/types";
import { MetricCategory } from "../../../domain/entities/MetricCategory";
import {
  MetricCategoryRow,
  toDomain,
} from "../../mappers/MetricCategoryMapper";

const METRIC_COUNT_SQL = `(SELECT COUNT(*) FROM "metrics" m WHERE m."category_id" = "MetricCategory"."id" AND m."deleted_at" IS NULL)`;

const baseAttrs = (): FindAttributeOptions => {
  const metricCount: ProjectionAlias = [
    Sequelize.literal(METRIC_COUNT_SQL),
    "metricCount",
  ];
  return { include: [metricCount] };
};

export class MetricCategoryRepoSequelize implements MetricCategoryRepository {
  async findById(userId: string, id: string) {
    const row = (await models.MetricCategory.findOne({
      where: { id, userId, deletedAt: null },
      attributes: baseAttrs(), // includes metricCount
      raw: true,
      nest: true,
    })) as MetricCategoryRow | null;

    return row ? toDomain(row) : null;
  }

  async existsByName(userId: string, name: string) {
    const count = await models.MetricCategory.count({
      where: { userId, name },
    });
    return count > 0;
  }

  async create(
    userId: string,
    data: { name: string; color?: string; icon?: string }
  ) {
    const created = await models.MetricCategory.create({
      userId,
      name: data.name,
      color: data.color ?? "#E897A3",
      icon: data.icon ?? "📁",
    });

    // reload as raw row with metricCount
    const fresh = (await models.MetricCategory.findByPk(created.id, {
      attributes: baseAttrs(),
      raw: true,
      nest: true,
    })) as MetricCategoryRow;

    // metricCount isn't on a new row; default to 0
    return toDomain({ ...fresh, metricCount: 0 });
  }

  async update(
    userId: string,
    id: string,
    patch: Partial<{ name: string; color: string; icon: string }>
  ) {
    const row = await models.MetricCategory.findOne({
      where: { id, userId, deletedAt: null },
    });
    if (!row) throw new Error("Category not found");
    await row.update(patch);

    const fresh = (await models.MetricCategory.findByPk(id, {
      attributes: baseAttrs(),
      raw: true,
      nest: true,
    })) as MetricCategoryRow;

    return toDomain(fresh);
  }

  async delete(userId: string, id: string) {
    await models.MetricCategory.destroy({ where: { id, userId } }); // paranoid=true -> soft delete
  }

  async list(q: ListQuery): Promise<ListResult<MetricCategory>> {
    const { field, dir } = normalizeSort(q.sort);
    const where = buildWhere(q.userId, q.q, q.filter);
    const pageSize = Math.min(Math.max(q.limit || 20, 1), 100);

    const totalCount = q.includeTotal
      ? await models.MetricCategory.count({ where })
      : undefined;

    // cursor window
    let windowWhere: WhereOptions = where;
    if (q.after) {
      const c = decodeCursor(q.after);
      if (c && c.sort === q.sort)
        windowWhere = {
          [Op.and]: [where, buildCursorPredicate(c, field, dir)],
        };
    }

    const rows = (await models.MetricCategory.findAll({
      where: windowWhere,
      limit: pageSize + 1,
      order: buildOrder(field, dir),
      attributes: baseAttrs(),
      raw: true,
      nest: true,
    })) as MetricCategoryRow[];

    const hasMore = rows.length > pageSize;
    const items = (hasMore ? rows.slice(0, pageSize) : rows).map(toDomain);

    let nextCursor: string | undefined;
    if (hasMore && items.length) {
      const last = items[items.length - 1];
      const payload: CursorPayload = { sort: q.sort, id: last.id };
      if (field === "createdAt")
        payload.createdAt = last.createdAt.toISOString();
      else if (field === "updatedAt")
        payload.updatedAt = last.updatedAt.toISOString();
      else if (field === "name") payload.nameLower = last.name.toLowerCase();
      else payload.metricCount = last.metricCount;
      nextCursor = encodeCursor(payload);
    }

    return {
      items,
      nextCursor,
      sort: q.sort,
      limit: pageSize,
      ...(q.q && { q: q.q }),
      ...(q.filter && { filter: q.filter }),
      ...(q.includeTotal && { totalCount }),
    };
  }
}

/*** helpers copied from your current code and kept private here ***/
type Dir = "ASC" | "DESC";
type CursorPayload = {
  sort: SortParam;
  id: string;
  createdAt?: string;
  updatedAt?: string;
  nameLower?: string;
  metricCount?: number;
};
const encodeCursor = (c: CursorPayload) =>
  Buffer.from(JSON.stringify(c)).toString("base64url");
const decodeCursor = (s: string): CursorPayload | null => {
  try {
    return JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

function normalizeSort(sort: SortParam): { field: SortField; dir: Dir } {
  const dir: Dir = sort.startsWith("-") ? "DESC" : "ASC";
  const field = (sort.startsWith("-") ? sort.slice(1) : sort) as SortField;
  return ["createdAt", "updatedAt", "name", "metricCount"].includes(field)
    ? { field, dir }
    : { field: "createdAt", dir: "DESC" };
}
function buildWhere(
  userId: string,
  q?: string,
  filter?: { name?: string }
): WhereOptions {
  const like = (v: string) => ({ [Op.iLike]: `%${v}%` });
  const and: any[] = [{ userId }, { deletedAt: null }];
  if (q) and.push({ name: like(q) });
  if (filter?.name) and.push({ name: like(filter.name) });
  return { [Op.and]: and };
}
function buildCursorPredicate(
  c: CursorPayload,
  field: SortField,
  dir: Dir
): WhereOptions {
  const ltgt = dir === "DESC" ? Op.lt : Op.gt,
    eq = Op.eq;
  switch (field) {
    case "createdAt": {
      const C = new Date(c.createdAt!);
      return {
        [Op.or]: [
          { createdAt: { [ltgt]: C } },
          { [Op.and]: [{ createdAt: { [eq]: C } }, { id: { [ltgt]: c.id } }] },
        ],
      };
    }
    case "updatedAt": {
      const U = new Date(c.updatedAt!);
      return {
        [Op.or]: [
          { updatedAt: { [ltgt]: U } },
          { [Op.and]: [{ updatedAt: { [eq]: U } }, { id: { [ltgt]: c.id } }] },
        ],
      };
    }
    case "name": {
      const nameExpr = Sequelize.fn("LOWER", Sequelize.col("name"));
      const last = c.nameLower!;
      return {
        [Op.or]: [
          Sequelize.where(nameExpr, { [ltgt]: last }),
          {
            [Op.and]: [
              Sequelize.where(nameExpr, { [eq]: last }),
              { id: { [ltgt]: c.id } },
            ],
          },
        ],
      };
    }
    case "metricCount": {
      const last = c.metricCount!;
      const scalar = Sequelize.literal(METRIC_COUNT_SQL);
      return {
        [Op.or]: [
          Sequelize.where(scalar, { [ltgt]: last }),
          {
            [Op.and]: [
              Sequelize.where(scalar, { [eq]: last }),
              { id: { [ltgt]: c.id } },
            ],
          },
        ],
      };
    }
  }
}
function buildOrder(field: SortField, dir: Dir): OrderItem[] {
  switch (field) {
    case "name":
      return [
        [Sequelize.fn("LOWER", Sequelize.col("name")), dir],
        ["id", dir],
      ];
    case "metricCount":
      return [
        [Sequelize.literal(METRIC_COUNT_SQL), dir],
        ["id", dir],
      ];
    case "updatedAt":
      return [
        ["updatedAt", dir],
        ["id", dir],
      ];
    default:
      return [
        ["createdAt", dir],
        ["id", dir],
      ];
  }
}
```
