import { Metric } from "../entities/Metric.js";
import { PersistenceTransaction } from "../../application/ports/PersistenceTransaction.js";

export type CreateMetricDTO = {
  userId: string;
  categoryId?: string | null;
  originalMetricId?: string | null;
  name: string;
  description?: string | null;
  defaultUnit: string;
  isPublic: boolean;
};

export interface MetricRepository {
  existsByName(userId: string, name: string): Promise<boolean>;
  categoryExists(userId: string, categoryId: string): Promise<boolean>;
  create(
    data: CreateMetricDTO,
    tx: PersistenceTransaction
  ): Promise<Metric>;
  findOwnedById(userId: string, metricId: string): Promise<Metric>;
  save(metric: Metric): Promise<Metric>;
  delete(metric: Metric): Promise<void>;
}
