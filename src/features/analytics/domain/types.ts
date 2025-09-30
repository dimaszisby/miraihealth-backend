import { BucketAlias } from "./buckets";

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
};

export type VizResponse = {
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
};

export type DashboardVizResponse = {
  items: DashboardVizItem[];
  meta: {
    bucket: BucketAlias;
    tz: string;
    range: { startISO: string; endISO: string };
    count: number; // items.length
  };
};
