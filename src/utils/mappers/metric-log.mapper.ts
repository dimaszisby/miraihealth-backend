// src/utils/mappers/metric-log.mapper.ts

import { MetricLog } from "@/models/metric-log.model";
import { MetricLogDomain } from "@/types/domain/metric-log.domain";
import { MetricLogListResponseDTO, MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";

/**
 * * Sequelize → Domain Mapper
 */
export const toDomainMetricLog = (log: MetricLog): MetricLogDomain => ({
  id: log.id,
  metricId: log.metricId,
  type: log.type,
  logValue: log.logValue,
  loggedAt: new Date(log.loggedAt),
  createdAt: new Date(log.createdAt!),
  updatedAt: new Date(log.updatedAt!),
});

/**
 * * Sequelize[] → Domain[] Mapper
 */
export const toDomainMetricLogs = (logs: MetricLog[]): MetricLogDomain[] =>
  logs.map(toDomainMetricLog);

/**
 * * Domain → Response DTO
 */
export const toMetricLogResponseDTO = (
  domain: MetricLogDomain
): MetricLogResponseDTO => ({
  id: domain.id,
  metricId: domain.metricId,
  type: domain.type,
  logValue: domain.logValue,
  loggedAt: domain.loggedAt.toISOString(),
  createdAt: domain.createdAt.toISOString(),
  updatedAt: domain.updatedAt.toISOString(),
});

/**
 * * Domain[] → Response DTO[]
 */
export const toMetricLogListResponseDTO = (
  logs: MetricLogDomain[]
): MetricLogListResponseDTO => logs.map(toMetricLogResponseDTO);
