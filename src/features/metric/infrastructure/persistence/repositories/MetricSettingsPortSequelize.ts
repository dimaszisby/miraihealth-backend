import { models } from "@/models";
import { Transaction } from "sequelize";
import { MetricSettingsPort } from "../../../application/ports/MetricSettingsPort";
import { PersistenceTransaction } from "../../../application/ports/PersistenceTransaction";

export class MetricSettingsPortSequelize implements MetricSettingsPort {
  async createDefault(
    metricId: string,
    tx: PersistenceTransaction
  ): Promise<void> {
    const transaction = tx as Transaction;
    await models.MetricSettings.create(
      {
        metricId,
        goalEnabled: false,
        goalType: null,
        goalValue: null,
        timeFrameEnabled: false,
        startDate: null,
        deadlineDate: null,
        alertEnabled: false,
        alertThresholds: 80,
        isAchieved: false,
        isActive: true,
        displayOptions: {
          showOnDashboard: true,
          priority: 1,
          chartType: "line",
          color: "#E897A3",
        },
      },
      { transaction }
    );
  }
}
