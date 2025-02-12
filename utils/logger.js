// utils/logger.js

/**
 * * Logging using Winston
 * This is a template for base logging format
 * Might be overhauled later
 */

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, errors } = format;

// 1. Define custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// 2. Create Winston logger instance
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // Capture stack trace
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "miraihealth-backend" },
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }), // Error logs
    new transports.File({ filename: "logs/combined.log" }), // All logs
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// If not in production, log to the console as well
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: combine(format.colorize(), logFormat),
    })
  );
}

module.exports = logger;
