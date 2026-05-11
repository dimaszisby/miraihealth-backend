import { PersistenceTransaction } from "./PersistenceTransaction.js";

export interface MetricSettingsPort {
  createDefault(
    metricId: string,
    organizationId: string,
    tx?: PersistenceTransaction,
  ): Promise<void>;
}
