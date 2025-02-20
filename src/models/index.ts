// src/models/index.ts

import fs from "fs";
import path from "path";
import { Sequelize, DataTypes, Options } from "sequelize";
import { fileURLToPath } from "url";
import { env } from "../config/zodEnv.js";
import { createRequire } from "module";

/**
 * Prepare the Sequelize instance and models.
 */

const require = createRequire(import.meta.url);
const configData = require("../config/config.cjs");

// Get the current filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

// ✅ Ensure environment mode is set correctly
const activeEnv = env.NODE_ENV || "development";

// ✅ Validate config availability
if (!configData[activeEnv]) {
  throw new Error(
    `❌ ERROR: No configuration found for environment: ${activeEnv}`
  );
}

const config = configData[activeEnv] as CustomSequelizeOptions;

// Define a custom Sequelize options interface
interface CustomSequelizeOptions extends Options {
  use_env_variable?:
    | "DEVELOPMENT_DATABASE_URL"
    | "TEST_DATABASE_URL"
    | "STAGING_DATABASE_URL"
    | "PRODUCTION_DATABASE_URL";
}

// ✅ Initialize Sequelize with the correct database connection
const sequelize = config.use_env_variable
  ? new Sequelize(env[config.use_env_variable] as string, config) // Use the environment variable
  : new Sequelize(
      config.database as string,
      config.username as string,
      config.password as string,
      config
    );

// Define the DB models
import type { User } from "./user.js";
import type { Metric } from "./metric.js";
import type { MetricSettings } from "./metric-settings.js";
import type { MetricLog } from "./metric-log.js";
import type { MetricCategory } from "./metric-category.js";

// Define the DB models interface
export interface DBModels {
  User: typeof User;
  Metric: typeof Metric;
  MetricSettings: typeof MetricSettings;
  MetricLog: typeof MetricLog;
  MetricCategory: typeof MetricCategory;
}

// Extend the interface to include Sequelize instance info.
export interface DB extends DBModels {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}

/**
 * Dynamically load all models and associate them.
 */
// Cast the selected config to our custom interface
// ✅ Load all models dynamically
const initializeDB = async () => {
  const db = {} as DB;

  // ✅ Ensure correct file extensions based on environment
  const fileExtensions = activeEnv === "production" ? [".js"] : [".js", ".ts"];
  const files = fs.readdirSync(__dirname).filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      fileExtensions.some((ext) => file.endsWith(ext)) &&
      !file.endsWith(".test.js") &&
      !file.endsWith(".test.ts")
    );
  });

  console.log("🔍 Found model files:", files);

  // ✅ Load each model dynamically
  const modelImports = await Promise.all(
    files.map((file) => import(path.join(__dirname, file)))
  );

  modelImports.forEach((modelImport) => {
    // ✅ Initialize each model
    const model = modelImport.default(sequelize, DataTypes);
    db[model.name as keyof DBModels] = model;
    console.log(`✅ Loaded model: ${model.name}`);
  });

  // ✅ Associate models if applicable
  Object.keys(db).forEach((modelName) => {
    if (modelName === "sequelize" || modelName === "Sequelize") return;
    const model = db[modelName as keyof DBModels];
    if (model && "associate" in model) {
      (model as any).associate(db);
      console.log(`🔗 Associated model: ${modelName}`);
    }
  });

  console.log("📌 Registered Models:", Object.keys(db));

  // ✅ Attach Sequelize instance to DB object
  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
};

export default initializeDB;
