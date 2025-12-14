import { Router } from "express";
import {
  handleGetDashboardVisualization,
  handleGetVisualization,
} from "./controller";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware";
import { validate } from "@/shared/middleware/validation";
import { getDashboardVizSchema, getVisualizationSchema } from "./validators";
import catchAsync from "@/utils/catch-async";
import { analyticsRateLimiter } from "@/shared/middleware/rate-limiter";

const router = Router();

router.use(authMiddleware);

router.get(
  "/dashboard",
  analyticsRateLimiter,
  validate(getDashboardVizSchema),
  catchAsync(handleGetDashboardVisualization)
);

router.get(
  "/metrics/:metricId",
  analyticsRateLimiter,
  validate(getVisualizationSchema),
  catchAsync(handleGetVisualization)
);

export { router as visualizationRouter };
