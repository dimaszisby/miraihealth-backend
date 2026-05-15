import AppError from "@/utils/AppError.js";
import type { FillMode } from "../../domain/types.js";
import {
  resolveBucket,
  BucketAlias,
  type BucketSpec,
} from "../../domain/buckets.js";
import type {
  VisualizationReadRepository,
  DashboardVizResponse,
} from "../ports/VisualizationReadRepository.js";

export type GetDashboardVisualizationInput = {
  userId: string;
  organizationId: string;
  startISO: string;
  endISO: string;
  bucket: BucketAlias;
  tz: string;
  fill?: FillMode;
  limit?: number;
};

const DASH_MAX_BUCKETS = Number(process.env.VIZ_MAX_BUCKETS ?? 400);

export class GetDashboardVisualization {
  constructor(private repo: VisualizationReadRepository) {}

  async execute(
    input: GetDashboardVisualizationInput,
  ): Promise<DashboardVizResponse> {
    const spec = resolveBucket(input.bucket);
    assertBounds(input.startISO, input.endISO, spec);

    const limit = Math.min(
      input.limit ?? 12,
      Number(process.env.VIZ_DASH_MAX_METRICS ?? 24),
    );

    return this.repo.fetchDashboardVisualization({
      userId: input.userId,
      organizationId: input.organizationId,
      startISO: input.startISO,
      endISO: input.endISO,
      bucket: input.bucket,
      bucketSpec: spec,
      tz: input.tz,
      fill: input.fill ?? "none",
      limit,
    });
  }
}

function assertBounds(startISO: string, endISO: string, spec: BucketSpec) {
  const start = Date.parse(startISO);
  const end = Date.parse(endISO);

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new AppError("Invalid date range", 400);
  }

  const est = Math.ceil((end - start) / spec.approxMs) + 2;
  if (est > DASH_MAX_BUCKETS) {
    throw new AppError(
      `Range too large for ${spec.iso} (~${est} buckets, max=${DASH_MAX_BUCKETS})`,
      400,
    );
  }
}
