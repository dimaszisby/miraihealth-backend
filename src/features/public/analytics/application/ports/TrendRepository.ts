export type TrendQueryCriteria = {
  metricId: string;
  organizationId: string;
  since: Date;
};

export type TrendPoint = {
  date: Date;
  value: number;
};

export interface TrendRepository {
  findTrendPoints(criteria: TrendQueryCriteria): Promise<TrendPoint[]>;
}
