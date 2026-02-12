const path = require("path");
const dotenv = require("dotenv");

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(envFile) });

function loadEnvFromBuild() {
  const distPath = path.resolve(__dirname, "..", "..", "dist", "config", "envManager.js");
  try {
    const { loadEnvOrExit } = require(distPath);
    return loadEnvOrExit();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? error.code
        : undefined;
    const hint =
      errorCode === "MODULE_NOT_FOUND"
        ? `Ensure the project is built (npm run build) so ${distPath} exists.`
        : "";
    throw new Error(
      `[ERROR] Failed to load validated environment configuration: ${message} ${hint}`.trim()
    );
  }
}

const env = loadEnvFromBuild();

const buildSslOptions = () => ({
  require: true,
  rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
});

const config = {
  development: {
    url: env.DEVELOPMENT_DATABASE_URL,
    dialect: "postgres",
    logging: console.log,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialectOptions: { ssl: false },
  },
  test: {
    url: env.TEST_DATABASE_URL,
    dialect: "postgres",
    logging: false,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialectOptions: { ssl: false },
  },
  staging: {
    url: env.STAGING_DATABASE_URL,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: buildSslOptions(),
    },
  },
  production: {
    url: env.PRODUCTION_DATABASE_URL,
    dialect: "postgres",
    logging: env.DB_LOGGING === "true" ? console.log : false,
    dialectOptions: {
      ssl: buildSslOptions(),
    },
  },
};

// Ensure the environment exists
const activeEnv = env.NODE_ENV;
if (!Object.prototype.hasOwnProperty.call(config, activeEnv)) {
  throw new Error(
    `[ERROR]: No configuration found for environment: ${activeEnv}`,
  );
}

module.exports = config;
