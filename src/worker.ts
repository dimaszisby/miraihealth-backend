import { env } from "./config/envManager.js";
import logger from "./utils/logger.js";
import {
  connectRabbitMQ,
  disconnectRabbitMQ,
} from "./shared/infrastructure/queue/RabbitMQConnection.js";
import { RabbitMQConsumer } from "./shared/infrastructure/queue/RabbitMQConsumer.js";
import { QUEUES } from "./shared/infrastructure/queue/topology.js";
import { loadModels } from "./infrastructure/db/models.js";
import sequelize from "./config/db.js";
import { MetricAccessSequelize } from "./features/metric-log/infrastructure/access/MetricAccessSequelize.js";
import { MetricLogCacheRedis } from "./features/metric-log/infrastructure/cache/MetricLogCacheRedis.js";
import { NoopVisualizationInvalidation } from "./shared/application/ports/VisualizationInvalidationPort.js";
import { GenerateDummyMetricLogsHandler } from "./features/metric-log/application/use-cases/GenerateDummyMetricLogsHandler.js";

if (!env.RABBITMQ_ENABLED) {
  logger.error(
    "[WORKER] RABBITMQ_ENABLED is false. Set it to true to run the worker.",
  );
  process.exit(1);
}

const workers: RabbitMQConsumer[] = [];

const startWorker = async (): Promise<void> => {
  logger.info("[WORKER] Starting...");

  loadModels();
  await sequelize.authenticate();
  logger.info("[WORKER] Database connected.");

  connectRabbitMQ();
  logger.info("[WORKER] RabbitMQ connection initiated.");

  // --- Consumers ---

  const access = new MetricAccessSequelize();
  const cache = new MetricLogCacheRedis(new NoopVisualizationInvalidation());
  const dummyLogsHandler = new GenerateDummyMetricLogsHandler(access, cache);

  workers.push(
    new RabbitMQConsumer({
      queue: QUEUES.METRIC_LOG_GENERATE_DUMMY,
      handler: (msg) => dummyLogsHandler.handle(msg),
    }),
  );

  logger.info("[WORKER] Ready. Waiting for messages.");
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`[WORKER] Received ${signal}, shutting down...`);
  try {
    await Promise.all(workers.map((w) => w.close()));
    logger.info("[WORKER] All consumers drained.");

    await disconnectRabbitMQ();
    logger.info("[WORKER] RabbitMQ disconnected.");

    await sequelize.close();
    logger.info("[WORKER] Database disconnected.");

    process.exit(0);
  } catch (error) {
    logger.error("[WORKER] Error during shutdown:", error);
    process.exitCode = 1;
  }
};

["SIGTERM", "SIGINT"].forEach((signal) =>
  process.on(signal, () => shutdown(signal)),
);

process.on("uncaughtException", (error) => {
  logger.error("[WORKER] Uncaught exception:", error);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.error("[WORKER] Unhandled rejection:", reason);
  shutdown("unhandledRejection");
});

startWorker().catch((error) => {
  logger.error("[WORKER] Failed to start:", error);
  process.exit(1);
});
