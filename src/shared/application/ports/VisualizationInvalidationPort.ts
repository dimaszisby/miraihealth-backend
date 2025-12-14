export interface VisualizationInvalidationPort {
  invalidateByMetric(userId: string, metricId: string): Promise<void>;
}

export class NoopVisualizationInvalidation
  implements VisualizationInvalidationPort
{
  async invalidateByMetric(): Promise<void> {
    // intentional noop
  }
}
