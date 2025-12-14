import { MetricLogRepoSequelize } from "./infrastructure/persistence/repositories/MetricLogRepoSequelize";
import { MetricLogCacheRedis } from "./infrastructure/cache/MetricLogCacheRedis";
import { MetricAccessSequelize } from "./infrastructure/access/MetricAccessSequelize";
import { CreateMetricLog } from "./application/use-cases/CreateMetricLog";
import { GetMetricLog } from "./application/queries/GetMetricLog";
import { UpdateMetricLog } from "./application/use-cases/UpdateMetricLog";
import { DeleteMetricLog } from "./application/use-cases/DeleteMetricLog";
import { GetMetricLogStats } from "./application/queries/GetMetricLogStats";
import { GenerateDummyMetricLogs } from "./application/use-cases/GenerateDummyMetricLogs";
import { MetricLogQueryRepoSequelize } from "./infrastructure/persistence/repositories/MetricLogQueryRepoSequelize";
import { ListMetricLogs } from "./application/queries/ListMetricLogs";

export const buildMetricLogFeature = () => {
  const repo = new MetricLogRepoSequelize();
  const cache = new MetricLogCacheRedis();
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
