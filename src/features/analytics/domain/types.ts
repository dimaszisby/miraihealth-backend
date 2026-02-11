import { BucketAlias } from "./buckets.js";
import type { RangeDescriptor } from "./fallback-range.js";

export type FillMode = "none" | "zero" | "nan";

// * Base Singular Visualization
export type VizSeries = {
  bucketStartISO: string;
  value: number | null;
};

export type VizStats = {
  average: number | null;
  min: number | null;
  max: number | null;
  count: number;
};

export type VizMeta = {
  metricId: string;
  unit: string;
  bucket: BucketAlias;
  tz: string;
  range: {
    startISO: string;
    endISO: string;
  };
  fill: FillMode;
};

export type VizResponse = {
  metricId: string;
  series: VizSeries[];
  stats: VizStats;
  meta: VizMeta;
};

// * Dashboard Visualization
export type DashboardVizItem = {
  metricId: string;
  name: string;
  unit: string;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  priority: number | null;
  series: { bucketStartISO: string; value: number | null }[];
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
  requestedRange: RangeDescriptor;
  actualRange: RangeDescriptor;
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
