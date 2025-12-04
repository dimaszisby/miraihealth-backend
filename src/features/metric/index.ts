import { CreateMetric } from "./application/use-cases/CreateMetric";
import { MetricRepoSequelize } from "./infrastructure/persistence/repositories/MetricRepoSequelize";
import { MetricSettingsPortSequelize } from "./infrastructure/persistence/repositories/MetricSettingsPortSequelize";
import { MetricCacheRedis } from "./infrastructure/cache/MetricCacheRedis";
import { SequelizeTransactionPort } from "./infrastructure/persistence/SequelizeTransactionPort";
import { UpdateMetric } from "./application/use-cases/UpdateMetric";
import { DeleteMetric } from "./application/use-cases/DeleteMetric";
import { GenerateDummyMetrics } from "./application/use-cases/GenerateDummyMetrics";
import { GetMetricDetail } from "./application/queries/GetMetricDetail";

export const buildMetricFeature = () => {
  const repo = new MetricRepoSequelize();
  const settings = new MetricSettingsPortSequelize();
  const cache = new MetricCacheRedis();
  const tx = new SequelizeTransactionPort();
  const getMetricDetail = new GetMetricDetail();

  return {
    createMetric: new CreateMetric(repo, settings, cache, tx),
    updateMetric: new UpdateMetric(cache),
    deleteMetric: new DeleteMetric(cache),
    getMetricDetail,
    generateDummyMetrics: new GenerateDummyMetrics(cache),
  };
};
