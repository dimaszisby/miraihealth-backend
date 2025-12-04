import { PersistenceTransaction } from "./PersistenceTransaction";

export interface MetricSettingsPort {
  createDefault(metricId: string, tx?: PersistenceTransaction): Promise<void>;
}
