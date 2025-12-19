const path = require("path");
const dotenv = require("dotenv");
const { execFileSync } = require("child_process");

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(envFile) });

function loadValidatedEnv() {
  try {
    const repoRoot = path.resolve(__dirname, "..", "..");
    const inlineModule = `
      import("./src/config/zodEnv.ts")
        .then(({ env }) => {
          process.stdout.write(JSON.stringify(env));
        })
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
    `;
    const output = execFileSync(
      "node",
      ["--loader", "ts-node/esm", "-e", inlineModule],
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "inherit"],
        cwd: repoRoot,
      }
    ).trim();

    return JSON.parse(output);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `[ERROR] Failed to load validated environment configuration: ${message}`
    );
  }
}

const env = loadValidatedEnv();

const buildSslOptions = () =>
  env.DB_SSL_REJECT_UNAUTHORIZED
    ? { require: true, rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED }
    : false;

const config = {
  development: {
    url: env.DEVELOPMENT_DATABASE_URL,
    dialect: "postgres",
    logging: console.log,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialectOptions: { ssl: false },
  },
  test: {
    url: env.TEST_DATABASE_URL,
    dialect: "postgres",
    logging: false,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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
