import { GetVisualization } from "./application/queries/GetVisualization.js";
import { GetDashboardVisualization } from "./application/queries/GetDashboardVisualization.js";
import { getMetricTrend } from "./application/queries/getMetricTrend.js";
import { VisualizationReadRepoSequelize } from "./infrastructure/persistence/VisualizationReadRepoSequelize.js";
import { VisualizationCacheRedis } from "./infrastructure/cache/VisualizationCacheRedis.js";

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
