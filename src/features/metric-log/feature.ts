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
import type { MessageQueuePort } from "@/shared/application/ports/MessageQueuePort.js";
import { NoopMessageQueue } from "@/shared/infrastructure/queue/NoopMessageQueue.js";

type MetricLogFeatureDeps = {
  visualizationInvalidator?: VisualizationInvalidationPort;
  messageQueue?: MessageQueuePort;
};

export const buildMetricLogFeature = (deps: MetricLogFeatureDeps = {}) => {
  const repo = new MetricLogRepoSequelize();
  const visualizationInvalidator =
    deps.visualizationInvalidator ?? new NoopVisualizationInvalidation();
  const cache = new MetricLogCacheRedis(visualizationInvalidator);
  const access = new MetricAccessSequelize();
  const queue = deps.messageQueue ?? new NoopMessageQueue();
  const queryRepo = new MetricLogQueryRepoSequelize();

  return {
    createLog: new CreateMetricLog(repo, access, cache),
    getLog: new GetMetricLog(repo),
    updateLog: new UpdateMetricLog(repo, cache),
    deleteLog: new DeleteMetricLog(repo, cache),
    getStats: new GetMetricLogStats(access),
    generateDummyLogs: new GenerateDummyMetricLogs(access, cache, queue),
    listLogs: new ListMetricLogs(queryRepo),
  };
};
