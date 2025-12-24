import { Router } from "express";
import {
  handleGetDashboardVisualization,
  handleGetVisualization,
} from "./controller.js";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware.js";
import { validate } from "@/shared/middleware/validation.js";
import { getDashboardVizSchema, getVisualizationSchema } from "./validators.js";
import catchAsync from "@/utils/catch-async.js";
import { analyticsRateLimiter } from "@/shared/middleware/rate-limiter.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/dashboard",
  analyticsRateLimiter,
  validate(getDashboardVizSchema),
  catchAsync(handleGetDashboardVisualization),
);

router.get(
  "/metrics/:metricId",
  analyticsRateLimiter,
  validate(getVisualizationSchema),
  catchAsync(handleGetVisualization),
);

export { router as visualizationRouter };
