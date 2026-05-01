import { PersistenceTransaction } from "./PersistenceTransaction.js";

export interface MetricSettingsPort {
  createDefault(metricId: string, tx?: PersistenceTransaction): Promise<void>;
}
