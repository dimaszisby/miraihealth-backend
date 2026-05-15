import type { Response, NextFunction } from "express";
import { AuthRequest } from "@/types/request.context.js";
import { assertAuthenticated } from "@/utils/auth-guards.js";
import { pickValidated } from "@/shared/middleware/validated.js";
import { getDashboardVizSchema, getVisualizationSchema } from "./validators.js";
import { successResponse } from "@/utils/response-formatter.js";
import { buildAnalyticsFeature } from "../../feature.js";

const DASH_CACHE_MAX_AGE = Number(process.env.VIZ_CACHE_MAX_AGE_SEC ?? 60);
const DASH_CACHE_STALE_WHILE_REVALIDATE = Number(
  process.env.VIZ_CACHE_STALE_SEC ?? 30,
);

type AnalyticsFeature = ReturnType<typeof buildAnalyticsFeature>;
let feature: AnalyticsFeature = buildAnalyticsFeature();

export const overrideAnalyticsFeatureForTest = (custom: AnalyticsFeature) => {
  feature = custom;
};

function makeEtag(body: unknown) {
  const buf = Buffer.from(JSON.stringify(body));
  return `"${buf.toString("base64").slice(0, 27)}"`;
}

export async function handleGetVisualization(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    assertAuthenticated(req);
    const v = pickValidated(getVisualizationSchema)(req);
    const { params, query } = v;

    const data = await feature.getVisualization.execute({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      metricId: params.metricId,
      startISO: query.start,
      endISO: query.end,
      bucket: query.bucket,
      tz: query.tz,
      fill: query.fill,
    });

    const etag = makeEtag(data);
    if (req.headers["if-none-match"] === etag) return res.status(304).end();
    res.setHeader("ETag", etag);

    return successResponse(res, 200, data);
  } catch (err) {
    next(err);
  }
}

export async function handleGetDashboardVisualization(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    assertAuthenticated(req);
    const { query } = pickValidated(getDashboardVizSchema)(req);

    const data = await feature.getDashboardVisualization.execute({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      startISO: query.start,
      endISO: query.end,
      bucket: query.bucket,
      tz: query.tz,
      fill: query.fill,
      limit: query.limit,
    });

    const etag = data?.sync?.etagSeed ?? makeEtag(data);
    const cacheControl = [
      "private",
      `max-age=${DASH_CACHE_MAX_AGE}`,
      `stale-while-revalidate=${DASH_CACHE_STALE_WHILE_REVALIDATE}`,
    ].join(", ");
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", cacheControl);
    if (req.headers["if-none-match"] === etag) return res.status(304).end();
    return successResponse(res, 200, data);
  } catch (err) {
    next(err);
  }
}
