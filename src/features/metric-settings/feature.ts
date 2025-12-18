import { MetricSettingsRepositorySequelize } from "./infrastructure/persistence/MetricSettingsRepositorySequelize";
import { MetricSettingsCacheInvalidator } from "./infrastructure/providers/MetricSettingsCacheInvalidator";
import { MetricAccessSequelize } from "./infrastructure/providers/MetricAccessSequelize";
import { CreateMetricSettings } from "./application/use-cases/CreateMetricSettings";
import { GetMetricSettings } from "./application/queries/GetMetricSettings";
import { UpdateMetricSettings } from "./application/use-cases/UpdateMetricSettings";
import { DeleteMetricSettings } from "./application/use-cases/DeleteMetricSettings";
import { UpdateGoalAchievement } from "./application/use-cases/UpdateGoalAchievement";
import { UpdateDisplayOptions } from "./application/use-cases/UpdateDisplayOptions";
import { ListMetricSettingsViaCursor } from "./application/queries/ListMetricSettingsViaCursor";

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
