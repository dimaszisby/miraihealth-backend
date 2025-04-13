// src/types/domain/metric.domain.ts\

import { MetricCategoryDomain } from "./metric-category.domain";
import { MetricLogDomain } from "./metric-log.domain";
import { MetricSettingsDomain } from "./metric-settings.domain";

export interface MetricDomain {
  id: string;
  userId: string;
  categoryId?: string | null;
  originalMetricId?: string | null;
  name: string;
  description?: string | null;
  defaultUnit: string;
  isPublic: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricLibraryDomain {
  id: string;
  name: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  goalType?: string;
}

export type MetricLibraryListDomain = MetricLibraryDomain[];

// Extended type for Metric with relations using imported Domain types
export interface MetricDomainExtended extends MetricDomain {
  category?: MetricCategoryDomain;
  settings?: MetricSettingsDomain;
  logs?: MetricLogDomain[];
}
