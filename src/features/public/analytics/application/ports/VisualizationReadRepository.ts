import type { VizResponse } from "../../domain/types.js";
import type { BucketAlias, BucketSpec } from "../../domain/buckets.js";
import type { FillMode } from "../../domain/types.js";

export type VisualizationQueryParams = {
  userId: string;
  organizationId: string;
  metricId: string;
  startISO: string;
  endISO: string;
  bucket: BucketAlias;
  bucketSpec: BucketSpec;
  tz: string;
  fill: FillMode;
};

export type DashboardVisualizationParams = {
  userId: string;
  organizationId: string;
  startISO: string;
  endISO: string;
  bucket: BucketAlias;
  bucketSpec: BucketSpec;
  tz: string;
  fill: FillMode;
  limit: number;
};

export type DashboardVizItem = {
  metricId: string;
  name: string;
  unit: string;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  priority: number | null;
  series: {
    bucketStartISO: string;
    value: number | null;
  }[];
  stats: {
    average: number | null;
    min: number | null;
    max: number | null;
    count: number;
  };
  lastLogAt: string | null;
  firstLogAt: string | null;
  totalLogs: number;
  latestValue: number | null;
  latestBucketStart: string | null;
  requestedRange: {
    startISO: string;
    endISO: string;
    bucket: BucketAlias;
  };
  actualRange: {
    startISO: string;
    endISO: string;
    bucket: BucketAlias;
  };
  fallbackRangeUsed: boolean;
  fallbackStrategy: string | null;
};

export type DashboardVizResponse = {
  items: DashboardVizItem[];
  meta: {
    bucket: BucketAlias;
    tz: string;
    range: { startISO: string; endISO: string };
    count: number;
    totalMetrics: number;
    fallbackMetrics: number;
  };
  sync: {
    etagSeed: string;
  };
};

export interface VisualizationReadRepository {
  fetchVisualization(params: VisualizationQueryParams): Promise<VizResponse>;
  fetchDashboardVisualization(
    params: DashboardVisualizationParams,
  ): Promise<DashboardVizResponse>;
}
