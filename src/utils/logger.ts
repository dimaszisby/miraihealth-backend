import { createLogger, format, transports, Logger } from "winston";
import { SENSITIVE_KEY_PATTERN } from "../config/sensitive-keys.js";
import { requestIdStorage } from "@/shared/middleware/request-id.js";
import { APP_NAME } from "@/config/app-name.js";

const { combine, timestamp, printf, errors, colorize, json, splat } = format;
const nodeEnv = process.env.NODE_ENV || "development";

export function redactObject(obj: unknown, depth: number): unknown {
  if (depth >= 5 || obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1));
  }
  const record = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(record)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? "***REDACTED***"
      : redactObject(record[key], depth + 1);
  }
  return result;
}

const redactSensitive = format((info) => {
  const infoRecord = info as unknown as Record<string, unknown>;
  for (const key of Object.keys(infoRecord)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      infoRecord[key] = "***REDACTED***";
    } else if (
      infoRecord[key] !== null &&
      typeof infoRecord[key] === "object"
    ) {
      infoRecord[key] = redactObject(infoRecord[key], 1);
    }
  }
  return info;
});

const attachRequestId = format((info) => {
  const requestId = requestIdStorage.getStore();
  if (requestId) {
    (info as unknown as Record<string, unknown>).requestId = requestId;
  }
  return info;
});

const logFormat = printf(({ level, message, timestamp, stack, requestId }) => {
  const rid = requestId ? ` [${requestId}]` : "";
  return `${timestamp}${rid} [${String(level).toUpperCase()}]: ${String(stack || message)}`;
});

const logger: Logger = createLogger({
  level: "info",
  format: combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    attachRequestId(),
    redactSensitive(),
    json(),
  ),
  defaultMeta: { service: APP_NAME },
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
  exitOnError: false,
});

if (nodeEnv !== "production") {
  logger.add(
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
  );
}

export default logger;
