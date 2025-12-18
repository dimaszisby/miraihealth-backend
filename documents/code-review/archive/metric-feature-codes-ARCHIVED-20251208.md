```text
src/features/metric
├── application
│   ├── ports
│   │   ├── CachePort.ts
│   │   ├── MetricSettingsPort.ts
│   │   ├── PersistenceTransaction.ts
│   │   └── TransactionPort.ts
│   ├── queries
│   │   ├── GetMetricDetail.ts
│   │   └── ListMetrics.ts
│   └── use-cases
│       ├── CreateMetric.ts
│       ├── DeleteMetric.ts
│       ├── GenerateDummyMetrics.ts
│       └── UpdateMetric.ts
├── domain
│   ├── entities
│   │   └── Metric.ts
│   ├── repositories
│   │   └── MetricRepository.ts
│   └── value-objects
├── infrastructure
│   ├── cache
│   │   └── MetricCacheRedis.ts
│   ├── http
│   │   ├── controller.ts
│   │   └── router.ts
│   └── persistence
│       ├── mappers
│       │   └── MetricMapper.ts
│       ├── models
│       │   └── metric.sequelize.ts
│       ├── repositories
│       │   ├── MetricRepoSequelize.ts
│       │   └── MetricSettingsPortSequelize.ts
│       └── SequelizeTransactionPort.ts
├── tests
│   ├── integration
│   └── unit
├── feature.ts
└── index.ts
```

```ts
// file:src/features/metric/application/ports/CachePort.ts
export interface CachePort {
  isEnabled(): boolean;
  invalidateMetrics(userId: string, metricId?: string): Promise<void>;
}
```

```ts
// file:src/features/metric/application/ports/MetricSettingsPort.ts
import { PersistenceTransaction } from "./PersistenceTransaction";

export interface MetricSettingsPort {
  createDefault(metricId: string, tx?: PersistenceTransaction): Promise<void>;
}
```

```ts
// file:src/features/metric/application/ports/PersistenceTransaction.ts
export type PersistenceTransaction = unknown;
```

```ts
// file:src/features/metric/application/ports/TransactionPort.ts
import { PersistenceTransaction } from "./PersistenceTransaction";

export interface TransactionPort {
  runInTransaction<T>(
    fn: (tx: PersistenceTransaction) => Promise<T>
  ): Promise<T>;
}
```

```ts
// file:src/features/metric/application/queries/GetMetricDetail.ts
import { models } from "@/infrastructure/db/models";
import AppError from "@/utils/AppError";
import logger from "@/utils/logger";
import { MetricDomainExtended } from "@/types/domain/metric.domain";
import { toExtendedMetricDomain } from "@/utils/mappers/metric.mapper";

type IncludeKey = "settings" | "category" | "logs";

type Input = {
  userId: string;
  metricId: string;
  includes?: IncludeKey[];
  logsLimit?: number;
};

export class GetMetricDetail {
  async execute({
    userId,
    metricId,
    includes = [],
    logsLimit = 20,
  }: Input): Promise<MetricDomainExtended | null> {
    const includeArr: any[] = [];

    if (includes.includes("category")) {
      includeArr.push({
        model: models.MetricCategory,
        as: "category",
        attributes: ["id", "name", "color", "icon", "createdAt", "updatedAt"],
      });
    }

    if (includes.includes("settings")) {
      includeArr.push({
        model: models.MetricSettings,
        as: "settings",
        attributes: [
          "id",
          "metricId",
          "isActive",
          "goalEnabled",
          "goalType",
          "goalValue",
          "timeFrameEnabled",
          "startDate",
          "deadlineDate",
          "alertEnabled",
          "alertThresholds",
          "isAchieved",
          "displayOptions",
          "createdAt",
          "updatedAt",
        ],
      });
    }

    if (includes.includes("logs")) {
      includeArr.push({
        model: models.MetricLog,
        as: "logs",
        attributes: [
          "id",
          "logValue",
          "type",
          "loggedAt",
          "createdAt",
          "updatedAt",
        ],
        order: [["createdAt", "DESC"]],
        limit: logsLimit,
      });
    }

    const metric = await models.Metric.findOne({
      where: { id: metricId, userId },
      include: includeArr,
    });

    if (!metric) {
      logger.info("No metric found.");
      return null;
    }

    if (!metric.isPublic && metric.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    return toExtendedMetricDomain(metric);
  }
}
```

