import { Metric } from "../entities/Metric";
import { PersistenceTransaction } from "../../application/ports/PersistenceTransaction";

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
}
