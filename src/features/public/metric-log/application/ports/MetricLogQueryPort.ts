import { MetricLogDomain } from "@/types/domain/metric-log.domain.js";

export type SortField = "createdAt" | "updatedAt" | "logValue" | "loggedAt";
export type SortParam = SortField | `-${SortField}`;

export type ListFilter = { metricId?: string; logValue?: number };

export interface ListOpts {
  userId: string;
  organizationId: string;
  limit: number;
  sort: SortParam;
  q?: string;
  filter?: ListFilter;
  after?: string;
  includeTotal?: boolean;
}

export interface ListLogsResult {
  items: MetricLogDomain[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: ListFilter;
  totalCount?: number;
}

export interface MetricLogQueryPort {
  listLogs(options: ListOpts): Promise<ListLogsResult>;
}
