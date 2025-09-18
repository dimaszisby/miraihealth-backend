import { BucketAlias } from "./buckets";

export type FillMode = "none" | "zero" | "nan";

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