```ts
// file:src/features/metric/application/queries/ListMetrics.ts
import type {
  ListMetricCategoriesResult,
  ListOpts,
  MetricReadRepository,
} from "../ports/MetricReadRepository";
import AppError from "@/utils/AppError";

export class ListMetrics {
  constructor(private repo: MetricReadRepository) {}

  async execute(options: ListOpts): Promise<ListMetricCategoriesResult> {
    if (!options.userId) throw new AppError("User not authenticated", 403);
    return this.repo.listMetrics(options);
  }
}
```


```ts
// file:src/features/metric/application/use-cases/CreateMetric.ts
import AppError from "@/utils/AppError";
import { Metric } from "../../domain/entities/Metric";
import {
  CreateMetricDTO,
  MetricRepository,
} from "../../domain/repositories/MetricRepository";
import { CachePort } from "../ports/CachePort";
import { MetricSettingsPort } from "../ports/MetricSettingsPort";
import { TransactionPort } from "../ports/TransactionPort";

type Input = CreateMetricDTO;

export class CreateMetric {
  constructor(
    private repo: MetricRepository,
    private settings: MetricSettingsPort,
    private cache: CachePort,
    private tx: TransactionPort
  ) {}

  async execute(input: Input): Promise<Metric> {
    if (await this.repo.existsByName(input.userId, input.name)) {
      throw new AppError("Metric already exists", 409);
    }

    if (input.categoryId) {
      const exists = await this.repo.categoryExists(
        input.userId,
        input.categoryId
      );
      if (!exists) throw new AppError("Category not found", 404);
    }

    return this.tx.runInTransaction(async (t) => {
      const metric = await this.repo.create(input, t);

      await this.settings.createDefault(metric.id, t);

      if (this.cache.isEnabled()) {
        await this.cache.invalidateMetrics(metric.userId, metric.id);
      }

      return metric;
    });
  }
}
```

```ts
// file:src/features/metric/application/use-cases/DeleteMetric.ts
import { findOwnedMetric } from "@/utils/db-helper";
import { MetricDomain } from "@/types/domain/metric.domain";
import { toDomainMetric } from "@/utils/mappers/metric.mapper";
import { CachePort } from "../ports/CachePort";

type Input = {
  userId: string;
  metricId: string;
};

export class DeleteMetric {
  constructor(private cache: CachePort) {}

  async execute({ userId, metricId }: Input): Promise<MetricDomain> {
    const metric = await findOwnedMetric(userId, metricId);

    if (this.cache.isEnabled() && metric.id) {
      await this.cache.invalidateMetrics(userId, metric.id);
    }

    await metric.destroy();

    return toDomainMetric(metric);
  }
}
```

```ts
// file:src/features/metric/application/use-cases/GenerateDummyMetrics.ts
import { models } from "@/infrastructure/db/models";
import { MetricDomain } from "@/types/domain/metric.domain";
import { toDomainMetric } from "@/utils/mappers/metric.mapper";
import { CachePort } from "../ports/CachePort";

type Input = {
  userId: string;
  count: number;
};

const DEFAULT_UNITS = ["kg", "steps", "ml", "units"];

export class GenerateDummyMetrics {
  constructor(private cache: CachePort) {}

  async execute({ userId, count }: Input): Promise<MetricDomain[]> {
    const dummyMetrics: MetricDomain[] = [];

    for (let i = 0; i < count; i++) {
      const metric = await models.Metric.create({
        userId,
        name: `Dummy Metric ${Date.now()}-${i}`,
        description:
          "This is a dummy metric generated for testing pagination.",
        defaultUnit:
          DEFAULT_UNITS[Math.floor(Math.random() * DEFAULT_UNITS.length)],
        isPublic: Math.random() > 0.5,
      });
      dummyMetrics.push(toDomainMetric(metric));
    }

    if (this.cache.isEnabled()) {
      await this.cache.invalidateMetrics(userId);
    }

    return dummyMetrics;
  }
}
```

