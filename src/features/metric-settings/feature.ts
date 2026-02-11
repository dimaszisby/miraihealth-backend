import { MetricSettingsRepositorySequelize } from "./infrastructure/persistence/MetricSettingsRepositorySequelize.js";
import { MetricSettingsCacheInvalidator } from "./infrastructure/providers/MetricSettingsCacheInvalidator.js";
import { MetricAccessSequelize } from "./infrastructure/providers/MetricAccessSequelize.js";
import { CreateMetricSettings } from "./application/use-cases/CreateMetricSettings.js";
import { GetMetricSettings } from "./application/queries/GetMetricSettings.js";
import { UpdateMetricSettings } from "./application/use-cases/UpdateMetricSettings.js";
import { DeleteMetricSettings } from "./application/use-cases/DeleteMetricSettings.js";
import { UpdateGoalAchievement } from "./application/use-cases/UpdateGoalAchievement.js";
import { UpdateDisplayOptions } from "./application/use-cases/UpdateDisplayOptions.js";
import { ListMetricSettingsViaCursor } from "./application/queries/ListMetricSettingsViaCursor.js";

export const buildMetricSettingsFeature = () => {
  const repo = new MetricSettingsRepositorySequelize();
  const cache = new MetricSettingsCacheInvalidator();
  const metricAccess = new MetricAccessSequelize();

  return {
    createSettings: new CreateMetricSettings(repo, cache, metricAccess),
    getSettings: new GetMetricSettings(repo),
    listSettings: new ListMetricSettingsViaCursor(repo),
    updateSettings: new UpdateMetricSettings(repo, cache),
    deleteSettings: new DeleteMetricSettings(repo, cache),
    updateGoalAchievement: new UpdateGoalAchievement(repo, cache),
    updateDisplayOptions: new UpdateDisplayOptions(repo, cache),
  };
};
