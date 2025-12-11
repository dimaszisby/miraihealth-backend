import { MetricLibraryDomain, MetricDomainExtended } from "@/types/domain/metric.domain";

export type SortField = "createdAt" | "updatedAt" | "name" | "logCount";
export type SortParam = SortField | `-${SortField}`;
export type Dir = "ASC" | "DESC";

export interface ListMetricCategoriesResult {
  items: MetricLibraryDomain[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: { name?: string; categoryId?: string };
  totalCount?: number;
}

export interface ListOpts {
  userId: string;
  limit: number;
  sort: SortParam;
  q?: string;
  filter?: { name?: string; categoryId?: string };
  after?: string;
  includeTotal?: boolean;
}

export type IncludeKey = "settings" | "category" | "logs";

export interface MetricDetailQuery {
  userId: string;
  metricId: string;
  includes?: IncludeKey[];
  logsLimit?: number;
}

export interface MetricReadRepository {
  listMetrics(opts: ListOpts): Promise<ListMetricCategoriesResult>;
  findDetailedMetric(
    params: MetricDetailQuery
  ): Promise<MetricDomainExtended | null>;
}