```ts
// file:src/features/metric/application/use-cases/UpdateMetric.ts
import { UpdateMetricRequestDTO } from "@/types/dtos/metric.dto";
import { findOwnedMetric } from "@/utils/db-helper";
import { MetricDomain } from "@/types/domain/metric.domain";
import { toDomainMetric } from "@/utils/mappers/metric.mapper";
import { CachePort } from "../ports/CachePort";

type Input = {
  userId: string;
  metricId: string;
  data: UpdateMetricRequestDTO;
};

export class UpdateMetric {
  constructor(private cache: CachePort) {}

  async execute({ userId, metricId, data }: Input): Promise<MetricDomain> {
    const metric = await findOwnedMetric(userId, metricId);

    await metric.update(data);
    await metric.reload();

    if (this.cache.isEnabled() && metric.id) {
      await this.cache.invalidateMetrics(userId, metric.id);
    }

    return toDomainMetric(metric);
  }
}
```

```ts
// file:src/features/metric/domain/entities/Metric.ts
import { randomUUID } from "node:crypto";
import { MetricDomain } from "@/types/domain/metric.domain";

export type MetricProps = {
  id: string;
  userId: string;
  name: string;
  defaultUnit: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string | null;
  originalMetricId?: string | null;
  description?: string | null;
  deletedAt?: Date | null;
};

const MAX_NAME_LENGTH = 128;
const MAX_UNIT_LENGTH = 32;
const MAX_DESCRIPTION_LENGTH = 512;

export class Metric implements MetricDomain {
  private constructor(private props: MetricProps) {}

  static fromProps(props: MetricProps) {
    return new Metric(props);
  }

  static createDraft(props: Omit<MetricProps, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    return new Metric({
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  rename(next: string) {
    const value = next.trim();
    if (!value) throw new Error("Metric name cannot be empty");
    if (value.length > MAX_NAME_LENGTH)
      throw new Error("Metric name exceeds length limit");
    this.props.name = value;
    this.touch();
  }

  describe(next: string | null) {
    if (next && next.length > MAX_DESCRIPTION_LENGTH)
      throw new Error("Metric description exceeds length limit");
    this.props.description = next ?? null;
    this.touch();
  }

  setDefaultUnit(unit: string) {
    const normalized = unit.trim();
    if (!normalized) throw new Error("Default unit cannot be empty");
    if (normalized.length > MAX_UNIT_LENGTH)
      throw new Error("Default unit exceeds length limit");
    this.props.defaultUnit = normalized;
    this.touch();
  }

  moveToCategory(categoryId: string | null) {
    this.props.categoryId = categoryId;
    this.touch();
  }

  togglePublic(value: boolean) {
    this.props.isPublic = value;
    this.touch();
  }

  softDelete() {
    this.props.deletedAt = new Date();
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get name() {
    return this.props.name;
  }
  get description() {
    return this.props.description ?? null;
  }
  get defaultUnit() {
    return this.props.defaultUnit;
  }
  get isPublic() {
    return this.props.isPublic;
  }
  get categoryId() {
    return this.props.categoryId ?? null;
  }
  get originalMetricId() {
    return this.props.originalMetricId ?? null;
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

  private touch() {
    this.props.updatedAt = new Date();
  }
}
```

```ts
// file:src/features/metric/domain/repositories/MetricRepository.ts
import { Metric } from "../entities/Metric";
import { PersistenceTransaction } from "../../application/ports/PersistenceTransaction";

export type CreateMetricDTO = {
  userId: string;
  categoryId?: string | null;
  originalMetricId?: string | null;
  name: string;
  description?: string | null;
  defaultUnit: string;
  isPublic: boolean;
};

export interface MetricRepository {
  existsByName(userId: string, name: string): Promise<boolean>;
  categoryExists(userId: string, categoryId: string): Promise<boolean>;
  create(
    data: CreateMetricDTO,
    tx: PersistenceTransaction
  ): Promise<Metric>;
}
```

```ts
// file:src/features/metric/feature.ts
import { MetricRepoSequelize } from "./infrastructure/persistence/repositories/MetricRepoSequelize";
import { MetricSettingsPortSequelize } from "./infrastructure/persistence/repositories/MetricSettingsPortSequelize";
import { MetricCacheRedis } from "./infrastructure/cache/MetricCacheRedis";
import { SequelizeTransactionPort } from "./infrastructure/persistence/SequelizeTransactionPort";
import { UpdateMetric } from "./application/use-cases/UpdateMetric";
import { DeleteMetric } from "./application/use-cases/DeleteMetric";
import { GenerateDummyMetrics } from "./application/use-cases/GenerateDummyMetrics";
import { GetMetricDetail } from "./application/queries/GetMetricDetail";
import { CreateMetric } from "./application/use-cases/CreateMetric";

export const buildMetricFeature = () => {
  const repo = new MetricRepoSequelize();
  const settings = new MetricSettingsPortSequelize();
  const cache = new MetricCacheRedis();
  const tx = new SequelizeTransactionPort();
  const getMetricDetail = new GetMetricDetail();

  return {
    createMetric: new CreateMetric(repo, settings, cache, tx),
    updateMetric: new UpdateMetric(cache),
    deleteMetric: new DeleteMetric(cache),
    getMetricDetail,
    generateDummyMetrics: new GenerateDummyMetrics(cache),
  };
};
```

