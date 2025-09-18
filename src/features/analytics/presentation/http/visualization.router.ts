import { Router } from "express";
import { handleGetVisualization } from "./visualization.controller";
import { authMiddleware } from "../../../../middleware/auth-middleware";
import { validate } from "../../../../middleware/validate";
import { getVisualizationSchema } from "./validators";
import catchAsync from "../../../../utils/catch-async";

const router = Router();

router.use(authMiddleware);

// TODO: User Rate Limit
router.get(
  "/:metricId",
  validate(getVisualizationSchema),
  catchAsync(handleGetVisualization)
);

export { router as visualizationRouter };
