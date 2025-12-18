import { jest } from "@jest/globals";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "@/types/request.context";
import type { buildMetricFeature } from "@/features/metric";

type ControllerModule = typeof import("@/features/metric/infrastructure/http/controller");
let createMetric: ControllerModule["createMetric"];
let getUserDetailMetricById: ControllerModule["getUserDetailMetricById"];
let deleteMetric: ControllerModule["deleteMetric"];
let overrideMetricFeatureForTest: ControllerModule["overrideMetricFeatureForTest"];

type MetricFeature = ReturnType<typeof buildMetricFeature>;

const createMetricExecute = jest.fn<(payload: any) => Promise<any>>();
const updateMetricExecute = jest.fn<(payload: any) => Promise<any>>();
const deleteMetricExecute = jest.fn<(payload: any) => Promise<any>>();
const getMetricDetailExecute = jest.fn<(payload: any) => Promise<any>>();
const generateDummyMetricsExecute = jest.fn<(payload: any) => Promise<any>>();

const userId = "00000000-0000-0000-0000-000000000001";
const metricId = "11111111-1111-1111-1111-111111111111";

const buildFeatureMocks = (): MetricFeature =>
  ({
    createMetric: { execute: createMetricExecute },
    updateMetric: { execute: updateMetricExecute },
    deleteMetric: { execute: deleteMetricExecute },
    getMetricDetail: { execute: getMetricDetailExecute },
    generateDummyMetrics: { execute: generateDummyMetricsExecute },
  } as unknown as MetricFeature);

const loadController = async () => {
  const controller = await import(
    "@/features/metric/infrastructure/http/controller"
  );
  createMetric = controller.createMetric;
  getUserDetailMetricById = controller.getUserDetailMetricById;
  deleteMetric = controller.deleteMetric;
  overrideMetricFeatureForTest = controller.overrideMetricFeatureForTest;
};

const res = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }) as unknown as Response;

const next: NextFunction = jest.fn();

beforeAll(async () => {
  await loadController();
  overrideMetricFeatureForTest(buildFeatureMocks());
});

describe("Metric HTTP controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    overrideMetricFeatureForTest(buildFeatureMocks());
  });

  it("creates metric via use case", async () => {
    const metric = {
      id: "metric-1",
      userId: "user-1",
      name: "Steps",
      description: null,
      categoryId: null,
      originalMetricId: null,
      defaultUnit: "steps",
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    createMetricExecute.mockResolvedValue(metric);

    const req = {
      user: { id: userId },
      body: {
        name: "Steps",
        defaultUnit: "steps",
        isPublic: true,
      },
    } as unknown as AuthRequest;

    const response = res();
    await createMetric(req, response, next);

    expect(createMetricExecute).toHaveBeenCalledWith({
      userId,
      name: "Steps",
      defaultUnit: "steps",
      isPublic: true,
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "Metric created successfully",
        data: expect.objectContaining({ id: "metric-1" }),
      })
    );
  });

  it("gets metric detail via feature use case", async () => {
    const metric = {
      id: "metric-1",
      userId: "user-1",
      name: "Steps",
      defaultUnit: "steps",
      isPublic: true,
      categoryId: null,
      originalMetricId: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      logs: [],
    };
    getMetricDetailExecute.mockResolvedValue(metric);

    const req = {
      user: { id: userId },
      params: { id: metricId },
      query: { include: "full", logsLimit: 10 },
    } as unknown as AuthRequest;

    const response = res();
    await getUserDetailMetricById(req, response, next);

    expect(getMetricDetailExecute).toHaveBeenCalledWith({
      userId,
      metricId,
      includes: ["settings", "category", "logs"],
      logsLimit: 10,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Metric extended detail retrieved successfully",
        data: expect.objectContaining({ id: "metric-1" }),
      })
    );
  });

  it("deletes metric via use case", async () => {
    const metric = {
      id: "metric-1",
      userId: "user-1",
      name: "Steps",
      defaultUnit: "steps",
      isPublic: true,
      categoryId: null,
      originalMetricId: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    deleteMetricExecute.mockResolvedValue(metric);

    const req = {
      user: { id: userId },
      params: { id: metricId },
    } as unknown as AuthRequest;

    const response = res();
    await deleteMetric(req, response, next);

    expect(deleteMetricExecute).toHaveBeenCalledWith({
      userId,
      metricId,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Metric deleted successfully",
        data: expect.objectContaining({ id: "metric-1" }),
      })
    );
  });
});