```ts
// file:src/features/metric/index.ts
import {
  metricRouter,
  createMetricRouter,
} from "./infrastructure/http/router";
export { buildMetricFeature } from "./feature";
export { metricRouter, createMetricRouter };
```

```ts
// file:src/features/metric/infrastructure/cache/MetricCacheRedis.ts
import logger from "@/utils/logger";
import {
  invalidateCacheByPattern,
  redisClient,
} from "@/utils/redis-client";
import { CachePort } from "../../application/ports/CachePort";

export class MetricCacheRedis implements CachePort {
  isEnabled(): boolean {
    return redisClient.isOpen;
  }

  async invalidateMetrics(userId: string, metricId?: string): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await invalidateCacheByPattern(`metrics:${userId}:*`);
      if (metricId) {
        await invalidateCacheByPattern(`metric:${userId}:${metricId}:*`);
      }
      logger.info(
        `[CACHE] cache invalidated user=${userId}, metric=${metricId ?? "-"}`
      );
    } catch (error: any) {
      logger.error(
        `[CACHE ERROR] Cache invalidation failed: ${error?.message}`,
        error
      );
    }
  }
}
```

```ts
// file:src/features/metric/infrastructure/http/controller.ts
import { NextFunction, Response } from "express";
import { GenerateDummyMetricsRequestDTO } from "@/types/dtos/metric.dto";
import { listMetricQueryViaCursor } from "@/types/api/zod-metric.schema";
import { buildMetricFeature } from "../../feature";
import { AuthRequest } from "@/types/request.context";
import logger from "@/utils/logger";
import {
  toMetricLibraryResponseDTO,
  toMetricResponseDTO,
  toUserMetricDetailResponseDTO,
} from "@/utils/mappers/metric.mapper";
import AppError from "@/utils/AppError";
import { successResponse } from "@/utils/response-formatter";
import catchAsync from "@/utils/catch-async";
import { assertAuthenticated } from "@/utils/auth-guards";

type MetricFeature = ReturnType<typeof buildMetricFeature>;
let metricFeature: MetricFeature = buildMetricFeature();

export const overrideMetricFeature = (feature: MetricFeature) => {
  metricFeature = feature;
};

export const createMetric = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const {
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    } = req.body;

    const metricDomain = await metricFeature.createMetric.execute({
      userId: req.user.id,
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    });

    const dto = toMetricResponseDTO(metricDomain);
    successResponse(res, 201, dto, "Metric created successfully");
  }
);

export const getUserMetricLibrariesViaCursor = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const parsed = listMetricQueryViaCursor.parse(req.query);
    const { limit, sort, q, after, includeTotal, filter } = parsed;

    const page = await metricFeature.listMetrics.execute({
      userId: req.user.id,
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    const dto = {
      items: page.items.map(toMetricLibraryResponseDTO),
      nextCursor: page.nextCursor,
      sort: page.sort,
      limit: page.limit,
      ...(page.q ? { q: page.q } : {}),
      ...(page.filter ? { filter: page.filter } : {}),
      ...(includeTotal ? { totalCount: page.totalCount ?? 0 } : {}),
    };

    successResponse(res, 200, dto, "Metrics cursor fetched successfully");
  }
);

export const getUserDetailMetricById = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const includeRaw = String(req.query.include ?? "flat");
    const allowed = new Set(["settings", "category", "logs"]);

    let includes: Array<"settings" | "category" | "logs"> = [];
    if (includeRaw === "full") {
      includes = ["settings", "category", "logs"];
    } else if (includeRaw !== "flat") {
      includes = includeRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is "settings" | "category" | "logs" => allowed.has(s));
    }

    const logsLimit = Number(req.query.logsLimit ?? 20);

    const metric = await metricFeature.getMetricDetail.execute({
      userId: req.user.id,
      metricId: req.params.id,
      includes,
      logsLimit,
    });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    let dto;
    try {
      dto = toUserMetricDetailResponseDTO(metric);
    } catch (err) {
      logger.error("Error mapping metric to DTO:", err, metric);
      throw new AppError("Internal Server Error: mapping failed", 500);
    }

    successResponse(
      res,
      200,
      dto,
      "Metric extended detail retrieved successfully"
    );
  }
);

export const updateMetric = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const updatedMetricDomain = await metricFeature.updateMetric.execute({
      userId: req.user.id,
      metricId: req.params.id,
      data: req.body,
    });
    const dto = toMetricResponseDTO(updatedMetricDomain);

    successResponse(res, 200, dto, "Metric updated successfully");
  }
);

export const deleteMetric = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const metricDomain = await metricFeature.deleteMetric.execute({
      userId: req.user.id,
      metricId: req.params.id,
    });
    const dto = toMetricResponseDTO(metricDomain);

    successResponse(res, 200, dto, "Metric deleted successfully");
  }
);

export const generateDummyMetrics = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);
    const { count } = req.body as GenerateDummyMetricsRequestDTO;

    const dummyMetrics = await metricFeature.generateDummyMetrics.execute({
      userId: req.user.id,
      count,
    });
    const dto = dummyMetrics.map(toMetricResponseDTO);

    successResponse(
      res,
      201,
      dto,
      `${count} dummy metrics generated successfully`
    );
  }
);
```

