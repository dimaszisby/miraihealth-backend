import { createLogger, format, transports } from "winston";

const { combine, timestamp, colorize, printf, errors, splat } = format;

/**
 * Shared logger for CLI/util scripts so we avoid raw console usage while still
 * streaming readable output to stdout/stderr.
 */
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), errors({ stack: true }), splat()),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        printf(({ timestamp: ts, level, message, stack }) => {
          const upperLevel = level.toUpperCase();
          const body = stack || message;
          return `${ts} [${upperLevel}]: ${body}`;
        }),
      ),
    }),
  ],
  exitOnError: false,
});

export default logger;
