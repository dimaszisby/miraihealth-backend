import amqp, { type AmqpConnectionManager } from "amqp-connection-manager";
import { env } from "@config/envManager.js";
import logger from "@utils/logger.js";

let connection: AmqpConnectionManager | null = null;

const buildAmqpUrl = (): string => {
  if (env.RABBITMQ_URL) return env.RABBITMQ_URL;

  const vhost =
    env.RABBITMQ_VHOST === "/" ? "/" : encodeURIComponent(env.RABBITMQ_VHOST);
  return `amqp://${env.RABBITMQ_USER}:${env.RABBITMQ_PASSWORD}@${env.RABBITMQ_HOST}:${env.RABBITMQ_PORT}/${vhost}`;
};

export const connectRabbitMQ = (): AmqpConnectionManager => {
  if (connection) return connection;

  connection = amqp.connect([buildAmqpUrl()]);

  connection.on("connect", () => logger.info("[RABBITMQ] Connected."));
  connection.on("disconnect", ({ err }: { err?: Error }) =>
    logger.warn("[RABBITMQ] Disconnected.", { reason: err?.message }),
  );
  connection.on("connectFailed", ({ err }: { err?: Error }) =>
    logger.error("[RABBITMQ] Connection failed.", { reason: err?.message }),
  );

  return connection;
};

export const disconnectRabbitMQ = async (): Promise<void> => {
  if (!connection) return;
  try {
    await connection.close();
    connection = null;
    logger.info("[RABBITMQ] Connection closed.");
  } catch (error) {
    logger.error("[RABBITMQ] Error closing connection:", error);
  }
};

export const getRabbitMQConnection = (): AmqpConnectionManager | null =>
  connection;
