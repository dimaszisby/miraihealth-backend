import { GetVisualization } from "./application/queries/GetVisualization";
import { GetDashboardVisualization } from "./application/queries/GetDashboardVisualization";
import { getMetricTrend } from "./application/queries/getMetricTrend";
import { VisualizationReadRepoSequelize } from "./infrastructure/persistence/VisualizationReadRepoSequelize";
import { VisualizationCacheRedis } from "./infrastructure/cache/VisualizationCacheRedis";

class GetMetricTrendWrapper {
  async execute(params: Parameters<typeof getMetricTrend>[0]) {
    return getMetricTrend(params);
  }
}

export const buildAnalyticsFeature = () => {
  const cache = new VisualizationCacheRedis();
  const repo = new VisualizationReadRepoSequelize(cache);

  return {
    getVisualization: new GetVisualization(repo),
    getDashboardVisualization: new GetDashboardVisualization(repo),
    getMetricTrend: new GetMetricTrendWrapper(),
  };
};
