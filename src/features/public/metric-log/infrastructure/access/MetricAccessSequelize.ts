import { validateMetricAccess } from "@/utils/db-helper.js";
import { MetricAccessPort } from "../../application/ports/MetricAccessPort.js";

export class MetricAccessSequelize implements MetricAccessPort {
  async ensureMetricOwnership(
    userId: string,
    organizationId: string,
    metricId: string,
  ): Promise<void> {
    await validateMetricAccess(userId, organizationId, metricId);
  }
}
