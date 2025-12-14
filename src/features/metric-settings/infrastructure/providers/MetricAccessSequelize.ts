import { validateMetricAccess } from "@/utils/db-helper";
import { MetricAccessPort } from "../../application/ports/MetricAccessPort";

export class MetricAccessSequelize implements MetricAccessPort {
  async ensureMetricOwnership(userId: string, metricId: string): Promise<void> {
    await validateMetricAccess(userId, metricId);
  }
}
