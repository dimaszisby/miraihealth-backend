import { Response } from "express";
import catchAsync from "@/utils/catch-async.js";
import { successResponse } from "@/utils/response-formatter.js";
import { AuthRequest } from "@/types/request.context.js";
import { assertAuthenticated } from "@/utils/auth-guards.js";
import {
  toResponseDTO,
  toListResponseDTO,
} from "@/features/metric-category/infrastructure/mappers/MetricCategoryMapper.js";
import {
  createMetricCategorySchema,
  deleteMetricCategorySchema,
  getAllMetricCategoriesSchema,
  getMetricCategorySchema,
  updateMetricCategorySchema,
} from "./schema.zod.js";
import { buildMetricCategoryFeature } from "../../feature.js";
import { generateDummyMetricCategoriesSchema } from "./schema.zod.js";
import { pickValidated } from "@/shared/middleware/validated.js";

type Feature = ReturnType<typeof buildMetricCategoryFeature>;
let feature: Feature = buildMetricCategoryFeature();

export const overrideMetricCategoryFeatureForTest = (custom: Feature) => {
  feature = custom;
};

export const createCategory = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const { body } = pickValidated(createMetricCategorySchema)(req);
    const payload = body;
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
      "Category created successfully",
    );
  },
);

export const listCategories = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const { query } = pickValidated(getAllMetricCategoriesSchema)(req);
    const { limit, sort, q, after, includeTotal, filterName } = query;
    const filter = filterName ? { name: filterName } : undefined;

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
      nextCursor: page.nextCursor ?? null,
      sort: page.sort,
      limit: page.limit,
      ...(page.q ? { q: page.q } : {}),
      ...(page.filter ? { filter: page.filter } : {}),
      ...(includeTotal ? { totalCount: page.totalCount ?? 0 } : {}),
    };

    successResponse(res, 200, dto, "Categories list retrieved successfully");
  },
);

export const getCategory = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const { params } = pickValidated(getMetricCategorySchema)(req);
    const category = await feature.getCategory.execute(req.user.id, params.id);
    successResponse(
      res,
      200,
      toResponseDTO(category),
      "Category retrieved successfully",
    );
  },
);

export const updateCategory = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const { body, params } = pickValidated(updateMetricCategorySchema)(req);
    const category = await feature.updateCategory.execute({
      userId: req.user.id,
      categoryId: params.id,
      name: body.name,
      color: body.color,
      icon: body.icon,
    });

    successResponse(
      res,
      200,
      toResponseDTO(category),
      "Category updated successfully",
    );
  },
);

export const deleteCategory = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const { params } = pickValidated(deleteMetricCategorySchema)(req);
    await feature.deleteCategory.execute(req.user.id, params.id);
    successResponse(res, 200, null, "Category deleted successfully");
  },
);

export const generateDummyCategories = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const { body } = pickValidated(generateDummyMetricCategoriesSchema)(req);
    const created = await feature.generateDummyCategories.execute({
      userId: req.user.id,
      count: body.count,
    });

    successResponse(
      res,
      201,
      toListResponseDTO(created),
      `${body.count} dummy metric categories generated successfully`,
    );
  },
);

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
// import { ListCategories } from "../../application/use-cases/ListCategories.js";
// import { CreateCategory } from "../../application/use-cases/CreateCategory.js";
// import { MetricCategoryRepoSequelize } from "../persistence/repositories/MetricCategoryRepoSequelize.js";
// import { RedisCacheAdapter } from "../cache/RedisCacheAdapter.js";
// import { toResponseDTOLegacy } from "../../legacies/MetricCategoryLegacy.mapper.js";

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
