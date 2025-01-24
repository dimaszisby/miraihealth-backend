const redis = require("redis");
const { promisify } = require("util");
const logger = require("./logger");
const config = require("../config/config");

const redisClient = redis.createClient({
  socket: {
    host: config.development.redis.host,
    port: config.development.redis.port,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  // TODO: Additional configurations like TLS, etc., for production
});

// Connect to Redis
redisClient.connect().catch((err) => {
  logger.error("Redis connection error:", err);
});

// Handle Redis events
redisClient.on("error", (err) => {
  logger.error("Redis error:", err);
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

module.exports = {
  redisClient,
};
