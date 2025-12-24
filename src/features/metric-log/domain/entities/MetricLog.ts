import { randomUUID } from "node:crypto";

export type MetricLogProps = {
  id: string;
  metricId: string;
  logValue: number;
  type: "manual" | "automatic";
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const MIN_VALUE = -1_000_000;
const MAX_VALUE = 1_000_000;

export class MetricLog {
  private constructor(private props: MetricLogProps) {}

  static fromProps(props: MetricLogProps) {
    return new MetricLog(props);
  }

  static createDraft(
    props: Omit<MetricLogProps, "id" | "createdAt" | "updatedAt">,
  ) {
    const now = new Date();
    return new MetricLog({
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  setLogValue(next: number) {
    if (!Number.isFinite(next))
      throw new Error("Metric log value must be a finite number");
    if (next < MIN_VALUE || next > MAX_VALUE)
      throw new Error("Metric log value out of supported range");
    this.props.logValue = next;
    this.touch();
  }

  setType(next: "manual" | "automatic") {
    this.props.type = next;
    this.touch();
  }

  setLoggedAt(date: Date) {
    if (Number.isNaN(date.getTime()))
      throw new Error("Metric log timestamp is invalid");
    this.props.loggedAt = date;
    this.touch();
  }

  get id() {
    return this.props.id;
  }
  get metricId() {
    return this.props.metricId;
  }
  get logValue() {
    return this.props.logValue;
  }
  get type() {
    return this.props.type;
  }
  get loggedAt() {
    return this.props.loggedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }
}
