// src/features/metric-category/application/queries/GetCategoryById.ts

import { findOwnedCategory } from "@/utils/db-helper";
import { MetricCategoryDomain } from "../../domain/entities/domain";
import { toDomainMetricCategory } from "../../infrastructure/mapping/mapper";

/**
 * Get a specific metric category by ID only can be accessed by owned user
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @returns Metric category object
 * @throws {AppError}  If category not found or on failure
 */
const getUserMetricCategoryByIdService = async (
  userId: string,
  categoryId: string
): Promise<MetricCategoryDomain> => {
  const category = await findOwnedCategory(userId, categoryId);
  return toDomainMetricCategory(category);
};

export default getUserMetricCategoryByIdService;
