export type MetricCategoryProps = {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metricCount: number; // read-model convenience field
};

import crypto from "node:crypto";
import { MetricCategoryName } from "../value-objects/MetricCategoryName.js";
import { MetricCategoryColor } from "../value-objects/MetricCategoryColor.js";
import { MetricCategoryIcon } from "../value-objects/MetricCategoryIcon.js";

export class MetricCategory {
  private constructor(private props: MetricCategoryProps) {}

  static fromProps(p: MetricCategoryProps) {
    return new MetricCategory(p);
  }

  static create(userId: string, params: { name: string; color?: string; icon?: string }) {
    return new MetricCategory({
      id: crypto.randomUUID(),
      userId,
      name: MetricCategoryName.create(params.name).toString(),
      color: MetricCategoryColor.create(params.color).toString(),
      icon: MetricCategoryIcon.create(params.icon).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metricCount: 0,
    });
  }

  rename(next: string) {
    this.props.name = MetricCategoryName.create(next).toString();
    this.touch();
  }

  recolor(hex: string) {
    this.props.color = MetricCategoryColor.create(hex).toString();
    this.touch();
  }

  reicon(icon: string) {
    this.props.icon = MetricCategoryIcon.create(icon).toString();
    this.touch();
  }

  softDelete() {
    this.props.deletedAt = new Date();
  }

  // getters only expose readonly view
  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get name() {
    return this.props.name;
  }
  get color() {
    return this.props.color;
  }
  get icon() {
    return this.props.icon;
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
  get metricCount() {
    return this.props.metricCount;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }
}
