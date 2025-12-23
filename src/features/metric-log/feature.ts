import { MetricLogRepoSequelize } from "./infrastructure/persistence/repositories/MetricLogRepoSequelize.js";
import { MetricLogCacheRedis } from "./infrastructure/cache/MetricLogCacheRedis.js";
import { MetricAccessSequelize } from "./infrastructure/access/MetricAccessSequelize.js";
import { CreateMetricLog } from "./application/use-cases/CreateMetricLog.js";
import { GetMetricLog } from "./application/queries/GetMetricLog.js";
import { UpdateMetricLog } from "./application/use-cases/UpdateMetricLog.js";
import { DeleteMetricLog } from "./application/use-cases/DeleteMetricLog.js";
import { GetMetricLogStats } from "./application/queries/GetMetricLogStats.js";
import { GenerateDummyMetricLogs } from "./application/use-cases/GenerateDummyMetricLogs.js";
import { MetricLogQueryRepoSequelize } from "./infrastructure/persistence/repositories/MetricLogQueryRepoSequelize.js";
import { ListMetricLogs } from "./application/queries/ListMetricLogs.js";
import type { VisualizationInvalidationPort } from "@/shared/application/ports/VisualizationInvalidationPort.js";
import { NoopVisualizationInvalidation } from "@/shared/application/ports/VisualizationInvalidationPort.js";

type MetricLogFeatureDeps = {
  visualizationInvalidator?: VisualizationInvalidationPort;
};

export const buildMetricLogFeature = (
  deps: MetricLogFeatureDeps = {}
) => {
  const repo = new MetricLogRepoSequelize();
  const visualizationInvalidator =
    deps.visualizationInvalidator ?? new NoopVisualizationInvalidation();
  const cache = new MetricLogCacheRedis(visualizationInvalidator);
  const access = new MetricAccessSequelize();
  const queryRepo = new MetricLogQueryRepoSequelize();

  return {
    createLog: new CreateMetricLog(repo, access, cache),
    getLog: new GetMetricLog(repo),
    updateLog: new UpdateMetricLog(repo, cache),
    deleteLog: new DeleteMetricLog(repo, cache),
    getStats: new GetMetricLogStats(access),
    generateDummyLogs: new GenerateDummyMetricLogs(access, cache),
    listLogs: new ListMetricLogs(queryRepo),
  };
};
