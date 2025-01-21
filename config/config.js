module.exports = {
  development: {
    url: process.env.DEVELOPMENT_DATABASE_URL,
    // username: process.env.DB_USERNAME || 'postgres',
    // password: process.env.DB_PASSWORD || 'password',
    database: 'miraihealth',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log, // Enable detailed logging
    dialectOptions: {
      // Ensure search_path includes 'public'
      options: '-c search_path=public'
    }
  },
  test: {
    url: process.env.TEST_DATABASE_URL,
    // username: process.env.DB_USERNAME || 'postgres',
    // password: process.env.DB_PASSWORD || 'password',
    database: 'miraihealth_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Optional: Disable logging for cleaner test output
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
  },
};