```ts
// file:src/features/metric/infrastructure/http/router.ts
import { Router } from "express";
import { z } from "zod";
import {
  createMetric,
  getUserMetricLibrariesViaCursor,
  getUserDetailMetricById,
  updateMetric,
  deleteMetric,
  generateDummyMetrics,
} from "./controller";
import { handleMetricTrend } from "@/features/analytics/infrastructure/http/visualization.controller";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware";
import { cacheMiddleware } from "@/shared/middleware/cache";
import { userRateLimiter } from "@/shared/middleware/rate-limiter";
import { validate } from "@/shared/middleware/validation";
import {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricSchema,
  generateDummyMetricsSchema,
  getAllMetricsViaCursorSchema,
} from "@/types/api/zod-metric.schema";
import { AuthRequest } from "@/types/request.context";
import { env } from "@/config/zodEnv";

const metricsCacheKey = (req: AuthRequest) => {
  const q = req.query as Record<string, unknown>;
  const allow = [
    "page",
    "limit",
    "sortBy",
    "sortOrder",
    "q",
    "name",
    "categoryId",
    "isPublic",
  ] as const;

  const picked: Record<string, unknown> = {};
  for (const k of allow) {
    if (q[k] !== undefined && q[k] !== null && q[k] !== "") picked[k] = q[k];
  }

  if (picked.page === undefined) picked.page = 1;
  if (picked.limit === undefined) picked.limit = 20;
  if (picked.sortBy === undefined) picked.sortBy = "createdAt";
  if (picked.sortOrder === undefined) picked.sortOrder = "DESC";

  const stable = Object.keys(picked)
    .sort()
    .map((k) => `${k}:${String(picked[k])}`)
    .join("|");

  return `metrics:${req.user?.id}:${stable}`;
};

const metricsCursorCacheKey = (req: AuthRequest) => {
  const { limit = 20, sort = "-createdAt", q, after } = req.query as any;
  const fname = (req.query["filter[name]"] as string) ?? "";
  const fcat = (req.query["filter[categoryId]"] as string) ?? "";
  const includeTotal = String(req.query.includeTotal ?? "false");

  return [
    "metrics",
    req.user?.id,
    `l:${limit}`,
    `s:${sort}`,
    `q:${q ?? ""}`,
    `fn:${fname}`,
    `fc:${fcat}`,
    `after:${after ?? ""}`,
    `it:${includeTotal}`,
  ].join(":");
};

const metricCacheKey = (req: AuthRequest) => {
  const includeRaw = String((req.query as any)?.include ?? "flat");
  const logsLimit = Number((req.query as any)?.logsLimit ?? 20);
  const allowed = ["settings", "category", "logs"] as const;

  let includeNormalized = "flat";
  if (includeRaw === "full") {
    includeNormalized = "category,logs,settings";
  } else if (includeRaw !== "flat") {
    includeNormalized = includeRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is (typeof allowed)[number] => allowed.includes(s as any))
      .sort()
      .join(",");
    if (!includeNormalized) includeNormalized = "flat";
  }

  return `metric:${req.user?.id}:${req.params.id}:inc:${includeNormalized}:ll:${logsLimit}`;
};

export const createMetricRouter = () => {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", userRateLimiter, validate(createMetricSchema), createMetric);

  router.get(
    "/",
    validate(getAllMetricsViaCursorSchema),
    cacheMiddleware(metricsCursorCacheKey, 60),
    getUserMetricLibrariesViaCursor
  );

  router.get(
    "/:id",
    validate(getMetricSchema),
    cacheMiddleware(metricCacheKey, 60),
    getUserDetailMetricById
  );

  router.put("/:id", userRateLimiter, validate(updateMetricSchema), updateMetric);

  router.delete(
    "/:id",
    userRateLimiter,
    validate(deleteMetricSchema),
    deleteMetric
  );

  const trendParams = { params: z.object({ metricId: z.string().uuid() }) };
  router.get("/:metricId/trends", validate(trendParams as any), handleMetricTrend);

  if (env.ENABLE_DUMMY_ENDPOINTS) {
    router.post(
      "/dummy",
      userRateLimiter,
      validate(generateDummyMetricsSchema),
      generateDummyMetrics
    );
  }

  return router;
};

export const metricRouter = createMetricRouter();
```

