import type { Response, NextFunction } from "express";
import { getVisualization } from "../../application/queries/getVisualization";
import { AuthRequest } from "@/types/request.context";
import { assertAuthenticated } from "@/utils/auth-guards";
import { pickValidated } from "@/middleware/validated";
import { getVisualizationSchema } from "./validators";

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

    return res.json(data);
  } catch (err) {
    next(err);
  }
}
