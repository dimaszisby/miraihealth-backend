// TODO: Load Redis based on env variables
module.exports = {
  development: {
    url: process.env.DEVELOPMENT_DATABASE_URL,
    database: 'miraihealth',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log, // Enable detailed logging
    dialectOptions: {
      // Ensure search_path includes 'public'
      options: '-c search_path=public'
    },
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
  test: {
    url: process.env.TEST_DATABASE_URL,
    database: 'miraihealth_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Optional: Disable logging for cleaner test output
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  },
};
