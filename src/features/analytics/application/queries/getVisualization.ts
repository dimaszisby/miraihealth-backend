import AppError from "@/utils/AppError";
import type { FillMode, VizResponse } from "../../domain/types";
import {
  resolveBucket,
  BucketAlias,
  type BucketSpec,
} from "../../domain/buckets";
import type { VisualizationReadRepository } from "../ports/VisualizationReadRepository";

export type GetVisualizationInput = {
  userId: string;
  metricId: string;
  startISO: string;
  endISO: string;
  bucket: BucketAlias;
  tz: string;
  fill?: FillMode;
};

const MAX_BUCKETS = Number(process.env.VIZ_MAX_BUCKETS ?? 400);

export class GetVisualization {
  constructor(private repo: VisualizationReadRepository) {}

  async execute(input: GetVisualizationInput): Promise<VizResponse> {
    const spec = resolveBucket(input.bucket);
    assertBounds(input.startISO, input.endISO, spec);

    const result = await this.repo.fetchVisualization({
      userId: input.userId,
      metricId: input.metricId,
      startISO: input.startISO,
      endISO: input.endISO,
      bucket: input.bucket,
      bucketSpec: spec,
      tz: input.tz,
      fill: input.fill ?? "none",
    });

    return result;
  }
}

function assertBounds(startISO: string, endISO: string, spec: BucketSpec) {
  const start = Date.parse(startISO);
  const end = Date.parse(endISO);

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new AppError("Invalid date range", 400);
  }

  const est = Math.ceil((end - start) / spec.approxMs) + 2;
  if (est > MAX_BUCKETS) {
    throw new AppError(
      `Range too large for ${spec.iso} (~${est} buckets, max=${MAX_BUCKETS})`,
      400
    );
  }
}
