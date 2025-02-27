// src/types/user.types.ts

export interface MetricLogBase {
  type: "manual" | "automatic";
  logValue: number;
  loggedAt?: Date;
}
