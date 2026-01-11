import { createLogger, format, transports, Logger } from "winston";
const { combine, timestamp, printf, errors, colorize, json, splat } = format;
const nodeEnv = process.env.NODE_ENV || "development";

/**
 * * Winston Logging Utility
 * Provides a structured logging format.
 */

// 1. Define custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// 2. Create Winston logger instance
const logger: Logger = createLogger({
  level: "info",
  format: combine(
    timestamp(),
    errors({ stack: true }), // Capture stack trace
    splat(),
    json(),
  ),
  defaultMeta: { service: "lakira-backend" },
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }), // Error logs
    new transports.File({ filename: "logs/combined.log" }), // All logs
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// 3. Enable console logging in non-production environments.
// Use process.env directly to avoid envManager imports here, preventing circular dependencies.
if (nodeEnv !== "production") {
  logger.add(
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
  );
}

export default logger;