```ts
// file:src/features/metric/infrastructure/persistence/SequelizeTransactionPort.ts
import sequelize from "@/config/db";
import { Transaction } from "sequelize";
import { TransactionPort } from "../../application/ports/TransactionPort";
import { PersistenceTransaction } from "../../application/ports/PersistenceTransaction";

export class SequelizeTransactionPort implements TransactionPort {
  async runInTransaction<T>(
    fn: (tx: PersistenceTransaction) => Promise<T>
  ): Promise<T> {
    return sequelize.transaction(async (transaction: Transaction) => {
      return fn(transaction);
    });
  }
}
```

```ts
// file:src/features/metric/infrastructure/persistence/mappers/MetricMapper.ts
import { Metric } from "../../../domain/entities/Metric";

export type MetricRow = {
  id: string;
  userId: string;
  categoryId: string | null;
  originalMetricId: string | null;
  name: string;
  description: string | null;
  defaultUnit: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export function toDomain(row: MetricRow): Metric {
  return Metric.fromProps({
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    originalMetricId: row.originalMetricId,
    name: row.name,
    description: row.description,
    defaultUnit: row.defaultUnit,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}
```

```ts
// file:src/features/metric/infrastructure/persistence/models/metric.sequelize.ts
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { MetricAttributesBase } from "@/types/db/metric.types";
import type { DbModels } from "@/infrastructure/db/types";
import { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize.js";
import { MetricSettings } from "@/features/metric-settings/infrastructure/persistence/models/metric-settings.sequelize.js";
import { MetricLog } from "@/features/metric-log/infrastructure/persistence/models/metric-log.sequelize.js";

export interface MetricAttributes extends MetricAttributesBase {
  id: string;
  userId: string;
  categoryId: string | null;
  originalMetricId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MetricCreationAttributes
  extends Optional<MetricAttributes, "id"> {}

export class Metric
  extends Model<MetricAttributes, MetricCreationAttributes>
  implements MetricAttributes
{
  declare id: string;
  declare userId: string;
  declare categoryId: string | null;
  declare originalMetricId: string | null;
  declare name: string;
  declare description: string | null;
  declare defaultUnit: string;
  declare isPublic: boolean;
  declare deletedAt?: Date | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  declare MetricCategory?: MetricCategory;
  declare MetricSettings?: MetricSettings;
  declare MetricLogs?: MetricLog[];

  static initModel(sequelize: Sequelize) {
    Metric.init(
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
        categoryId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "metric_categories",
            key: "id",
          },
        },
        originalMetricId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "metrics",
            key: "id",
          },
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        defaultUnit: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isPublic: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Metric",
        tableName: "metrics",
        paranoid: true,
        underscored: true,
        schema: "public",
      }
    );

    return Metric;
  }

  static associate(models: DbModels) {
    Metric.belongsTo(models.User, {
      as: "user",
      foreignKey: { name: "userId", field: "user_id", allowNull: false },
      onDelete: "CASCADE",
    });

    Metric.belongsTo(models.MetricCategory, {
      as: "category",
      foreignKey: { name: "categoryId", field: "category_id", allowNull: true },
      onDelete: "SET NULL",
    });

    Metric.belongsTo(models.Metric, {
      as: "originalMetric",
      foreignKey: {
        name: "originalMetricId",
        field: "original_metric_id",
        allowNull: true,
      },
      onDelete: "SET NULL",
    });

    Metric.hasOne(models.MetricSettings, {
      as: "settings",
      foreignKey: { name: "metricId", field: "metric_id", allowNull: false },
      onDelete: "CASCADE",
    });

    Metric.hasMany(models.MetricLog, {
      as: "logs",
      foreignKey: { name: "metricId", field: "metric_id", allowNull: false },
      onDelete: "CASCADE",
    });
  }
}

export function initMetric(sequelize: Sequelize) {
  return Metric.initModel(sequelize);
}
export function associateMetric(models: DbModels) {
  Metric.associate(models);
}

export const registerMetricModels = (sequelize: Sequelize) => {
  initMetric(sequelize);
  return { Metric };
};

export const associateMetricModels = (models: DbModels) => {
  associateMetric(models);
};
```

