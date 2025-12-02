import type { Response, NextFunction } from "express";
import { getVisualization } from "../../application/queries/getVisualization";
import { AuthRequest } from "@/types/request.context";
import { assertAuthenticated } from "@/utils/auth-guards";
import { pickValidated } from "@/middleware/validated";
import { getDashboardVizSchema, getVisualizationSchema } from "./validators";
import { successResponse } from "@/utils/response-formatter";
import { getDashboardVisualization } from "../../application/queries/getDashboardVisualization";

const DASH_CACHE_MAX_AGE = Number(process.env.VIZ_CACHE_MAX_AGE_SEC ?? 60);
const DASH_CACHE_STALE_WHILE_REVALIDATE = Number(
  process.env.VIZ_CACHE_STALE_SEC ?? 30
);

// TODO: Refactor
function makeEtag(body: unknown) {
  const buf = Buffer.from(JSON.stringify(body));
  return `"${buf.toString("base64").slice(0, 27)}"`;
}

export async function handleGetVisualization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    assertAuthenticated(req);

    const v = pickValidated(getVisualizationSchema)(req);
    const { params, query } = v;

    const data = await getVisualization({
      userId: req.user.id,
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
  next: NextFunction
) {
  try {
    assertAuthenticated(req);
    const { query } = pickValidated(getDashboardVizSchema)(req);

    const data = await getDashboardVisualization({
      userId: req.user.id,
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
