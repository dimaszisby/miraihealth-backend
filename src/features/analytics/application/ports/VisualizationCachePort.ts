import type { VizResponse } from "../../domain/types.js";
import type {
  DashboardVizResponse,
  DashboardVisualizationParams,
  VisualizationQueryParams,
} from "./VisualizationReadRepository.js";

export type SingleVizCacheKey = Omit<
  VisualizationQueryParams,
  "bucketSpec" | "tz"
> & { bucketIso: string; tz: string };

export type DashboardVizCacheKey = Omit<
  DashboardVisualizationParams,
  "bucketSpec" | "limit"
> & {
  bucketIso: string;
  metricIds: string[];
  versionCursor?: string;
};

export interface VisualizationCachePort {
  getSingleVisualization(params: SingleVizCacheKey): Promise<VizResponse | null>;
  setSingleVisualization(
    params: SingleVizCacheKey,
    payload: VizResponse
  ): Promise<void>;
  getDashboardVisualization(
    params: DashboardVizCacheKey
  ): Promise<DashboardVizResponse | null>;
  setDashboardVisualization(
    params: DashboardVizCacheKey,
    payload: DashboardVizResponse
  ): Promise<void>;
}
