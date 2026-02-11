import { jest } from "@jest/globals";
import AppError from "@/utils/AppError.js";
import { UpdateGoalAchievement } from "@/features/metric-settings/application/use-cases/UpdateGoalAchievement.js";
import { MetricSettingsRepository } from "@/features/metric-settings/domain/repositories/MetricSettingsRepository.js";
import { CacheInvalidationPort } from "@/features/metric-settings/application/ports/CacheInvalidationPort.js";
import { buildMetricSettings } from "../../../factories/metric-settings.js";

type RepoMock = jest.Mocked<MetricSettingsRepository>;
type CacheMock = jest.Mocked<CacheInvalidationPort>;

const setup = () => {
  const repo: RepoMock = {
    create: jest.fn(),
    findByMetricId: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    listByCursor: jest.fn(),
  };

  const cache: CacheMock = {
    invalidate: jest.fn(),
  };

  const sut = new UpdateGoalAchievement(repo, cache);
  return { sut, repo, cache };
};

describe("UpdateGoalAchievement", () => {
  it("requires authenticated user", async () => {
    const { sut } = setup();
    await expect(sut.execute("", "settings-1")).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("throws when settings cannot be found", async () => {
    const { sut, repo } = setup();
    repo.findById.mockResolvedValue(null);

    await expect(sut.execute("user-1", "settings-1")).rejects.toBeInstanceOf(
      AppError,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("marks goal achieved, saves, and invalidates cache", async () => {
    const { sut, repo, cache } = setup();
    const entity = buildMetricSettings({
      id: "settings-12",
      metricId: "metric-45",
      isAchieved: false,
    });
    const markSpy = jest.spyOn(entity, "markAchieved");
    repo.findById.mockResolvedValue(entity);
    repo.save.mockResolvedValue(entity);
    cache.invalidate.mockResolvedValue();

    const result = await sut.execute("user-2", "settings-12");

    expect(markSpy).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(entity);
    expect(cache.invalidate).toHaveBeenCalledWith(
      "user-2",
      "metric-45",
      "settings-12",
    );
    expect(result).toBe(entity);
  });
});
