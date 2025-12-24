import { randomUUID } from "node:crypto";
import { MetricDomain } from "@/types/domain/metric.domain.js";

export type MetricProps = {
  id: string;
  userId: string;
  name: string;
  defaultUnit: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string | null;
  originalMetricId?: string | null;
  description?: string | null;
  deletedAt?: Date | null;
};

const MAX_NAME_LENGTH = 128;
const MAX_UNIT_LENGTH = 32;
const MAX_DESCRIPTION_LENGTH = 512;

export class Metric implements MetricDomain {
  private constructor(private props: MetricProps) {}

  static fromProps(props: MetricProps) {
    return new Metric(props);
  }

  static createDraft(
    props: Omit<MetricProps, "id" | "createdAt" | "updatedAt">,
  ) {
    const now = new Date();
    return new Metric({
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  rename(next: string) {
    const value = next.trim();
    if (!value) throw new Error("Metric name cannot be empty");
    if (value.length > MAX_NAME_LENGTH)
      throw new Error("Metric name exceeds length limit");
    this.props.name = value;
    this.touch();
  }

  describe(next: string | null) {
    if (next && next.length > MAX_DESCRIPTION_LENGTH)
      throw new Error("Metric description exceeds length limit");
    this.props.description = next ?? null;
    this.touch();
  }

  setDefaultUnit(unit: string) {
    const normalized = unit.trim();
    if (!normalized) throw new Error("Default unit cannot be empty");
    if (normalized.length > MAX_UNIT_LENGTH)
      throw new Error("Default unit exceeds length limit");
    this.props.defaultUnit = normalized;
    this.touch();
  }

  moveToCategory(categoryId: string | null) {
    this.props.categoryId = categoryId;
    this.touch();
  }

  togglePublic(value: boolean) {
    this.props.isPublic = value;
    this.touch();
  }

  softDelete() {
    this.props.deletedAt = new Date();
  }

  update(
    data: Partial<{
      name: string;
      description: string | null;
      defaultUnit: string;
      categoryId: string | null;
      isPublic: boolean;
    }>,
  ) {
    if (data.name !== undefined) this.rename(data.name);
    if (data.description !== undefined) this.describe(data.description);
    if (data.defaultUnit !== undefined) this.setDefaultUnit(data.defaultUnit);
    if (data.categoryId !== undefined) this.moveToCategory(data.categoryId);
    if (data.isPublic !== undefined) this.togglePublic(data.isPublic);
  }

  snapshot() {
    return { ...this.props };
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get name() {
    return this.props.name;
  }
  get description() {
    return this.props.description ?? null;
  }
  get defaultUnit() {
    return this.props.defaultUnit;
  }
  get isPublic() {
    return this.props.isPublic;
  }
  get categoryId() {
    return this.props.categoryId ?? null;
  }
  get originalMetricId() {
    return this.props.originalMetricId ?? null;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get deletedAt() {
    return this.props.deletedAt ?? null;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }
}