```ts
// file:src/features/metric/infrastructure/persistence/repositories/MetricRepoSequelize.ts
import { models } from "@/infrastructure/db/models";
import { Transaction } from "sequelize";
import {
  CreateMetricDTO,
  MetricRepository,
} from "../../../domain/repositories/MetricRepository";
import { Metric } from "../../../domain/entities/Metric";
import { PersistenceTransaction } from "../../../application/ports/PersistenceTransaction";
import { MetricRow, toDomain } from "../mappers/MetricMapper";

export class MetricRepoSequelize implements MetricRepository {
  async existsByName(userId: string, name: string): Promise<boolean> {
    const count = await models.Metric.count({ where: { userId, name } });
    return count > 0;
  }

  async categoryExists(
    userId: string,
    categoryId: string
  ): Promise<boolean> {
    const count = await models.MetricCategory.count({
      where: { userId, id: categoryId },
    });
    return count > 0;
  }

  async create(
    data: CreateMetricDTO,
    tx: PersistenceTransaction
  ): Promise<Metric> {
    const transaction = tx as Transaction;
    const created = await models.Metric.create(
      {
        userId: data.userId,
        categoryId: data.categoryId ?? null,
        originalMetricId: data.originalMetricId ?? null,
        name: data.name,
        description: data.description ?? null,
        defaultUnit: data.defaultUnit,
        isPublic: data.isPublic,
      },
      { transaction }
    );

    await created.reload({ transaction });

    const row: MetricRow = {
      id: created.id,
      userId: created.userId,
      categoryId: created.categoryId,
      originalMetricId: created.originalMetricId,
      name: created.name,
      description: created.description,
      defaultUnit: created.defaultUnit,
      isPublic: created.isPublic,
      createdAt: created.createdAt!,
      updatedAt: created.updatedAt!,
      deletedAt: created.deletedAt ?? null,
    };

    return toDomain(row);
  }
}
```

```ts
// file:src/features/metric/infrastructure/persistence/repositories/MetricSettingsPortSequelize.ts
import { models } from "@/infrastructure/db/models";
import { Transaction } from "sequelize";
import { MetricSettingsPort } from "../../../application/ports/MetricSettingsPort";
import { PersistenceTransaction } from "../../../application/ports/PersistenceTransaction";

export class MetricSettingsPortSequelize implements MetricSettingsPort {
  async createDefault(
    metricId: string,
    tx: PersistenceTransaction
  ): Promise<void> {
    const transaction = tx as Transaction;
    await models.MetricSettings.create(
      {
        metricId,
        goalEnabled: false,
        goalType: null,
        goalValue: null,
        timeFrameEnabled: false,
        startDate: null,
        deadlineDate: null,
        alertEnabled: false,
        alertThresholds: 80,
        isAchieved: false,
        isActive: true,
        displayOptions: {
          showOnDashboard: true,
          priority: 1,
          chartType: "line",
          color: "#E897A3",
        },
      },
      { transaction }
    );
  }
}
```
