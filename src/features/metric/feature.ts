import { MetricRepoSequelize } from "./infrastructure/persistence/repositories/MetricRepoSequelize";
import { MetricSettingsPortSequelize } from "./infrastructure/persistence/repositories/MetricSettingsPortSequelize";
import { MetricCacheRedis } from "./infrastructure/cache/MetricCacheRedis";
import { SequelizeTransactionPort } from "./infrastructure/persistence/SequelizeTransactionPort";
import { UpdateMetric } from "./application/use-cases/UpdateMetric";
import { DeleteMetric } from "./application/use-cases/DeleteMetric";
import { GenerateDummyMetrics } from "./application/use-cases/GenerateDummyMetrics";
import { GetMetricDetail } from "./application/queries/GetMetricDetail";
import { CreateMetric } from "./application/use-cases/CreateMetric";
import { ListMetrics } from "./application/queries/ListMetrics";
import { MetricReadRepoSequelize } from "./infrastructure/persistence/repositories/MetricReadRepoSequelize";

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
