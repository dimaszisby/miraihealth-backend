import { Router } from "express";
import {
  handleGetDashboardVisualization,
  handleGetVisualization,
} from "./visualization.controller";
import { authMiddleware } from "../../../../middleware/auth-middleware";
import { validate } from "../../../../middleware/validate";
import { getDashboardVizSchema, getVisualizationSchema } from "./validators";
import catchAsync from "../../../../utils/catch-async";

const router = Router();

router.use(authMiddleware);

// TODO: User Rate Limit
router.get(
  "/dashboard",
  validate(getDashboardVizSchema),
  catchAsync(handleGetDashboardVisualization)
);

router.get(
  "/metrics/:metricId",
  validate(getVisualizationSchema),
  catchAsync(handleGetVisualization)
);

export { router as visualizationRouter };
