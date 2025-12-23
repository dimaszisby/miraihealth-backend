import { MetricRepoSequelize } from "./infrastructure/persistence/repositories/MetricRepoSequelize.js";
import { MetricSettingsPortSequelize } from "./infrastructure/persistence/repositories/MetricSettingsPortSequelize.js";
import { MetricCacheRedis } from "./infrastructure/cache/MetricCacheRedis.js";
import { SequelizeTransactionPort } from "./infrastructure/persistence/SequelizeTransactionPort.js";
import { UpdateMetric } from "./application/use-cases/UpdateMetric.js";
import { DeleteMetric } from "./application/use-cases/DeleteMetric.js";
import { GenerateDummyMetrics } from "./application/use-cases/GenerateDummyMetrics.js";
import { GetMetricDetail } from "./application/queries/GetMetricDetail.js";
import { CreateMetric } from "./application/use-cases/CreateMetric.js";
import { ListMetrics } from "./application/queries/ListMetrics.js";
import { MetricReadRepoSequelize } from "./infrastructure/persistence/repositories/MetricReadRepoSequelize.js";

export const buildMetricFeature = () => {
  const repo = new MetricRepoSequelize();
  const settings = new MetricSettingsPortSequelize();
  const cache = new MetricCacheRedis();
  const tx = new SequelizeTransactionPort();
  const readRepo = new MetricReadRepoSequelize();

  return {
    createMetric: new CreateMetric(repo, settings, cache, tx),
    updateMetric: new UpdateMetric(repo, cache),
    deleteMetric: new DeleteMetric(repo, cache),
    getMetricDetail: new GetMetricDetail(readRepo),
    listMetrics: new ListMetrics(readRepo),
    generateDummyMetrics: new GenerateDummyMetrics(cache),
  };
};
