import AppError from "@/utils/AppError.js";
import type {
  MetricLogQueryPort,
  ListLogsResult,
  ListOpts,
  SortField,
  SortParam,
} from "../ports/MetricLogQueryPort.js";

export class ListMetricLogs {
  constructor(private repo: MetricLogQueryPort) {}

  async execute(options: ListOpts): Promise<ListLogsResult> {
    if (!options.userId) throw new AppError("User not authenticated", 403);
    return this.repo.listLogs(options);
  }
}

export type {
  MetricLogQueryPort,
  ListLogsResult, 
  ListOpts,
  SortField,
  SortParam,
};
