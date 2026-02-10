import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";
import { Op } from "sequelize";
import { MetricLogQueryRepoSequelize } from "@/features/metric-log/infrastructure/persistence/repositories/MetricLogQueryRepoSequelize.js";
import { models } from "@/infrastructure/db/models.js";

const repo = new MetricLogQueryRepoSequelize();

type AsyncMock<T = unknown> = jest.MockedFunction<
  (...args: any[]) => Promise<T>
>;

const makeRawLog = (
  overrides: Partial<ReturnType<typeof baseRawLog>> = {},
) => ({
  ...baseRawLog(),
  ...overrides,
});

const baseRawLog = () => ({
  id: "log-1",
  metricId: "metric-1",
  logValue: 10,
  type: "manual" as const,
  loggedAt: new Date("2025-01-01T00:00:00.000Z"),
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-02T00:00:00.000Z"),
});

const metricLogModel = {
  findAll: jest.fn() as AsyncMock<any[]>,
  count: jest.fn() as AsyncMock<number>,
};
const originalModel = models.MetricLog;

beforeAll(() => {
  (models as any).MetricLog = metricLogModel;
});

afterAll(() => {
  (models as any).MetricLog = originalModel;
});

describe("MetricLogQueryRepoSequelize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns paginated logs with cursor and total count when requested", async () => {
    metricLogModel.count.mockResolvedValue(5);
    const rows = [
      makeRawLog({ id: "log-10" }),
      makeRawLog({
        id: "log-11",
        createdAt: new Date("2025-01-02T00:00:00.000Z"),
      }),
    ];
    metricLogModel.findAll.mockResolvedValue(rows);

    const result = await repo.listLogs({
      userId: "user-9",
      limit: 1,
      sort: "-createdAt",
      includeTotal: true,
    });

    expect(metricLogModel.count).toHaveBeenCalledWith(
      expect.objectContaining({ include: expect.any(Array) }),
    );
    expect(metricLogModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
        include: expect.arrayContaining([
          expect.objectContaining({
            where: { userId: "user-9", deletedAt: null },
          }),
        ]),
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("log-10");
    expect(result.limit).toBe(1);
    expect(result.totalCount).toBe(5);
    expect(result.nextCursor).toBeDefined();

    const decoded = JSON.parse(
      Buffer.from(result.nextCursor!, "base64url").toString("utf8"),
    );
    expect(decoded).toMatchObject({
      sort: "-createdAt",
      id: "log-10",
      createdAt: new Date(rows[0].createdAt).toISOString(),
    });
  });

  it("applies filters, numeric search, cursor predicates, and clamps limit", async () => {
    metricLogModel.findAll.mockResolvedValue([]);
    const afterPayload = {
      sort: "-logValue",
      id: "log-77",
      logValue: 42,
    };
    const after = Buffer.from(JSON.stringify(afterPayload)).toString(
      "base64url",
    );

    await repo.listLogs({
      userId: "user-1",
      limit: 200,
      sort: "-logValue",
      filter: { metricId: "metric-1", logValue: 5 },
      q: "5",
      after,
      includeTotal: false,
    });

    const args = metricLogModel.findAll.mock.calls[0][0];
    expect(args.limit).toBe(101); // clamp to 100 + 1
    expect(args.order).toEqual([
      ["logValue", "DESC"],
      ["id", "DESC"],
    ]);
    const [baseWhere, cursorWhere] = args.where[Op.and];
    expect(baseWhere[Op.and]).toEqual(
      expect.arrayContaining([
        { metricId: "metric-1" },
        { logValue: 5 },
        { logValue: { [Op.eq]: 5 } },
      ]),
    );
    expect(cursorWhere[Op.or]).toBeDefined();
    expect(metricLogModel.count).not.toHaveBeenCalled();
  });
});
